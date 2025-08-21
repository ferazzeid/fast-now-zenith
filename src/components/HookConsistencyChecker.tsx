import { useEffect } from 'react';
import { logAllHookCalls } from '@/hooks/useHookCallDebugger';

// Development component to check hook call consistency
export const HookConsistencyChecker = () => {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // Log hook calls every 5 seconds to check for inconsistencies
      const interval = setInterval(() => {
        logAllHookCalls();
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, []);
  
  return null;
};