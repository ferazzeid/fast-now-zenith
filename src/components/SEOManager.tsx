import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

interface SEOSettings {
  indexHomepage: boolean;
  indexOtherPages: boolean;
}

export const SEOManager = () => {
  // Use static SEO settings - no database dependency
  const [settings] = useState<SEOSettings>({
    indexHomepage: false, // Change to true when ready for SEO
    indexOtherPages: false // Change to true when ready for SEO
  });
  const location = useLocation();

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