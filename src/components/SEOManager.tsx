import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLocation } from 'react-router-dom';

interface SEOSettings {
  indexHomepage: boolean;
  indexOtherPages: boolean;
}

export const SEOManager = () => {
  const [settings, setSettings] = useState<SEOSettings>({
    indexHomepage: false,
    indexOtherPages: false
  });
  const location = useLocation();

  useEffect(() => {
    const fetchSEOSettings = async () => {
      try {
        const { data } = await supabase
          .from('shared_settings')
          .select('setting_key, setting_value')
          .in('setting_key', ['seo_index_homepage', 'seo_index_other_pages']);

        if (data) {
          const settingsMap = data.reduce((acc, item) => {
            acc[item.setting_key] = item.setting_value === 'true';
            return acc;
          }, {} as Record<string, boolean>);

          setSettings({
            indexHomepage: settingsMap.seo_index_homepage || false,
            indexOtherPages: settingsMap.seo_index_other_pages || false
          });
        }
      } catch (error) {
        console.warn('Failed to fetch SEO settings:', error);
      }
    };

    fetchSEOSettings();
  }, []);

  useEffect(() => {
    // Determine if current page should be indexed
    const isHomepage = location.pathname === '/';
    const shouldIndex = isHomepage ? settings.indexHomepage : settings.indexOtherPages;

    // Remove existing robots meta tag
    const existingMeta = document.querySelector('meta[name="robots"]');
    if (existingMeta) {
      existingMeta.remove();
    }

    // Add new robots meta tag
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = shouldIndex ? 'index, follow' : 'noindex, nofollow';
    document.head.appendChild(meta);

    // Clean up on unmount
    return () => {
      const metaToRemove = document.querySelector('meta[name="robots"]');
      if (metaToRemove) {
        metaToRemove.remove();
      }
    };
  }, [settings, location.pathname]);

  return null; // This component only manages meta tags
};