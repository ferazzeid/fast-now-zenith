import { useEffect } from 'react';
import { useColorTheme } from './useColorTheme';
import { useDynamicFavicon } from './useDynamicFavicon';
import { useDynamicPWAAssets } from './useDynamicPWAAssets';
import { useDynamicHTMLMeta } from './useDynamicHTMLMeta';

/**
 * Deferred asset loading hook - loads dynamic assets AFTER app is ready
 * This prevents blocking startup with non-critical asset loading
 * For TWA deployment, always loads PWA assets
 */
export const useDeferredAssets = () => {
  
  // Load color theme (deferred)
  useColorTheme();
  
  // Always load PWA assets for TWA deployment
  useDynamicFavicon(false);
  useDynamicPWAAssets(false);
  useDynamicHTMLMeta(false);

  useEffect(() => {
    console.log('TWA app - Dynamic assets loading deferred (non-blocking)');
  }, []);
};