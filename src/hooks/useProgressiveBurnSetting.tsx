import { useBaseQuery } from '@/hooks/useBaseQuery';
import { supabase } from '@/integrations/supabase/client';

export const useProgressiveBurnSetting = () => {
  const { data: isEnabled, isLoading, error } = useBaseQuery(
    ['progressive-burn-enabled'],
    async () => {
      const { data, error } = await supabase
        .from('shared_settings')
        .select('setting_value')
        .eq('setting_key', 'progressive_daily_burn_enabled')
        .maybeSingle();

      if (error) {
        console.warn('Could not fetch progressive burn setting, defaulting to disabled:', error);
        return false;
      }

      return data?.setting_value === 'true';
    },
    {
      staleTime: 5 * 60 * 1000, // 5 minutes - settings don't change often
      gcTime: 10 * 60 * 1000, // 10 minutes
    }
  );

  return {
    isProgressiveBurnEnabled: isEnabled ?? false,
    isLoading,
    error,
  };
};