import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useDynamicFavicon = () => {
  useEffect(() => {
    const updateFavicon = async () => {
      try {
        const { data, error } = await supabase
          .from('shared_settings')
          .select('setting_value')
          .eq('setting_key', 'app_favicon')
          .maybeSingle();

        if (error) {
          console.error('Error fetching favicon:', error);
          return;
        }

        if (data?.setting_value) {
          // Remove existing favicon links
          const existingFavicons = document.querySelectorAll('link[rel*="icon"]');
          existingFavicons.forEach(link => link.remove());

          // Add new favicon
          const link = document.createElement('link');
          link.rel = 'icon';
          link.type = 'image/png';
          link.href = data.setting_value;
          document.head.appendChild(link);

          // Also update shortcut icon
          const shortcutLink = document.createElement('link');
          shortcutLink.rel = 'shortcut icon';
          shortcutLink.type = 'image/png';
          shortcutLink.href = data.setting_value;
          document.head.appendChild(shortcutLink);

          console.log('Favicon updated to:', data.setting_value);
        }
      } catch (error) {
        console.error('Error updating favicon:', error);
      }
    };

    const updateAppIcons = async () => {
      try {
        const { data, error } = await supabase
          .from('shared_settings')
          .select('setting_value')
          .eq('setting_key', 'app_logo')
          .maybeSingle();

        if (error) {
          console.error('Error fetching app logo:', error);
          return;
        }

        if (data?.setting_value) {
          // Update apple-touch-icon links
          const appleTouchIcons = document.querySelectorAll('link[rel="apple-touch-icon"]');
          appleTouchIcons.forEach(link => {
            (link as HTMLLinkElement).href = data.setting_value;
          });

          // Update manifest icon references if needed
          const manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
          if (manifestLink) {
            // Note: Manifest would need to be dynamic too for full support
            console.log('App logo updated to:', data.setting_value);
          }
        }
      } catch (error) {
        console.error('Error updating app icons:', error);
      }
    };

    updateFavicon();
    updateAppIcons();
  }, []);
};