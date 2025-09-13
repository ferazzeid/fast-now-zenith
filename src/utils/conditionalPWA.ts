/**
 * TWA/Web platform detection - simplified for TWA-only deployment
 */
const isTWAApp = (): boolean => {
  if (typeof navigator !== 'undefined') {
    const userAgent = navigator.userAgent;
    // Check if running in TWA (Trusted Web Activity)
    if (userAgent.includes('wv') && userAgent.includes('Chrome')) {
      console.log('TWA app detected via user agent');
      return true;
    }
  }
  return false;
};

const isWebApp = (): boolean => {
  return !isTWAApp();
};

/**
 * Conditionally register service worker for TWA and web builds
 * Service worker works in both regular web and TWA contexts
 */
export const conditionalPWAInit = () => {
  // Initialize PWA features for both web and TWA
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
};

/**
 * Check if PWA features should be enabled
 * Always true for TWA deployment since it runs in web context
 */
export const isPWAEnabled = () => {
  return true;
};