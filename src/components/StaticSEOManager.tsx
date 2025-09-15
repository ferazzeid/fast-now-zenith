import React from 'react';
import { STATIC_ASSETS } from '@/utils/staticAssets';

interface StaticSEOManagerProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
}

export const StaticSEOManager: React.FC<StaticSEOManagerProps> = ({
  title = "FastNow - The No-BS Fat Loss Protocol",
  description = "Weight loss protocol combining fasting, walking, and calorie restriction for sustainable results",
  image = STATIC_ASSETS.logo,
  url = window.location.href
}) => {
  // Update document head directly - no Helmet needed
  React.useEffect(() => {
    document.title = title;
    
    // Update or create meta tags
    const updateOrCreateMeta = (name: string, content: string, property = false) => {
      const selector = property ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let meta = document.querySelector(selector) as HTMLMetaElement;
      if (!meta) {
        meta = document.createElement('meta');
        if (property) {
          meta.setAttribute('property', name);
        } else {
          meta.setAttribute('name', name);
        }
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    updateOrCreateMeta('description', description);
    updateOrCreateMeta('theme-color', '#3B82F6');
    updateOrCreateMeta('apple-mobile-web-app-title', 'FastNow');
    updateOrCreateMeta('application-name', 'FastNow');
    
    // Open Graph
    updateOrCreateMeta('og:title', title, true);
    updateOrCreateMeta('og:description', description, true);
    updateOrCreateMeta('og:image', image, true);
    updateOrCreateMeta('og:url', url, true);
    updateOrCreateMeta('og:type', 'website', true);
    
    // Twitter
    updateOrCreateMeta('twitter:card', 'summary_large_image');
    updateOrCreateMeta('twitter:title', title);
    updateOrCreateMeta('twitter:description', description);
    updateOrCreateMeta('twitter:image', image);
    
    // Update favicon
    const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
    if (favicon) {
      favicon.href = STATIC_ASSETS.favicon;
    }
    
    const appleTouchIcon = document.querySelector('link[rel="apple-touch-icon"]') as HTMLLinkElement;
    if (appleTouchIcon) {
      appleTouchIcon.href = STATIC_ASSETS.homeScreenIcon;
    }
  }, [title, description, image, url]);

  return null;
};