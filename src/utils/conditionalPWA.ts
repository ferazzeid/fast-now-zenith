import { Capacitor } from '@capacitor/core';

/**
 * Robust native platform detection with multiple fallbacks
 */
const isNativeApp = (): boolean => {
  // Method 1: Check if Capacitor is available and reports native platform
  try {
    if (typeof window !== 'undefined' && (window as any).Capacitor) {
      const platform = Capacitor.getPlatform();
      if (platform === 'ios' || platform === 'android') {
        console.log('Native app detected via Capacitor.getPlatform():', platform);
        return true;
      }
    }
  } catch (error) {
    console.warn('Capacitor platform check failed:', error);
  }

  // Method 2: Check Capacitor.isNativePlatform()
  try {
    if (Capacitor.isNativePlatform()) {
      console.log('Native app detected via Capacitor.isNativePlatform()');
      return true;
    }
  } catch (error) {
    console.warn('Capacitor.isNativePlatform() check failed:', error);
  }

  // Method 3: Check for Capacitor global object
  if (typeof window !== 'undefined' && (window as any).Capacitor) {
    console.log('Native app detected via window.Capacitor presence');
    return true;
  }

  // Method 4: User agent fallback
  if (typeof navigator !== 'undefined') {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('CapacitorWebView') || userAgent.includes('wv)')) {
      console.log('Native app detected via user agent');
      return true;
    }
  }

  return false;
};

/**
 * Conditionally register service worker only for web builds
 * Prevents native app crashes from PWA features
 */
export const conditionalPWAInit = () => {
  // Only initialize PWA features if NOT in native app
  if (!isNativeApp()) {
    // Service Worker registration for web only
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        try {
          navigator.serviceWorker.register('./sw.js')
            .then((registration) => {
              console.log('SW registered: ', registration);
            })
            .catch((registrationError) => {
              console.log('SW registration failed: ', registrationError);
            });
        } catch (error) {
          console.error('Service worker registration error:', error);
        }
      });
    }
  } else {
    console.log('Native app detected - Service worker disabled');
  }
};

/**
 * Check if PWA features should be enabled
 */
export const isPWAEnabled = () => {
  return !Capacitor.isNativePlatform();
};