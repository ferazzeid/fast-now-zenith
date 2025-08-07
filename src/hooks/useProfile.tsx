import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useRetryableSupabase } from '@/hooks/useRetryableSupabase';
import { cacheProfile, getCachedProfile, deduplicateRequest } from '@/utils/offlineStorage';

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
  goal_weight?: number;
  activity_level?: string;
  default_walking_speed?: number;
  enable_fasting_slideshow?: boolean;
  enable_walking_slideshow?: boolean;
}

export const useProfile = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const { executeWithRetry } = useRetryableSupabase();

  const loadProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }
    
    // Check cache first - but force refresh if weight/height are missing
    const cached = getCachedProfile(user.id);
    if (cached && cached.weight && cached.height && cached.age) {
      console.log('Using cached profile data', cached);
      setProfile(cached);
      setLoading(false);
      return;
    } else {
      console.log('Cache invalid or incomplete, fetching fresh profile data');
    }
    
    setLoading(true);
    try {
      // Use request deduplication
      const data = await deduplicateRequest(
        `profile_${user.id}`,
        async () => {
          const result = await executeWithRetry(async () => {
            return await supabase
              .from('profiles')
              .select('*')
              .eq('user_id', user.id)
              .maybeSingle();
          });
          
          const { data, error } = result;

          if (error) {
            console.error('Profile load error:', error);
            throw error;
          }

          return data;
        },
        30 // 30 minute cache for request deduplication
      );

      console.log('Profile loaded successfully:', data);
      
      // Cache the profile data for 24 hours
      if (data) {
        cacheProfile(user.id, data, 24);
      }
      
      setProfile(data || null);
    } catch (error) {
      console.error('Error loading profile:', error);
      setProfile(null);
      toast({
        variant: "destructive",
        title: "Connection Error",
        description: "Unable to load profile. Please check your internet connection."
      });
    } finally {
      setLoading(false);
    }
  }, [user?.id, executeWithRetry, toast]);

  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    if (!user) return { error: { message: 'User not authenticated' } };

    setLoading(true);
    try {
      console.log('Executing profile update with data:', updates);
      
      const result = await executeWithRetry(async () => {
        console.log('Making database upsert call...');
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
      console.log('Database response:', { data, error });

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      if (!data) {
        console.error('No data returned from database');
        throw new Error('No data returned from database');
      }

      // Clear cache and set new profile data
      console.log('Updating profile state with:', data);
      setProfile(data);
      
      // Force a reload of the profile to verify it was saved
      setTimeout(async () => {
        console.log('Reloading profile to verify save...');
        await loadProfile();
      }, 100);

      return { data, error: null };
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        variant: "destructive",
        title: "Update failed",
        description: `Unable to save profile: ${error.message || 'Please try again.'}`
      });
      return { error, data: null };
    } finally {
      setLoading(false);
    }
  }, [user, executeWithRetry, toast, loadProfile]);

  const isProfileComplete = useCallback(() => {
    const complete = !!(profile && profile.weight && profile.height && profile.age && 
      (profile.activity_level || profile['activity-level'])); // Handle both formats
    console.log('Profile completion check:', { profile, complete, activity_level: profile?.activity_level });
    return complete;
  }, [profile?.weight, profile?.height, profile?.age, profile?.activity_level]);

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
    if (user?.id) {
      loadProfile();
    } else {
      setProfile(null);
      setLoading(false);
    }
  }, [user?.id, loadProfile]);

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