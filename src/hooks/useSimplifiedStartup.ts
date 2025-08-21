import { useState, useEffect, useCallback } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';

import { useConnectionStore } from '@/stores/connectionStore';
import { useProfile } from '@/hooks/useProfile';
import { recordStartupMetric } from '@/utils/startupPerformance';

export type StartupState = 'loading' | 'auth' | 'profile' | 'ready' | 'error';

export const useSimplifiedStartup = (isNativeApp: boolean) => {
  const [state, setState] = useState<StartupState>('loading');
  const [error, setError] = useState<string>('');
  const [retryCount, setRetryCount] = useState(0);

  const { user, session, loading } = useAuthContext();
  
  const { isOnline } = useConnectionStore();
  const { profile, loading: profileLoading, loadProfile } = useProfile();

  // Force refresh that clears everything
  const forceRefresh = useCallback(() => {
    try {
      // Clear all caches
      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
        if ('caches' in window) {
          caches.keys().then(names => {
            names.forEach(name => caches.delete(name));
          });
        }
      }
      
      // Reload the page
      window.location.reload();
    } catch (error) {
      console.error('Force refresh failed:', error);
      window.location.reload();
    }
  }, []);

  // Retry current operation
  const retry = useCallback(async () => {
    setRetryCount(prev => prev + 1);
    setError('');
    setState('loading');
  }, []);

  // Main startup flow
  useEffect(() => {
    const runStartup = async () => {
      try {
        // Step 1: Auth check
        setState('auth');
        
        // Wait for auth to finish loading
        if (loading) {
          return; // Still loading, wait
        }

        // Step 2: If authenticated, load profile (non-blocking)
        if (user && session) {
          setState('profile');
          
          // Load profile but don't block on it
          if (!profile && !profileLoading) {
            try {
              await loadProfile();
            } catch (profileError) {
              // Profile loading failed, but don't block startup
              console.warn('Profile loading failed (non-blocking):', profileError);
            }
          }
        }

        // Step 3: Ready
        setState('ready');
        recordStartupMetric('ready');
        
      } catch (error) {
        console.error('Startup failed:', error);
        setError(error instanceof Error ? error.message : 'Startup failed');
        setState('error');
      }
    };

    runStartup();
  }, [user, session, loading, profile, profileLoading, loadProfile]);

  // Auto-retry on connection restore (but only if in error state)
  useEffect(() => {
    if (isOnline && state === 'error' && retryCount < 3) {
      const timer = setTimeout(() => {
        retry();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, state, retry, retryCount]);

  return {
    state,
    error,
    isOnline,
    isNativeApp,
    retry,
    forceRefresh,
    retryCount
  };
};