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
  
  // Only load dynamic assets when startup is complete, not during OAuth, and database is connected
  const shouldLoadAssets = startupState === 'ready' && !isOAuthCompleting;
  
  // Load color theme (deferred until ready)
  useColorTheme(shouldLoadAssets);
  
  useEffect(() => {
    // Only load PWA assets when app is fully ready
    if (shouldLoadAssets) {
      // Add longer delay to ensure database connectivity after OAuth
      const delay = 1000; // Always wait for database stabilization
      
      setTimeout(() => {
        // Always load PWA assets for TWA deployment
        useDynamicFavicon(false);
        useDynamicPWAAssets(false);
        useDynamicHTMLMeta(false);
        
        console.log('TWA app - Dynamic assets loaded after startup and database stabilization');
      }, delay);
    }
  }, [shouldLoadAssets, isOAuthCompleting]);
};