import { useEffect } from 'react';
import { useColorTheme } from './useColorTheme';
import { useDynamicFavicon } from './useDynamicFavicon';
import { useDynamicPWAAssets } from './useDynamicPWAAssets';
import { useDynamicHTMLMeta } from './useDynamicHTMLMeta';

/**
 * Deferred asset loading hook - loads dynamic assets AFTER app is ready
 * This prevents blocking startup with non-critical asset loading
 * Hooks are called unconditionally to obey Rules of Hooks - platform detection handled inside each hook
 */
export const useDeferredAssets = (isNativeApp: boolean) => {
  
  // Load color theme (deferred)
  useColorTheme();
  
  // Always call hooks unconditionally - they handle native app detection internally
  useDynamicFavicon(isNativeApp);
  useDynamicPWAAssets(isNativeApp);
  useDynamicHTMLMeta(isNativeApp);

  useEffect(() => {
    if (isNativeApp) {
      console.log('Native app detected - PWA features disabled');
    } else {
      console.log('Web app detected - Dynamic assets loading deferred (non-blocking)');
    }
  }, [isNativeApp]);
};