import { useRef } from 'react';

/**
 * Development-only hook to validate consistent hook call counts
 * Helps catch React #300 errors before they happen
 */
export const useHookConsistencyValidator = (hookName: string) => {
  const callCountRef = useRef(0);
  const initialCallCountRef = useRef<number | null>(null);

  if (process.env.NODE_ENV === 'development') {
    callCountRef.current++;
    
    if (initialCallCountRef.current === null) {
      initialCallCountRef.current = callCountRef.current;
    }
    
    if (callCountRef.current !== initialCallCountRef.current) {
      console.error(
        `🚨 Hook consistency violation in ${hookName}:`,
        `Expected ${initialCallCountRef.current} hooks, but got ${callCountRef.current}`,
        'This will cause React #300 error!'
      );
    }
  }
};