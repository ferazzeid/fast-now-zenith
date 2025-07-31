import { useAuth } from './useAuth';
import { useState, useEffect, useRef } from 'react';

// Stable auth hook that prevents cascading loading states
export const useStableAuth = () => {
  const { user, session, loading } = useAuth();
  const [stableUser, setStableUser] = useState(user);
  const [isReady, setIsReady] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  useEffect(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    if (loading) {
      // Set a maximum wait time for auth
      timeoutRef.current = setTimeout(() => {
        console.warn('Auth loading timeout - assuming no user');
        setStableUser(null);
        setIsReady(true);
      }, 5000);
    } else {
      // Auth has resolved
      setStableUser(user);
      setIsReady(true);
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = undefined;
      }
    }
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [user, loading]);
  
  return {
    user: stableUser,
    session,
    loading: !isReady,
    isReady
  };
};