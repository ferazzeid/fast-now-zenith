import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface QuoteDisplaySettings {
  fastingQuotesEnabled: boolean;
  walkingQuotesEnabled: boolean;
  loading: boolean;
}

export const useQuoteDisplaySettings = (): QuoteDisplaySettings => {
  const { data: settings, isLoading } = useQuery({
    queryKey: ['quote-display-settings'],
    queryFn: async () => {
      const [fastingResult, walkingResult] = await Promise.all([
        supabase
          .from('shared_settings')
          .select('setting_value')
          .eq('setting_key', 'fasting_quotes_display_enabled')
          .maybeSingle(),
        supabase
          .from('shared_settings')
          .select('setting_value')
          .eq('setting_key', 'walking_quotes_display_enabled')
          .maybeSingle()
      ]);

      console.log('Quote display settings loaded:', { 
        fasting: fastingResult.data?.setting_value, 
        walking: walkingResult.data?.setting_value 
      });

      const fastingQuotesEnabled = fastingResult.data?.setting_value === 'true';
      const walkingQuotesEnabled = walkingResult.data?.setting_value === 'true';
      
      return { fastingQuotesEnabled, walkingQuotesEnabled };
    },
    staleTime: 0, // Always refetch when needed
    gcTime: 0, // Don't cache long term
  });

  return {
    fastingQuotesEnabled: settings?.fastingQuotesEnabled ?? false,
    walkingQuotesEnabled: settings?.walkingQuotesEnabled ?? false,
    loading: isLoading
  };
};