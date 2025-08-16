import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useAppLogo = () => {
  const [appLogo, setAppLogo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAppLogo = async () => {
    try {
      const { data, error } = await supabase
        .from('shared_settings')
        .select('setting_value')
        .eq('setting_key', 'app_logo')
        .maybeSingle();

      if (error) throw error;
      
      setAppLogo(data?.setting_value || null);
    } catch (error) {
      console.error('Error fetching app logo:', error);
      setAppLogo(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppLogo();
  }, []);

  return {
    appLogo,
    loading,
    refetch: fetchAppLogo
  };
};