import { useEffect, useRef } from 'react';

/**
 * Hook debugging utility to track hook consistency issues
 * Helps identify React #300 errors in development
 */
export const useHookDebugging = (componentName: string) => {
  const hookCountRef = useRef(0);
  const renderCountRef = useRef(0);
  
  useEffect(() => {
    renderCountRef.current++;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔍 [${componentName}] Render #${renderCountRef.current} completed with ${hookCountRef.current} hooks`);
      
      // Reset hook count for next render
      hookCountRef.current = 0;
    }
  });

  const trackHook = (hookName: string) => {
    if (process.env.NODE_ENV === 'development') {
      hookCountRef.current++;
      console.log(`🪝 [${componentName}] Hook #${hookCountRef.current}: ${hookName}`);
    }
  };

  return { trackHook };
};

/**
 * Hook to add to components that might have conditional hook calls
 */
export const useHookConsistencyCheck = (componentName: string) => {
  const { trackHook } = useHookDebugging(componentName);
  
  return {
    trackHook,
    // Wrapper for conditional logic that might affect hooks
    withConsistentHooks: <T>(condition: boolean, hookFn: () => T, fallback: T): T => {
      if (process.env.NODE_ENV === 'development') {
        trackHook(`conditional-${hookFn.name || 'anonymous'}`);
      }
      
      // Always call the hook, but conditionally use its result
      const result = hookFn();
      return condition ? result : fallback;
    }
  };
};