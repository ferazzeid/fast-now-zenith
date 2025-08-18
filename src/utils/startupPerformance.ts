/**
 * Startup performance utilities for the simplified architecture
 */

export const StartupMetrics = {
  start: performance.now(),
  auth: 0,
  profile: 0,
  ready: 0,
};

export const recordStartupMetric = (stage: keyof typeof StartupMetrics) => {
  if (stage === 'start') return;
  
  StartupMetrics[stage] = performance.now();
  
  if (process.env.NODE_ENV !== 'production') {
    const timeSinceStart = StartupMetrics[stage] - StartupMetrics.start;
    console.log(`🚀 Startup ${stage}: ${timeSinceStart.toFixed(2)}ms`);
    
    if (stage === 'ready') {
      console.log('📊 Startup Summary:', {
        'Auth Time': StartupMetrics.auth ? `${(StartupMetrics.auth - StartupMetrics.start).toFixed(2)}ms` : 'N/A',
        'Profile Time': StartupMetrics.profile ? `${(StartupMetrics.profile - StartupMetrics.start).toFixed(2)}ms` : 'N/A',
        'Total Time': `${timeSinceStart.toFixed(2)}ms`
      });
    }
  }
};

/**
 * Clear all caches and force a clean restart
 */
export const forceCleanRestart = async () => {
  try {
    // Clear all storage
    if (typeof window !== 'undefined') {
      localStorage.clear();
      sessionStorage.clear();
      
      // Clear service worker caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }
      
      // Unregister service workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map(registration => registration.unregister()));
      }
    }
    
    // Force reload
    window.location.reload();
  } catch (error) {
    console.error('Clean restart failed:', error);
    window.location.reload();
  }
};

/**
 * Check if we're in a stuck loading state
 */
export const detectStuckLoading = (currentState: string, timeInState: number): boolean => {
  const stuckThresholds = {
    loading: 8000,  // 8 seconds
    auth: 5000,     // 5 seconds
    profile: 3000,  // 3 seconds
  };
  
  const threshold = stuckThresholds[currentState as keyof typeof stuckThresholds] || 10000;
  return timeInState > threshold;
};