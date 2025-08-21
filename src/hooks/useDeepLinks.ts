import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

type DeepLinkHandler = (url: string) => void;

/**
 * Generic deep-link hook:
 * - No Supabase import here.
 * - Never throws on startup.
 * - Only runs on native platforms.
 * - Passes the full URL to caller via onUrl.
 * - Uses cached platform detection for consistency.
 */
export function useDeepLinks(onUrl: DeepLinkHandler | null) {
  useEffect(() => {
    let remove: (() => void) | undefined;

    const setup = async () => {
      if (typeof window === 'undefined') return;
      if (!onUrl) return;
      
      // Use cached platform detection first, fallback to direct check
      const isNative = (window as any).__IS_NATIVE_APP__ || Capacitor.isNativePlatform();
      if (!isNative) return;

      try {
        // Dynamic import so it loads only on device; but package MUST exist.
        const { App } = await import('@capacitor/app');
        const sub = await App.addListener('appUrlOpen', ({ url }) => {
          if (typeof url === 'string' && url.length > 0) {
            onUrl(url);
          }
        });
        remove = () => { try { sub.remove(); } catch { /* no-op */ } };
      } catch {
        // Swallow errors to avoid startup crashes
      }
    };

    setup();
    return () => { try { remove?.(); } catch { /* no-op */ } };
  }, [onUrl]);
}