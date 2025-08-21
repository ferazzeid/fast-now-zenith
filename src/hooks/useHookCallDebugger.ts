import { useRef, useEffect } from 'react';

// Development-only hook to debug hook call patterns
const DEBUG_HOOKS = process.env.NODE_ENV === 'development';

interface HookCallInfo {
  componentName: string;
  hookName: string;
  callCount: number;
}

const globalHookCallMap = new Map<string, HookCallInfo>();

export const useHookCallDebugger = (componentName: string, hookName: string) => {
  const callCountRef = useRef(0);
  const key = `${componentName}-${hookName}`;
  
  if (DEBUG_HOOKS) {
    callCountRef.current++;
    
    // Update global tracking
    const existing = globalHookCallMap.get(key);
    if (existing) {
      existing.callCount = callCountRef.current;
    } else {
      globalHookCallMap.set(key, {
        componentName,
        hookName,
        callCount: callCountRef.current,
      });
    }
    
    // Log potential hook call inconsistencies
    if (callCountRef.current > 1) {
      console.log(`🔧 Hook re-called: ${key} (count: ${callCountRef.current})`);
    }
  }
  
  useEffect(() => {
    if (DEBUG_HOOKS) {
      // Check for hook call pattern changes on each render
      const allCalls = Array.from(globalHookCallMap.values());
      const inconsistentCalls = allCalls.filter(call => call.callCount !== callCountRef.current);
      
      if (inconsistentCalls.length > 0) {
        console.warn('🚨 Hook call pattern inconsistency detected:', {
          current: `${key}: ${callCountRef.current}`,
          inconsistent: inconsistentCalls.map(call => `${call.componentName}-${call.hookName}: ${call.callCount}`)
        });
      }
    }
  });
  
  return callCountRef.current;
};

// Helper to log all hook calls for debugging
export const logAllHookCalls = () => {
  if (DEBUG_HOOKS) {
    console.table(Array.from(globalHookCallMap.values()));
  }
};