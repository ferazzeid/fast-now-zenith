import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useAppMode = () => {
  const { data: appMode, isLoading } = useQuery({
    queryKey: ['app-mode'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_mode_settings')
        .select('setting_value')
        .eq('setting_key', 'global_access_mode')
        .single();
      
      if (error) {
        console.warn('Could not fetch app mode, defaulting to trial_premium:', error);
        return 'trial_premium';
      }
      
      return data.setting_value || 'trial_premium';
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  const shouldShowCoupons = appMode === 'trial_premium';
  const shouldShowPremiumUpgrade = appMode !== 'free_full';
  
  return {
    appMode,
    isLoading,
    shouldShowCoupons,
    shouldShowPremiumUpgrade,
  };
};