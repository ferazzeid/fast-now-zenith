import { useEffect } from 'react';
import { useColorTheme } from './useColorTheme';
import { useDynamicFavicon } from './useDynamicFavicon';
import { useDynamicPWAAssets } from './useDynamicPWAAssets';
import { useDynamicHTMLMeta } from './useDynamicHTMLMeta';

/**
 * Deferred asset loading hook - loads dynamic assets AFTER app is ready
 * This prevents blocking startup with non-critical asset loading
 */
export const useDeferredAssets = () => {
  // Load color theme (deferred)
  useColorTheme();
  
  // Load dynamic assets after app is ready
  useDynamicFavicon();
  useDynamicPWAAssets();
  useDynamicHTMLMeta();

  useEffect(() => {
    // All dynamic assets are now loaded via their respective hooks
    // This hook just coordinates their deferred loading
    console.log('Dynamic assets loading deferred (non-blocking)');
  }, []);
};