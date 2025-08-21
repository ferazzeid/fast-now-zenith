import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useDynamicFavicon = (isNativeApp?: boolean) => {
  useEffect(() => {
    // Skip PWA features in native apps
    if (isNativeApp) {
      return;
    }
    const updateFavicon = async () => {
      try {
        // Get the favicon from shared_settings
        const { data: settingsData } = await supabase
          .from('shared_settings')
          .select('setting_value')
          .eq('setting_key', 'app_favicon')
          .maybeSingle();

        if (settingsData?.setting_value) {
          // Update favicon links dynamically
          const favicon = document.getElementById('dynamic-favicon') as HTMLLinkElement;
          const shortcutIcon = document.getElementById('dynamic-shortcut-icon') as HTMLLinkElement;
          
          if (favicon) {
            favicon.href = settingsData.setting_value;
          }
          if (shortcutIcon) {
            shortcutIcon.href = settingsData.setting_value;
          }
        }
      } catch (error) {
        console.error('Error loading dynamic favicon:', error);
      }
    };

    updateFavicon();
  }, []);

  return null;
};