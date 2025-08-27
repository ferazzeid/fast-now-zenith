import { useEffect } from 'react';
import { useUnifiedSession } from './useUnifiedSession';
import { useDeferredAssets } from './useDeferredAssets';

/**
 * Unified Startup Manager
 * 
 * Replaces useSimplifiedStartup with proper coordination of:
 * 1. Auth initialization
 * 2. Database connectivity 
 * 3. Asset loading
 * 4. Session readiness progression
 */
export const useUnifiedStartup = () => {
  const unifiedSession = useUnifiedSession();
  
  // Initialize auth system on mount
  useEffect(() => {
    if (unifiedSession.readiness === 'initializing') {
      unifiedSession.initialize();
    }
  }, []);
  
  // Load deferred assets when database is ready
  const shouldLoadAssets = unifiedSession.readiness === 'database-ready' && 
                          unifiedSession.isDatabaseConnected;
  
  useDeferredAssets(shouldLoadAssets ? 'ready' : 'loading', false);
  
  // Mark assets as ready when they finish loading
  useEffect(() => {
    if (shouldLoadAssets && !unifiedSession.areAssetsLoaded) {
      // Small delay to let assets initialize
      const timer = setTimeout(() => {
        unifiedSession.markAssetsReady();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [shouldLoadAssets, unifiedSession.areAssetsLoaded]);
  
  return {
    readiness: unifiedSession.readiness,
    isReady: unifiedSession.isReady(),
    error: unifiedSession.error,
    retry: unifiedSession.retry,
    canPerformUserOperations: unifiedSession.canPerformUserOperations(),
    canPerformDatabaseOperations: unifiedSession.canPerformDatabaseOperations()
  };
};