// Global variable to track last user interaction
let lastUserInteraction = 0;

// Utility to prevent unnecessary data fetching when tab is not visible
export const useVisibilityControl = () => {
  const isTabVisible = () => {
    return !document.hidden && document.visibilityState === 'visible';
  };

  const shouldRefetch = () => {
    // Only refetch if tab is visible and user is actively using the app
    return isTabVisible() && 
           Date.now() - lastUserInteraction < 30000; // 30 seconds
  };

  // Track user interactions to prevent unnecessary refetches
  const trackUserInteraction = () => {
    lastUserInteraction = Date.now();
  };

  // Add event listeners for user interactions
  if (typeof window !== 'undefined') {
    ['click', 'scroll', 'keydown', 'touchstart'].forEach(event => {
      window.addEventListener(event, trackUserInteraction, { passive: true });
    });
  }

  return {
    isTabVisible,
    shouldRefetch,
    trackUserInteraction
  };
};

// Debounced wrapper for network requests
export const debounceNetworkRequest = <T extends (...args: any[]) => Promise<any>>(
  fn: T,
  delay: number = 500
): T => {
  let timeoutId: NodeJS.Timeout;
  let lastCall = 0;

  return ((...args: Parameters<T>) => {
    const now = Date.now();
    
    return new Promise((resolve, reject) => {
      clearTimeout(timeoutId);
      
      const execute = () => {
        lastCall = now;
        fn(...args).then(resolve).catch(reject);
      };

      // If it's been more than delay since last call, execute immediately
      if (now - lastCall > delay) {
        execute();
      } else {
        // Otherwise, debounce
        timeoutId = setTimeout(execute, delay);
      }
    });
  }) as T;
};
