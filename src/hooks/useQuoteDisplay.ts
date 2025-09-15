import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const QUOTE_SETTINGS_QUERY_KEY = ['quote-display-settings'];

export const useQuoteDisplay = () => {
  const { data: settings, isLoading } = useQuery({
    queryKey: QUOTE_SETTINGS_QUERY_KEY,
    queryFn: async () => {
      console.log('🔄 USEQUERYDISPLAY: Fetching quote settings...');
      const { data, error } = await supabase
        .from('shared_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['fasting_quotes_display_enabled', 'walking_quotes_display_enabled']);
      
      if (error) throw error;
      
      console.log('📊 USEQUERYDISPLAY: Settings fetched:', data);
      return data || [];
    },
    staleTime: 0, // Always fetch fresh data
  });

  const fastingQuotesEnabled = settings?.find(s => s.setting_key === 'fasting_quotes_display_enabled')?.setting_value === 'true';
  const walkingQuotesEnabled = settings?.find(s => s.setting_key === 'walking_quotes_display_enabled')?.setting_value === 'true';

  console.log('🎯 USEQUERYDISPLAY: Current state:', { fastingQuotesEnabled, walkingQuotesEnabled });

  return {
    fastingQuotesEnabled: fastingQuotesEnabled || false,
    walkingQuotesEnabled: walkingQuotesEnabled || false,
    loading: isLoading
  };
};