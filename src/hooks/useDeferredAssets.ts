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
  
  // Always call hooks at top level - never inside callbacks
  useDynamicFavicon(!shouldLoadAssets); // Skip if not ready
  useDynamicPWAAssets(!shouldLoadAssets); // Skip if not ready  
  useDynamicHTMLMeta(!shouldLoadAssets); // Skip if not ready
  
  useEffect(() => {
    if (shouldLoadAssets) {
      console.log('TWA app - Dynamic assets loaded after startup and database stabilization');
    }
  }, [shouldLoadAssets]);
};