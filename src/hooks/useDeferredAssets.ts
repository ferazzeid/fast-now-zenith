import { useEffect } from 'react';
import { useColorTheme } from './useColorTheme';
import { useDynamicFavicon } from './useDynamicFavicon';
import { useDynamicPWAAssets } from './useDynamicPWAAssets';
import { useDynamicHTMLMeta } from './useDynamicHTMLMeta';

/**
 * Deferred asset loading hook - loads dynamic assets AFTER app is ready
 * This prevents blocking startup with non-critical asset loading
 * Conditionally loads PWA features only for web builds
 */
export const useDeferredAssets = (isNativeApp: boolean) => {
  
  // Load color theme (deferred)
  useColorTheme();
  
  // Load dynamic assets after app is ready - WEB ONLY
  if (!isNativeApp) {
    useDynamicFavicon();
    useDynamicPWAAssets();
    useDynamicHTMLMeta();
  }

  useEffect(() => {
    if (isNativeApp) {
      console.log('Native app detected - PWA features disabled');
    } else {
      console.log('Web app detected - Dynamic assets loading deferred (non-blocking)');
    }
  }, [isNativeApp]);
};