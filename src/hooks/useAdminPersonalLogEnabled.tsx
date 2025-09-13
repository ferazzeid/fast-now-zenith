import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useAdminPersonalLogEnabled = () => {
  const [isEnabled, setIsEnabled] = useState(true); // Default to true
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSetting = async () => {
      try {
        const { data } = await supabase
          .from('shared_settings')
          .select('setting_value')
          .eq('setting_key', 'admin_personal_log_enabled')
          .single();

        setIsEnabled(data?.setting_value !== 'false'); // Default to true unless explicitly false
      } catch (error) {
        // Default to true if setting doesn't exist
        setIsEnabled(true);
      } finally {
        setIsLoading(false);
      }
    };

    loadSetting();
  }, []);

  return { isEnabled, isLoading };
};