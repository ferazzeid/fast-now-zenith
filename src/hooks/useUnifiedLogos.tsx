import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface LogoSettings {
  appLogo: string | null;
  favicon: string | null;
  homeScreenIcon: string | null;
  loading: boolean;
}

export const useUnifiedLogos = () => {
  const [logos, setLogos] = useState<LogoSettings>({
    appLogo: null,
    favicon: null,
    homeScreenIcon: null,
    loading: true,
  });

  useEffect(() => {
    const fetchLogos = async () => {
      try {
        const { data } = await supabase
          .from('shared_settings')
          .select('setting_key, setting_value')
          .in('setting_key', ['app_logo', 'app_favicon', 'home_screen_icon']);

        const logoMap: Record<string, string> = {};
        data?.forEach(item => {
          logoMap[item.setting_key] = item.setting_value;
        });

        setLogos({
          appLogo: logoMap.app_logo || null,
          favicon: logoMap.app_favicon || logoMap.app_logo || null,
          homeScreenIcon: logoMap.home_screen_icon || logoMap.app_logo || null,
          loading: false,
        });
      } catch (error) {
        console.error('Error fetching logos:', error);
        setLogos({
          appLogo: null,
          favicon: null,
          homeScreenIcon: null,
          loading: false,
        });
      }
    };

    fetchLogos();
  }, []);

  return logos;
};