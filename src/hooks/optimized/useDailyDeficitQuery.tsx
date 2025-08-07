import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { useProfileQuery } from '@/hooks/useProfileQuery';

export const useDailyDeficitQuery = () => {
  const user = useAuthStore(state => state.user);
  const { profile } = useProfileQuery();

  // Simple manual calorie burns query for today
  const manualCaloriesQuery = useQuery({
    queryKey: ['manualCalories', user?.id],
    queryFn: async (): Promise<number> => {
      if (!user) return 0;
      
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('manual_calorie_burns')
        .select('calories_burned')
        .eq('user_id', user.id)
        .gte('created_at', today);

      if (error) throw error;
      
      return (data || []).reduce((sum, burn) => sum + burn.calories_burned, 0);
    },
    enabled: !!user?.id,
    staleTime: 60000, // 1 minute
    refetchInterval: 60000,
  });

  // Simple deficit calculation
  const deficit = {
    calories: 0,
    percentage: 0,
    bmr: profile ? 1800 : 0, // Simplified BMR
  };

  if (profile?.weight && profile?.height && profile?.age) {
    // Simple BMR calculation
    let bmr: number;
    if (profile.sex === 'female') {
      bmr = Math.round(10 * profile.weight + 6.25 * profile.height - 5 * profile.age - 161);
    } else {
      bmr = Math.round(10 * profile.weight + 6.25 * profile.height - 5 * profile.age + 5);
    }
    
    deficit.bmr = bmr;
    deficit.calories = bmr - (manualCaloriesQuery.data || 0);
    deficit.percentage = Math.round((deficit.calories / bmr) * 100);
  }

  return {
    deficit,
    isLoading: manualCaloriesQuery.isLoading,
    error: manualCaloriesQuery.error,
    refetch: manualCaloriesQuery.refetch,
  };
};