import React, { useEffect, useCallback } from 'react';
import { useUnifiedSession } from './useUnifiedSession';
import { useDeferredAssets } from './useDeferredAssets';

/**
 * Unified Startup Manager - Clean and Simple
 */
export const useUnifiedStartup = () => {
  const unifiedSession = useUnifiedSession();
  
  // Initialize auth system on mount (once only)
  const initialize = useCallback(() => {
    if (unifiedSession.readiness === 'loading') {
      unifiedSession.initialize();
    }
  }, [unifiedSession]);
  
  useEffect(() => {
    initialize();
  }, [initialize]);
  
  // Load assets when ready
  useDeferredAssets(unifiedSession.readiness === 'ready' ? 'ready' : 'loading', false);
  
  return {
    readiness: unifiedSession.readiness,
    isReady: unifiedSession.isReady,
    error: unifiedSession.error,
    retry: unifiedSession.retry
  };
};