import { useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

/**
 * Session Guard Hook - Prevents operations during auth instability
 * Helps prevent the constant logout issue by ensuring operations only proceed with valid sessions
 */
export const useSessionGuard = () => {
  const { session, checkSessionHealth } = useAuth();
  const { toast } = useToast();

  // Enhanced session validation with retry mechanism
  const withSessionGuard = useCallback(async <T>(
    operation: () => Promise<T>,
    operationName = 'Operation'
  ): Promise<T | null> => {
    console.log(`🛡️ Session Guard: Starting ${operationName}`);
    
    // Check if we have a session
    if (!session) {
      console.log(`🛡️ Session Guard: Blocking ${operationName} - no session`);
      toast({
        title: "Authentication Required",
        description: "Please sign in to continue.",
        variant: "destructive",
      });
      return null;
    }

    // Check session health before proceeding
    try {
      const sessionHealthy = await checkSessionHealth();
      if (!sessionHealthy) {
        console.log(`🛡️ Session Guard: Blocking ${operationName} - session expired`);
        toast({
          title: "Session Expired",
          description: "Please refresh the page and sign in again.",
          variant: "destructive",
        });
        return null;
      }

      console.log(`🛡️ Session Guard: Allowing ${operationName} - session valid`);
      return await operation();
    } catch (error) {
      console.error(`🛡️ Session Guard: Error during ${operationName}:`, error);
      
      // Check if it's an authentication error specifically
      const errorMessage = error instanceof Error ? error.message.toLowerCase() : '';
      if (errorMessage.includes('auth') || errorMessage.includes('session') || errorMessage.includes('token')) {
        toast({
          title: "Authentication Error", 
          description: "Your session has expired. Please refresh the page and sign in again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Operation Failed", 
          description: error instanceof Error ? error.message : "An unexpected error occurred.",
          variant: "destructive",
        });
      }
      return null;
    }
  }, [session, checkSessionHealth, toast]);

  return {
    withSessionGuard,
    isSessionHealthy: !!session,
  };
};