import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useDynamicPWAAssets = () => {
  useEffect(() => {
    const updatePWAAssets = async () => {
      try {
        // Fetch current brand assets from database
        const { data: settingsData } = await supabase
          .from('shared_settings')
          .select('setting_key, setting_value')
          .in('setting_key', ['app_logo', 'app_favicon']);

        const settings: Record<string, string> = {};
        settingsData?.forEach(item => {
          settings[item.setting_key] = item.setting_value;
        });

        // Update favicon dynamically
        if (settings.app_favicon) {
          const faviconLink = document.getElementById('dynamic-favicon') as HTMLLinkElement;
          const shortcutIconLink = document.getElementById('dynamic-shortcut-icon') as HTMLLinkElement;
          
          if (faviconLink) {
            faviconLink.href = settings.app_favicon;
            console.log('Updated favicon link to:', settings.app_favicon);
          }
          if (shortcutIconLink) {
            shortcutIconLink.href = settings.app_favicon;
            console.log('Updated shortcut icon link to:', settings.app_favicon);
          }
        }

        // Update apple touch icons dynamically
        if (settings.app_logo) {
          const appleTouchIcons = document.querySelectorAll('link[rel="apple-touch-icon"]');
          appleTouchIcons.forEach((icon: any) => {
            icon.href = settings.app_logo;
            console.log('Updated apple touch icon to:', settings.app_logo);
          });
        }

        // Force manifest refresh with enhanced cache busting
        const manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
        if (manifestLink) {
          const url = new URL(manifestLink.href, window.location.origin);
          url.searchParams.set('v', Date.now().toString());
          url.searchParams.set('bust', Math.random().toString(36));
          manifestLink.href = url.toString();
        }

        console.log('PWA assets updated with dynamic values');
      } catch (error) {
        console.error('Error updating PWA assets:', error);
      }
    };

    updatePWAAssets();
  }, []);
};