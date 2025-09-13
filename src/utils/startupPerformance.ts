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
    loading: 10000,  // 10 seconds (increased for mobile)
    invalid: 8000,   // 8 seconds
    auth: 6000,      // 6 seconds  
    profile: 4000,   // 4 seconds
  };
  
  const threshold = stuckThresholds[currentState as keyof typeof stuckThresholds] || 12000;
  return timeInState > threshold;
};

/**
 * Mobile-specific recovery utilities
 */
export const MobileRecovery = {
  /**
   * Check if we're on a mobile device
   */
  isMobile: (): boolean => {
    return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  },

  /**
   * Clear persisted auth state (more aggressive than normal clear)
   */
  clearPersistedAuth: async (): Promise<void> => {
    try {
      // Clear all auth-related localStorage keys
      const authKeys = [
        'auth-storage',
        'unified-session-storage',
        'supabase.auth.token',
        'sb-auth-token'
      ];
      
      authKeys.forEach(key => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      });
      
      console.log('🧹 MobileRecovery: Cleared persisted auth state');
    } catch (error) {
      console.error('MobileRecovery: Failed to clear auth state:', error);
    }
  },

  /**
   * Progressive recovery strategy for mobile
   */
  progressiveRecovery: async (attempt: number): Promise<void> => {
    console.log(`📱 MobileRecovery: Attempt ${attempt}/3`);
    
    switch (attempt) {
      case 1:
        // Light recovery - just clear session cache
        sessionStorage.clear();
        break;
        
      case 2:
        // Medium recovery - clear auth state
        await MobileRecovery.clearPersistedAuth();
        break;
        
      case 3:
        // Full recovery - nuclear option
        await forceCleanRestart();
        break;
    }
  }
};