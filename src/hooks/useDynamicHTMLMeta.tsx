import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useDynamicHTMLMeta = (skipUpdate?: boolean) => {
  useEffect(() => {
    // Skip PWA features if explicitly requested
    if (skipUpdate) {
      return;
    }
    const updateHTMLMeta = async () => {
      try {
        // Fetch current app settings from database
        const { data: settingsData } = await supabase
          .from('shared_settings')
          .select('setting_key, setting_value')
          .in('setting_key', [
            'pwa_app_name',
            'pwa_short_name', 
            'pwa_description',
            'app_logo',
            'app_favicon',
            'pwa_theme_color'
          ]);

        const settings: Record<string, string> = {};
        settingsData?.forEach(item => {
          settings[item.setting_key] = item.setting_value;
        });

        // Update document title
        if (settings.pwa_app_name) {
          document.title = settings.pwa_app_name;
        }

        // Update meta description
        if (settings.pwa_description) {
          const metaDescription = document.querySelector('meta[name="description"]');
          if (metaDescription) {
            metaDescription.setAttribute('content', settings.pwa_description);
          }
        }

        // Update Open Graph tags
        if (settings.pwa_app_name) {
          const ogTitle = document.querySelector('meta[property="og:title"]');
          if (ogTitle) {
            ogTitle.setAttribute('content', settings.pwa_app_name);
          }
        }

        if (settings.pwa_description) {
          const ogDescription = document.querySelector('meta[property="og:description"]');
          if (ogDescription) {
            ogDescription.setAttribute('content', settings.pwa_description);
          }
        }

        // Update Apple meta tags
        if (settings.pwa_short_name) {
          const appleTitle = document.querySelector('meta[name="apple-mobile-web-app-title"]');
          if (appleTitle) {
            appleTitle.setAttribute('content', settings.pwa_short_name);
          }
        }

        // Update theme color
        if (settings.pwa_theme_color) {
          const themeColor = document.querySelector('meta[name="theme-color"]');
          if (themeColor) {
            themeColor.setAttribute('content', settings.pwa_theme_color);
          }

          const msapplicationTileColor = document.querySelector('meta[name="msapplication-TileColor"]');
          if (msapplicationTileColor) {
            msapplicationTileColor.setAttribute('content', settings.pwa_theme_color);
          }
        }

        // Update favicons and apple touch icons dynamically
        const favicon = settings.app_favicon || settings.app_logo;
        if (favicon) {
          const faviconLink = document.getElementById('dynamic-favicon') as HTMLLinkElement;
          const shortcutIconLink = document.getElementById('dynamic-shortcut-icon') as HTMLLinkElement;
          
          if (faviconLink) {
            faviconLink.href = favicon;
          }
          if (shortcutIconLink) {
            shortcutIconLink.href = favicon;
          }

          // Update apple touch icons
          const appleTouchIcons = document.querySelectorAll('link[rel="apple-touch-icon"]');
          appleTouchIcons.forEach((icon: any) => {
            icon.href = favicon;
          });

          // Update regular icon links
          const iconLinks = document.querySelectorAll('link[rel="icon"]');
          iconLinks.forEach((icon: any) => {
            if (icon.id !== 'dynamic-favicon') {
              icon.href = favicon;
            }
          });
        }

        console.log('HTML meta tags updated with dynamic values');
      } catch (error) {
        console.error('Error updating HTML meta tags:', error);
      }
    };

    updateHTMLMeta();
  }, []);
};