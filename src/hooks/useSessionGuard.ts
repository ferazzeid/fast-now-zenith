import { useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

/**
 * Session Guard Hook - Prevents operations during auth instability
 * Helps prevent the constant logout issue by ensuring operations only proceed with valid sessions
 */
export const useSessionGuard = () => {
  const { session, checkSessionHealth, recoverSession, isRecoveringSession } = useAuth();
  const { toast } = useToast();

  // Session-protected operation wrapper
  const withSessionGuard = useCallback(async <T>(
    operation: () => Promise<T>,
    operationName = 'Operation'
  ): Promise<T | null> => {
    // Check if we're already recovering
    if (isRecoveringSession) {
      console.log(`🛡️ Session Guard: Blocking ${operationName} - session recovery in progress`);
      toast({
        title: "Please wait",
        description: "Session recovery in progress. Please try again in a moment.",
        variant: "default",
      });
      return null;
    }

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
        console.log(`🛡️ Session Guard: Blocking ${operationName} - session unhealthy`);
        toast({
          title: "Session Issue",
          description: "Please refresh the page and try again.",
          variant: "destructive",
        });
        return null;
      }

      console.log(`🛡️ Session Guard: Allowing ${operationName} - session healthy`);
      return await operation();
    } catch (error) {
      console.error(`🛡️ Session Guard: Error during ${operationName}:`, error);
      
      // Attempt session recovery
      const recovered = await recoverSession();
      if (recovered) {
        toast({
          title: "Session Recovered",
          description: "Please try your action again.",
        });
      } else {
        toast({
          title: "Session Error",
          description: "Please sign in again to continue.",
          variant: "destructive",
        });
      }
      
      return null;
    }
  }, [session, checkSessionHealth, recoverSession, isRecoveringSession, toast]);

  // Periodic session health check
  useEffect(() => {
    if (!session) return;

    const healthCheckInterval = setInterval(async () => {
      try {
        await checkSessionHealth();
      } catch (error) {
        console.error('🛡️ Session Guard: Health check failed:', error);
      }
    }, 2 * 60 * 1000); // Check every 2 minutes

    return () => clearInterval(healthCheckInterval);
  }, [session, checkSessionHealth]);

  return {
    withSessionGuard,
    isSessionHealthy: !!session && !isRecoveringSession,
    isRecoveringSession,
  };
};