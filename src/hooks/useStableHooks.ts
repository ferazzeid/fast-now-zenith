import { useCallback, useRef } from 'react';

/**
 * Hook stabilization wrapper to prevent React #300 errors
 * Ensures consistent hook execution order regardless of auth state
 */
export const useStableHooks = () => {
  const hookCountRef = useRef(0);
  const renderIdRef = useRef(0);

  const trackHook = useCallback((hookName: string, position: number) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🪝 Hook ${position}: ${hookName} (render ${renderIdRef.current})`);
    }
    hookCountRef.current = Math.max(hookCountRef.current, position);
  }, []);

  const startRender = useCallback(() => {
    renderIdRef.current++;
    hookCountRef.current = 0;
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔄 Starting render ${renderIdRef.current}`);
    }
  }, []);

  const endRender = useCallback(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ Render ${renderIdRef.current} complete - ${hookCountRef.current} hooks called`);
    }
  }, []);

  return {
    trackHook,
    startRender,
    endRender,
    currentHookCount: hookCountRef.current,
    currentRender: renderIdRef.current,
  };
};

/**
 * Wraps query functions to ensure they never return conditionally
 * Always returns a stable result regardless of auth state
 */
export const wrapQueryFunction = <T>(
  queryFn: () => Promise<T>,
  fallbackValue: T,
  condition: boolean = true
) => {
  return async () => {
    if (!condition) {
      return fallbackValue;
    }
    return await queryFn();
  };
};

/**
 * Hook wrapper that ensures consistent execution
 */
export const useConsistentQuery = <T>(
  queryFn: () => Promise<T>,
  fallbackValue: T,
  enabled: boolean = true
) => {
  // Always call the same hooks in the same order
  const wrappedFn = useCallback(
    () => wrapQueryFunction(queryFn, fallbackValue, enabled)(),
    [queryFn, fallbackValue, enabled]
  );

  return {
    queryFn: wrappedFn,
    enabled: true, // Always enabled, condition handled inside
  };
};