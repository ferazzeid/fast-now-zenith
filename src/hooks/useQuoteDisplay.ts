import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useQuoteDisplay = () => {
  const [fastingQuotesEnabled, setFastingQuotesEnabled] = useState(false);
  const [walkingQuotesEnabled, setWalkingQuotesEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadSettings = async () => {
    try {
      setLoading(true);
      
      const { data: settings } = await supabase
        .from('shared_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['fasting_quotes_display_enabled', 'walking_quotes_display_enabled']);
      
      console.log('Quote settings loaded:', settings);
      
      const fastingSetting = settings?.find(s => s.setting_key === 'fasting_quotes_display_enabled');
      const walkingSetting = settings?.find(s => s.setting_key === 'walking_quotes_display_enabled');
      
      setFastingQuotesEnabled(fastingSetting?.setting_value === 'true');
      setWalkingQuotesEnabled(walkingSetting?.setting_value === 'true');
      
      console.log('Quote display state:', {
        fasting: fastingSetting?.setting_value === 'true',
        walking: walkingSetting?.setting_value === 'true'
      });
      
    } catch (error) {
      console.error('Error loading quote settings:', error);
      setFastingQuotesEnabled(false);
      setWalkingQuotesEnabled(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  return {
    fastingQuotesEnabled,
    walkingQuotesEnabled,
    loading,
    refresh: loadSettings
  };
};