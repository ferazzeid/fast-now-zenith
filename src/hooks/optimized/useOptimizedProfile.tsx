import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/hooks/use-toast';
import { useBaseQuery } from '@/hooks/useBaseQuery';

export interface UserProfile {
  user_id: string;
  weight?: number;
  height?: number;
  age?: number;
  calorie_goal?: number;
  protein_goal?: number;
  carb_goal?: number;
  fat_goal?: number;
  deficit_goal?: number;
  activity_level?: string;
  default_walking_speed?: number;
  manual_tdee_override?: number;
  
  sex?: 'male' | 'female';
  onboarding_completed?: boolean;
  updated_at?: string;
  fasting_mode?: 'extended' | 'intermittent';
  
  // Slideshow settings
  enable_fasting_slideshow?: boolean;
  enable_walking_slideshow?: boolean;
  enable_food_slideshow?: boolean;
  enable_ceramic_animations?: boolean;
  enable_quotes_in_animations?: boolean;
  enable_notes_in_animations?: boolean;
}

const profileQueryKey = (userId: string | null) => ['profile', userId];

export const useOptimizedProfile = () => {
  const user = useAuthStore(state => state.user);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Profile query using useBaseQuery
  const profileQuery = useBaseQuery(
    profileQueryKey(user?.id || null),
    async (): Promise<UserProfile | null> => {
      if (!user) throw new Error('User not authenticated');
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data as UserProfile || null;
    },
    {
      enabled: !!user?.id,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    }
  );

  // Profile update mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (updates: Partial<UserProfile>) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          ...updates,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async (updates) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: profileQueryKey(user?.id || null) });

      // Snapshot the previous value
      const previousProfile = queryClient.getQueryData(profileQueryKey(user?.id || null));

      // Optimistically update to the new value
      queryClient.setQueryData(profileQueryKey(user?.id || null), (old: UserProfile | null | undefined) => {
        if (!old) return { user_id: user?.id || '', ...updates };
        return { ...old, ...updates };
      });

      return { previousProfile };
    },
    onError: (err, newProfile, context) => {
      // Rollback on error
      if (context?.previousProfile) {
        queryClient.setQueryData(profileQueryKey(user?.id || null), context.previousProfile);
      }
      
      console.error('Profile update error:', err);
      
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      
      toast({
        title: "Profile Update Failed",
        description: `Error: ${errorMessage}. Please try again.`,
        variant: "destructive",
      });
    },
    onSuccess: (data, variables) => {
      // Don't show toast for automatic fasting mode updates
      if (variables && Object.keys(variables).length === 1 && 'fasting_mode' in variables) {
        return;
      }
      
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: profileQueryKey(user?.id || null) });
    },
  });

  // Helper functions
  const isProfileComplete = () => {
    const profile = profileQuery.data;
    return profile?.onboarding_completed || !!(profile?.weight && profile?.height && profile?.age && profile?.sex);
  };

  const calculateBMR = () => {
    const profile = profileQuery.data;
    if (!profile?.weight || !profile?.height || !profile?.age) return 0;

    // Weight and height are already in kg and cm
    const weightKg = profile.weight;
    const heightCm = profile.height;

    // Mifflin-St Jeor equation with sex-specific calculation
    let bmr: number;
    if (profile.sex === 'female') {
      bmr = Math.round(10 * weightKg + 6.25 * heightCm - 5 * profile.age - 161);
    } else {
      // Default to male formula if sex not specified or is male
      bmr = Math.round(10 * weightKg + 6.25 * heightCm - 5 * profile.age + 5);
    }
    return bmr;
  };

  const calculateWalkingCalories = useCallback((durationMinutes: number, speedMph: number = 3) => {
    const profile = profileQuery.data;
    if (!profile?.weight || !isProfileComplete()) return 0;

    // Weight is already in kg
    const weightKg = profile.weight;

    // Convert speed from mph to km/h if needed
    let speedKmh = speedMph * 1.60934;
    
    // MET values for walking at different speeds
    let met = 3.0; // Default MET value for casual walking
    if (speedKmh < 4.0) met = 2.5;
    else if (speedKmh < 5.6) met = 3.0;
    else if (speedKmh < 6.4) met = 3.5;
    else if (speedKmh < 7.2) met = 4.0;
    else met = 4.5;

    // Calories = MET × weight (kg) × time (hours)
    const hours = durationMinutes / 60;
    return Math.round(met * weightKg * hours);
  }, [profileQuery.data, isProfileComplete]);

  return {
    profile: profileQuery.data,
    loading: profileQuery.isInitialLoading,
    isRefetching: profileQuery.isRefetching,
    error: profileQuery.error,
    errorMessage: profileQuery.errorMessage,
    updateProfile: updateProfileMutation.mutate,
    isUpdating: updateProfileMutation.isPending,
    isProfileComplete,
    calculateBMR,
    calculateWalkingCalories,
    refetch: profileQuery.refetch,
  };
};