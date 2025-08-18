import { Capacitor } from '@capacitor/core';

/**
 * Conditionally register service worker only for web builds
 * Prevents native app crashes from PWA features
 */
export const conditionalPWAInit = () => {
  // Only initialize PWA features if NOT in native app
  if (!Capacitor.isNativePlatform()) {
    // Service Worker registration for web only
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then((registration) => {
            console.log('SW registered: ', registration);
          })
          .catch((registrationError) => {
            console.log('SW registration failed: ', registrationError);
          });
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