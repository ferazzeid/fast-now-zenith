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

        const transparentDefault = '/favicon-transparent.png';
        const configured = data?.setting_value as string | undefined;
        const chosen = configured && configured.toLowerCase().includes('transparent') ? configured : transparentDefault;
        const versioned = `${chosen}?v=${Date.now()}`;

        // Update existing favicon links instead of removing them
        const existingIcon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
        const existingShortcut = document.querySelector('link[rel="shortcut icon"]') as HTMLLinkElement;
        
        if (existingIcon) {
          existingIcon.href = versioned;
          existingIcon.type = 'image/png';
        } else {
          const link = document.createElement('link');
          link.rel = 'icon';
          link.type = 'image/png';
          link.href = versioned;
          document.head.appendChild(link);
        }
        
        if (existingShortcut) {
          existingShortcut.href = versioned;
          existingShortcut.type = 'image/png';
        } else {
          const shortcutLink = document.createElement('link');
          shortcutLink.rel = 'shortcut icon';
          shortcutLink.type = 'image/png';
          shortcutLink.href = versioned;
          document.head.appendChild(shortcutLink);
        }

        console.log('Favicon updated to:', versioned);
      } catch (error) {
        console.error('Error updating favicon:', error);
      }
    };

    const updateAppIcons = async () => {
      try {
        // Respect static transparent app icons; skip dynamic apple-touch-icon overrides
        console.log('Skipping apple-touch-icon overrides to keep transparent icons intact');
      } catch (error) {
        console.error('Error in app icons update:', error);
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