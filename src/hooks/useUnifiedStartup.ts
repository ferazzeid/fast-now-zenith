import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useUnifiedSession } from './useUnifiedSession';
import { useDeferredAssets } from './useDeferredAssets';
import { detectStuckLoading, forceCleanRestart } from '@/utils/startupPerformance';

/**
 * Unified Startup Manager
 * 
 * Replaces useSimplifiedStartup with proper coordination of:
 * 1. Auth initialization (with safeguards)
 * 2. Database connectivity 
 * 3. Asset loading
 * 4. Session readiness progression
 * 5. Mobile-specific recovery logic
 */
export const useUnifiedStartup = () => {
  const unifiedSession = useUnifiedSession();
  const initializingRef = useRef(false);
  const startTimeRef = useRef(Date.now());
  const [stuckRecoveryCount, setStuckRecoveryCount] = useState(0);
  
  // Track startup performance
  const [timeInCurrentState, setTimeInCurrentState] = useState(0);
  
  // Initialize auth system on mount (with safeguards)
  const initializeWithSafeguards = useCallback(async () => {
    // Prevent multiple simultaneous initializations
    if (initializingRef.current) {
      console.log('🔄 UnifiedStartup: Initialization already in progress, skipping...');
      return;
    }
    
    if (unifiedSession.readiness === 'ready') {
      console.log('🔄 UnifiedStartup: Already ready, skipping initialization');
      return;
    }
    
    initializingRef.current = true;
    console.log('🔄 UnifiedStartup: Starting initialization with safeguards');
    
    try {
      await unifiedSession.initialize();
    } catch (error) {
      console.error('🔄 UnifiedStartup: Initialization failed:', error);
    } finally {
      initializingRef.current = false;
    }
  }, [unifiedSession]);
  
  // Initialize on mount
  useEffect(() => {
    initializeWithSafeguards();
  }, [initializeWithSafeguards]);
  
  // Track time in current state for stuck detection
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeInCurrentState(Date.now() - startTimeRef.current);
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Reset timer when state changes
  useEffect(() => {
    startTimeRef.current = Date.now();
    setTimeInCurrentState(0);
  }, [unifiedSession.readiness]);
  
  // Mobile-specific stuck detection and recovery
  useEffect(() => {
    if (unifiedSession.readiness === 'loading' || unifiedSession.readiness === 'invalid') {
      const stuckTimeout = setTimeout(() => {
        const isStuck = detectStuckLoading(unifiedSession.readiness, timeInCurrentState);
        
        if (isStuck && stuckRecoveryCount < 3) {
          console.warn(`🔄 UnifiedStartup: Stuck in ${unifiedSession.readiness} state for ${timeInCurrentState}ms, attempting recovery ${stuckRecoveryCount + 1}/3`);
          setStuckRecoveryCount(prev => prev + 1);
          
          // Progressive recovery strategy
          if (stuckRecoveryCount === 0) {
            // First attempt: simple retry
            unifiedSession.retry();
          } else if (stuckRecoveryCount === 1) {
            // Second attempt: reset session and retry
            unifiedSession.reset();
            setTimeout(() => initializeWithSafeguards(), 1000);
          } else {
            // Final attempt: clear everything and force restart
            console.error('🔄 UnifiedStartup: Multiple recovery attempts failed, forcing clean restart');
            forceCleanRestart();
          }
        }
      }, unifiedSession.readiness === 'loading' ? 8000 : 5000); // Longer timeout for initial loading
      
      return () => clearTimeout(stuckTimeout);
    }
  }, [unifiedSession.readiness, timeInCurrentState, stuckRecoveryCount, unifiedSession, initializeWithSafeguards]);
  
  // Reset recovery count when successful
  useEffect(() => {
    if (unifiedSession.readiness === 'ready') {
      setStuckRecoveryCount(0);
    }
  }, [unifiedSession.readiness]);
  
  // Load assets immediately when user is authenticated
  useDeferredAssets(unifiedSession.readiness === 'ready' ? 'ready' : 'loading', false);
  
  return {
    readiness: unifiedSession.readiness,
    isReady: () => unifiedSession.readiness === 'ready' && !!unifiedSession.user,
    error: unifiedSession.error,
    retry: unifiedSession.retry,
    timeInCurrentState,
    stuckRecoveryCount,
    forceRestart: forceCleanRestart
  };
};