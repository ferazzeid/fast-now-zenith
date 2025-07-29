import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useRetryableSupabase } from '@/hooks/useRetryableSupabase';

interface UserProfile {
  id: string;
  user_id: string;
  weight?: number;
  height?: number;
  age?: number;
  daily_calorie_goal?: number;
  daily_carb_goal?: number;
  display_name?: string;
  units?: 'metric' | 'imperial';
  activity_level?: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extra_active';
  use_own_api_key?: boolean;
  openai_api_key?: string;
}

export const useProfile = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const { executeWithRetry } = useRetryableSupabase();

  const loadProfile = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const result = await executeWithRetry(async () => {
        return await supabase
          .from('profiles')
          .select('*, use_own_api_key, openai_api_key')
          .eq('user_id', user.id)
          .maybeSingle();
      });
      
      const { data, error } = result;

      if (error) {
        throw error;
      }

      setProfile(data || null);
    } catch (error) {
      console.error('Error loading profile:', error);
      toast({
        variant: "destructive",
        title: "Connection Error",
        description: "Unable to load profile. Please check your internet connection."
      });
    } finally {
      setLoading(false);
    }
  }, [user, executeWithRetry, toast]);

  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    if (!user) return { error: { message: 'User not authenticated' } };

    console.log('DEBUG: Starting profile update with data:', updates);
    setLoading(true);
    
    try {
      // Validate updates before attempting to save
      const validatedUpdates: any = { user_id: user.id };
      
      if (updates.age !== undefined) {
        if (typeof updates.age !== 'number' || updates.age < 10 || updates.age > 120) {
          throw new Error(`Invalid age: ${updates.age}. Must be between 10-120 years.`);
        }
        validatedUpdates.age = Math.round(updates.age);
      }
      
      if (updates.weight !== undefined) {
        if (typeof updates.weight !== 'number' || updates.weight < 20 || updates.weight > 500) {
          throw new Error(`Invalid weight: ${updates.weight}. Must be between 20-500 kg.`);
        }
        validatedUpdates.weight = Math.round(updates.weight * 10) / 10; // Round to 1 decimal
      }
      
      if (updates.height !== undefined) {
        if (typeof updates.height !== 'number' || updates.height < 100 || updates.height > 250) {
          throw new Error(`Invalid height: ${updates.height}. Must be between 100-250 cm.`);
        }
        validatedUpdates.height = Math.round(updates.height);
      }
      
      // Add other fields without validation
      Object.keys(updates).forEach(key => {
        if (!['age', 'weight', 'height'].includes(key)) {
          validatedUpdates[key] = updates[key as keyof UserProfile];
        }
      });

      console.log('DEBUG: Validated updates:', validatedUpdates);

      const result = await executeWithRetry(async () => {
        return await supabase
          .from('profiles')
          .upsert(validatedUpdates)
          .select()
          .single();
      });
      
      const { data, error } = result;
      console.log('DEBUG: Database result:', { data, error });

      if (error) {
        console.error('DEBUG: Database error details:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      if (!data) {
        throw new Error('No data returned from database update');
      }

      setProfile(data);
      console.log('DEBUG: Profile updated successfully:', data);
      
      toast({
        title: "Profile updated successfully!",
        description: `Updated: ${Object.keys(validatedUpdates).filter(k => k !== 'user_id').join(', ')}`
      });
      
      return { data, error: null };
    } catch (error: any) {
      console.error('DEBUG: Profile update failed:', error);
      const errorMessage = error.message || 'Unknown error occurred';
      
      toast({
        variant: "destructive", 
        title: "Profile update failed",
        description: errorMessage
      });
      
      return { error: { message: errorMessage }, data: null };
    } finally {
      setLoading(false);
    }
  }, [user, executeWithRetry, toast]);

  const isProfileComplete = () => {
    return profile && profile.weight && profile.height && profile.age;
  };

  const calculateBMR = () => {
    if (!profile || !profile.weight || !profile.height || !profile.age) return 0;
    
    // Convert to metric for calculation
    let weightKg: number;
    let heightCm: number;
    
    if (profile.units === 'metric') {
      weightKg = profile.weight;
      heightCm = profile.height;
    } else {
      weightKg = profile.weight * 0.453592; // Convert lbs to kg
      heightCm = profile.height * 2.54; // Convert inches to cm
    }
    
    // Mifflin-St Jeor Equation (assuming average between male/female)
    // Male: BMR = 10 × weight + 6.25 × height - 5 × age + 5
    // Female: BMR = 10 × weight + 6.25 × height - 5 × age - 161
    // Average: BMR = 10 × weight + 6.25 × height - 5 × age - 78
    return Math.round(10 * weightKg + 6.25 * heightCm - 5 * profile.age - 78);
  };

  const calculateWalkingCalories = (durationMinutes: number, speedMph: number = 3) => {
    if (!profile || !profile.weight) return 0;
    
    // FIXED: Corrected MET values based on research data
    const metValues: { [key: number]: number } = {
      2: 2.8,  // 2 mph - slow pace (corrected from 2.5)
      3: 3.2,  // 3 mph - average pace (corrected from 3.5)
      4: 4.3,  // 4 mph - brisk pace (corrected from 5.0) 
      5: 5.5   // 5 mph - fast pace (corrected from 6.0)
    };
    
    const met = metValues[speedMph] || 3.2;
    
    // Handle weight based on units
    let weightKg: number;
    if (profile.units === 'metric') {
      weightKg = profile.weight; // Already in kg
    } else {
      weightKg = profile.weight * 0.453592; // Convert lbs to kg
    }
    
    // Calories = MET × weight (kg) × time (hours)
    return Math.round(met * weightKg * (durationMinutes / 60));
  };

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  return {
    profile,
    loading,
    updateProfile,
    loadProfile,
    isProfileComplete,
    calculateBMR,
    calculateWalkingCalories
  };
};