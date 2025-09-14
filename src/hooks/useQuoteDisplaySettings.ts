import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface QuoteDisplaySettings {
  fastingQuotesEnabled: boolean;
  walkingQuotesEnabled: boolean;
  loading: boolean;
}

export const useQuoteDisplaySettings = (): QuoteDisplaySettings => {
  const [fastingQuotesEnabled, setFastingQuotesEnabled] = useState(true);
  const [walkingQuotesEnabled, setWalkingQuotesEnabled] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      
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

      setFastingQuotesEnabled(fastingResult.data?.setting_value !== 'false');
      setWalkingQuotesEnabled(walkingResult.data?.setting_value !== 'false');
    } catch (error) {
      // Default both to true if settings don't exist
      console.log('Quote display settings not found, using defaults');
      setFastingQuotesEnabled(true);
      setWalkingQuotesEnabled(true);
    } finally {
      setLoading(false);
    }
  };

  return {
    fastingQuotesEnabled,
    walkingQuotesEnabled,
    loading
  };
};