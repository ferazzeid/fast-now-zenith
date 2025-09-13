import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useAuthorTooltipEnabled = () => {
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    const loadSetting = async () => {
      try {
        const { data } = await supabase
          .from('shared_settings')
          .select('setting_value')
          .eq('setting_key', 'author_tooltips_enabled')
          .single();

        setIsEnabled(data?.setting_value === 'true');
      } catch (error) {
        // Default to false if setting doesn't exist
        setIsEnabled(false);
      }
    };

    loadSetting();
  }, []);

  return isEnabled;
};