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
          .select('*')
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

    setLoading(true);
    try {
      const result = await executeWithRetry(async () => {
        return await supabase
          .from('profiles')
          .upsert({
            user_id: user.id,
            ...updates,
          })
          .select()
          .single();
      });
      
      const { data, error } = result;

      if (error) throw error;

      setProfile(data);
      toast({
        title: "Profile updated",
        description: "Your profile has been saved successfully."
      });
      return { data, error: null };
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        variant: "destructive",
        title: "Update failed",
        description: "Unable to save profile. Please try again."
      });
      return { error, data: null };
    } finally {
      setLoading(false);
    }
  }, [user, executeWithRetry, toast]);

  const isProfileComplete = () => {
    const complete = !!(profile && profile.weight && profile.height && profile.age);
    console.log('isProfileComplete check:', { profile, complete, weight: profile?.weight, height: profile?.height, age: profile?.age });
    return complete;
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