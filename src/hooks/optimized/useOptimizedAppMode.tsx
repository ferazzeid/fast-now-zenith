import { supabase } from '@/integrations/supabase/client';
import { useBaseQuery } from '@/hooks/useBaseQuery';

export const useOptimizedAppMode = () => {
  const { data: appMode, isLoading, isInitialLoading, error } = useBaseQuery(
    ['app-mode'],
    async () => {
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
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    }
  );

  // Since we only have trial_premium mode now, always show premium upgrade
  const shouldShowPremiumUpgrade = true;
  
  return {
    appMode,
    isLoading: isInitialLoading,
    error,
    shouldShowPremiumUpgrade,
  };
};