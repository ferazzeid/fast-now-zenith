import { useState, useEffect, useCallback } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useConnectionStore } from '@/stores/connectionStore';
import { useProfile } from '@/hooks/useProfile';
import { recordStartupMetric } from '@/utils/startupPerformance';

export type StartupState = 'loading' | 'auth' | 'profile' | 'ready' | 'error';

export const useSimplifiedStartup = () => {
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
        // Step 1: Auth check with timeout protection
        setState('auth');
        
        // Wait for auth to finish loading with timeout
        if (loading) {
          // Add timeout to prevent hanging on auth
          const authTimeout = setTimeout(() => {
            if (loading) {
              console.warn('⚠️ Auth loading timeout, continuing anyway');
            }
          }, 5000);
          
          return () => clearTimeout(authTimeout);
        }

        // Step 2: If authenticated, ensure database connectivity
        if (user && session) {
          setState('profile');
          recordStartupMetric('profile');

          // Test database connectivity with retry logic but with timeout
          let retries = 2; // Reduced retries to prevent hanging
          let dbConnected = false;
          
          while (retries > 0 && !dbConnected) {
            try {
              // Add timeout to database queries
              const dbTimeout = new Promise<never>((_, reject) => 
                setTimeout(() => reject(new Error('Database query timeout')), 3000)
              );
              
              const dbQuery = supabase
                .from('profiles')
                .select('id')
                .eq('user_id', user.id)
                .single();
              
              const result = await Promise.race([dbQuery, dbTimeout]);

              if (result.error && result.error.code !== 'PGRST116') { // Not a "not found" error
                throw result.error;
              }
              
              dbConnected = true;
              
              // Load profile but don't block on it - use background loading
              if (!profile && !profileLoading) {
                // Load profile in background without blocking startup
                loadProfile().catch(profileError => {
                  console.warn('Profile loading failed (non-blocking):', profileError);
                });
              }
            } catch (error) {
              console.error(`Database connection attempt failed (${3 - retries}/2):`, error);
              retries--;
              if (retries > 0) {
                // Shorter wait to prevent hanging
                await new Promise(resolve => setTimeout(resolve, 500));
              } else {
                // Don't block startup on database connection issues
                console.warn('Database connection failed, continuing without profile');
                break;
              }
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
  }, [user, session, loading, retryCount]); // Removed profile dependencies to prevent loops

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
    retry,
    forceRefresh,
    retryCount
  };
};