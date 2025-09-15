import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useStandardizedLoading } from './useStandardizedLoading';

export interface QuoteDisplaySettings {
  fastingQuotesEnabled: boolean;
  walkingQuotesEnabled: boolean;
  loading: boolean;
}

export const useQuoteDisplaySettings = (): QuoteDisplaySettings => {
  const { data: settings, isLoading, execute } = useStandardizedLoading<{
    fastingQuotesEnabled: boolean;
    walkingQuotesEnabled: boolean;
  }>({ fastingQuotesEnabled: true, walkingQuotesEnabled: true });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    await execute(async () => {
      // Load both settings
      const [fastingResult, walkingResult] = await Promise.all([
        supabase
          .from('shared_settings')
          .select('setting_value')
          .eq('setting_key', 'fasting_quotes_display_enabled')
          .single(),
        supabase
          .from('shared_settings')
          .select('setting_value')
          .eq('setting_key', 'walking_quotes_display_enabled')
          .single()
      ]);

      console.log('Quote display settings loaded:', { 
        fasting: fastingResult.data?.setting_value, 
        walking: walkingResult.data?.setting_value 
      });

      const fastingQuotesEnabled = fastingResult.data?.setting_value === 'true';
      const walkingQuotesEnabled = walkingResult.data?.setting_value === 'true';
      
      return { fastingQuotesEnabled, walkingQuotesEnabled };
    }, {
      onError: (error) => {
        // Default both to false if settings don't exist
        console.log('Quote display settings error, using defaults:', error);
      }
    });
  };

  return {
    fastingQuotesEnabled: settings?.fastingQuotesEnabled ?? false,
    walkingQuotesEnabled: settings?.walkingQuotesEnabled ?? false,
    loading: isLoading
  };
};