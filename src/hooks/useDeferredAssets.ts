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
export const useDeferredAssets = (startupState?: string, isOAuthCompleting?: boolean) => {
  
  // Only load dynamic assets when startup is complete and not during OAuth
  const shouldLoadAssets = startupState === 'ready' && !isOAuthCompleting;
  
  // Load color theme (deferred until ready)
  useColorTheme(shouldLoadAssets);
  
  useEffect(() => {
    // Only load PWA assets when app is fully ready
    if (shouldLoadAssets) {
      // Add small delay after OAuth to let database connections stabilize
      const delay = isOAuthCompleting ? 500 : 0;
      
      setTimeout(() => {
        // Always load PWA assets for TWA deployment
        useDynamicFavicon(false);
        useDynamicPWAAssets(false);
        useDynamicHTMLMeta(false);
        
        console.log('TWA app - Dynamic assets loaded after startup completion');
      }, delay);
    }
  }, [shouldLoadAssets, isOAuthCompleting]);
};