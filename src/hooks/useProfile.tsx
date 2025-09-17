import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/hooks/use-toast';
import { useRetryableSupabase } from '@/hooks/useRetryableSupabase';
import { cacheProfile, getCachedProfile, deduplicateRequest } from '@/utils/offlineStorage';
import { useStandardizedLoading } from '@/hooks/useStandardizedLoading';

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
  manual_tdee_override?: number;
  enable_fasting_slideshow?: boolean;
  enable_walking_slideshow?: boolean;
  enable_food_slideshow?: boolean;
  enable_daily_reset?: boolean;
  enable_ceramic_animations?: boolean;
  enable_quotes_in_animations?: boolean;
  enable_notes_in_animations?: boolean;
  sex?: 'male' | 'female';
  onboarding_completed?: boolean;
  primary_color?: string;
}

export const useProfile = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const { isLoading: loading, execute: executeLoadProfile } = useStandardizedLoading();
  const { isLoading: updating, execute: executeUpdateProfile } = useStandardizedLoading();
  const user = useAuthStore(state => state.user);
  const { toast } = useToast();
  const { executeWithRetry } = useRetryableSupabase();

  const loadProfile = useCallback(async (forceRefresh: boolean = false) => {
    // Always set loading to false if no user, but don't return early
    if (!user) {
      setProfile(null);
      return;
    }
    
    if (!forceRefresh) {
      // Check cache first - but force refresh if weight/height are missing
      const cached = getCachedProfile(user.id);
      if (cached && cached.weight && cached.height && cached.age) {
        console.log('Using cached profile data:', cached);
        setProfile(cached);
        return;
      } else {
        console.log('Cache invalid or incomplete, fetching fresh profile data');
      }
    }
    
    await executeLoadProfile(async () => {
      let data: any = null;

      if (forceRefresh) {
        // Bypass request dedup + cache for guaranteed fresh read
        const result = await executeWithRetry(async () => {
          return await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();
        });
        const { data: directData, error } = result;
        if (error) {
          console.error('Profile load error (force):', error);
          throw error;
        }
        data = directData;
      } else {
        // Use request deduplication
        data = await deduplicateRequest(
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
      }

      console.log('Profile loaded successfully:', data);
      
      // SYNCHRONIZED: Cache the profile data for 1 hour (aligned with useAccess)
      if (data) {
        cacheProfile(user.id, data, 1);
      }
      
      setProfile(data || null);
      return data;
    }, {
      onError: (error) => {
        console.error('Error loading profile:', error);
        setProfile(null);
        toast({
          variant: "destructive",
          title: "Connection Error",
          description: "Unable to load profile. Please check your internet connection."
        });
      }
    });
  }, [user?.id, executeWithRetry, toast, executeLoadProfile]);

  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    if (!user) {
      console.error('updateProfile: User not authenticated');
      return { error: { message: 'User not authenticated' }, data: null };
    }

    console.log('updateProfile: Starting update for user:', user.id);
    
    const result = await executeUpdateProfile(async () => {
      // Verify we have a valid session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('updateProfile: No valid session found');
        throw new Error('No valid session. Please log in again.');
      }
      
      console.log('updateProfile: Valid session found, executing update with data:', updates);
      
      const dbResult = await executeWithRetry(async () => {
        console.log('updateProfile: Making database upsert call with user_id:', user.id);
        const { data, error } = await supabase
          .from('profiles')
          .upsert({
            user_id: user.id,
            ...updates,
          }, {
            onConflict: 'user_id'
          })
          .select()
          .maybeSingle();
          
        console.log('updateProfile: Database response:', { data, error });
        return { data, error };
      });
      
      const { data, error } = dbResult;
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
      
      // Clear existing cache to ensure fresh data
      const cacheKey = `profile_${user.id}`;
      const dedupeKey = `profile_${user.id}`;
      
      // Clear both cache systems
      if (typeof window !== 'undefined') {
        localStorage.removeItem(`cache_${cacheKey}`);
        localStorage.removeItem(`dedupe_${dedupeKey}`);
      }
      
      // SYNCHRONIZED: Update cache with new data immediately (1 hour cache)
      cacheProfile(user.id, data, 1);

      return data;
    }, {
      onError: (error: any) => {
        console.error('Error updating profile:', error);
        toast({
          variant: "destructive",
          title: "Update failed",
          description: `Unable to save profile: ${error.message || 'Please try again.'}`
        });
      }
    });

    // Return consistent type based on result
    if (result.success) {
      return { data: result.data, error: null };
    } else {
      return { error: result.error || { message: 'Unknown error' }, data: null };
    }
  }, [user, executeWithRetry, toast, loadProfile, executeUpdateProfile]);

  const isProfileComplete = useCallback(() => {
    const complete = !!(profile && 
      profile.weight && 
      profile.height && 
      profile.age && 
      profile.sex &&
      (profile.activity_level || profile['activity-level']) &&
      profile.onboarding_completed); // Must have onboarding completed flag
    
    console.log('Profile completion check:', { 
      complete, 
      weight: profile?.weight,
      height: profile?.height,
      age: profile?.age,
      sex: profile?.sex,
      activity_level: profile?.activity_level,
      onboarding_completed: profile?.onboarding_completed,
      profile: profile
    });
    
    return complete;
  }, [profile?.weight, profile?.height, profile?.age, profile?.sex, profile?.activity_level, profile?.onboarding_completed]);

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
    
    // Mifflin-St Jeor Equation with sex-specific calculation
    // Male: BMR = 10 × weight + 6.25 × height - 5 × age + 5
    // Female: BMR = 10 × weight + 6.25 × height - 5 × age - 161
    let bmr: number;
    if (profile.sex === 'female') {
      bmr = Math.round(10 * weightKg + 6.25 * heightCm - 5 * profile.age - 161);
    } else {
      // Default to male formula if sex not specified or is male
      bmr = Math.round(10 * weightKg + 6.25 * heightCm - 5 * profile.age + 5);
    }
    return bmr;
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
    // Always call loadProfile, it handles the user check internally
    loadProfile();
  }, [user?.id, loadProfile]);

  return {
    profile,
    loading: loading || updating,
    updateProfile,
    loadProfile,
    isProfileComplete,
    calculateBMR,
    calculateWalkingCalories
  };
};