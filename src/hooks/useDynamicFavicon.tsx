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

          // Create new apple-touch-icon if none exist
          if (appleTouchIcons.length === 0) {
            const appleIcon = document.createElement('link');
            appleIcon.rel = 'apple-touch-icon';
            appleIcon.href = data.setting_value;
            document.head.appendChild(appleIcon);
          }

          console.log('App logo updated to:', data.setting_value);
        }
      } catch (error) {
        console.error('Error updating app icons:', error);
      }
    };

    const updateDynamicManifest = async () => {
      try {
        // Update manifest link to point to dynamic endpoint
        const manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
        if (manifestLink) {
          const dynamicManifestUrl = `${window.location.origin}/api/dynamic-manifest`;
          
          // Only update if not already pointing to dynamic manifest
          if (!manifestLink.href.includes('dynamic-manifest')) {
            manifestLink.href = dynamicManifestUrl;
            console.log('Manifest updated to dynamic endpoint');
          }
        } else {
          // Create dynamic manifest link if none exists
          const newManifestLink = document.createElement('link');
          newManifestLink.rel = 'manifest';
          newManifestLink.href = `${window.location.origin}/api/dynamic-manifest`;
          document.head.appendChild(newManifestLink);
          console.log('Dynamic manifest link created');
        }
      } catch (error) {
        console.error('Error updating dynamic manifest:', error);
      }
    };

    updateFavicon();
    updateAppIcons();
    updateDynamicManifest();
  }, []);
};