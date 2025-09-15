import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const QUOTE_SETTINGS_QUERY_KEY = ['quote-display-settings'];

export const useQuoteDisplay = () => {
  const { data: settings, isLoading } = useQuery({
    queryKey: QUOTE_SETTINGS_QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shared_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['fasting_timer_quotes_enabled', 'walking_timer_quotes_enabled']);
      
      if (error) throw error;
      
      return data || [];
    },
    staleTime: 0, // Always refetch for immediate updates
  });

  const fastingQuotesEnabled = settings?.find(s => s.setting_key === 'fasting_timer_quotes_enabled')?.setting_value === 'true';
  const walkingQuotesEnabled = settings?.find(s => s.setting_key === 'walking_timer_quotes_enabled')?.setting_value === 'true';

  return {
    fastingQuotesEnabled: fastingQuotesEnabled ?? true,
    walkingQuotesEnabled: walkingQuotesEnabled ?? true,
    loading: isLoading
  };
};