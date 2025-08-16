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

  // Simple session validation - no complex recovery logic
  const withSessionGuard = useCallback(async <T>(
    operation: () => Promise<T>,
    operationName = 'Operation'
  ): Promise<T | null> => {
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
          description: "Please sign in again to continue.",
          variant: "destructive",
        });
        return null;
      }

      console.log(`🛡️ Session Guard: Allowing ${operationName} - session valid`);
      return await operation();
    } catch (error) {
      console.error(`🛡️ Session Guard: Error during ${operationName}:`, error);
      toast({
        title: "Session Error", 
        description: "Please sign in again to continue.",
        variant: "destructive",
      });
      return null;
    }
  }, [session, checkSessionHealth, toast]);

  return {
    withSessionGuard,
    isSessionHealthy: !!session,
  };
};