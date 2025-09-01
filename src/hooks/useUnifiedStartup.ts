import React, { useEffect } from 'react';
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
    if (unifiedSession.readiness === 'loading') {
      unifiedSession.initialize();
    }
  }, []);
  
  // Load assets immediately when user is authenticated
  useDeferredAssets(unifiedSession.readiness === 'ready' ? 'ready' : 'loading', false);
  
  return {
    readiness: unifiedSession.readiness,
    isReady: unifiedSession.isReady(),
    error: unifiedSession.error,
    retry: unifiedSession.retry
  };
};