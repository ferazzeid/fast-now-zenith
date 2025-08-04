import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook to dynamically update favicon based on admin settings
 * This allows the admin-uploaded favicon to override the default one
 */
export const useDynamicFavicon = () => {
  useEffect(() => {
    const updateFavicon = async () => {
      try {
        // Fetch the admin-set favicon from shared_settings
        const { data, error } = await supabase
          .from('shared_settings')
          .select('setting_value')
          .eq('setting_key', 'app_favicon')
          .single();

        if (error || !data?.setting_value) {
          // No custom favicon set, keep default
          return;
        }

        const faviconUrl = data.setting_value;
        
        // Update all favicon links in the document head
        const faviconLinks = document.querySelectorAll('link[rel*="icon"]');
        faviconLinks.forEach(link => {
          (link as HTMLLinkElement).href = faviconUrl;
        });

        // Create new favicon link if none exists
        if (faviconLinks.length === 0) {
          const link = document.createElement('link');
          link.rel = 'icon';
          link.type = 'image/x-icon';
          link.href = faviconUrl;
          document.head.appendChild(link);
        }

        console.log('Dynamic favicon updated:', faviconUrl);
      } catch (error) {
        console.error('Error updating dynamic favicon:', error);
      }
    };

    // Update favicon on mount
    updateFavicon();
  }, []);
};