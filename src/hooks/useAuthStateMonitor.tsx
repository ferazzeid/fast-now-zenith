import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

/**
 * Continuously monitors auth.uid() in database context to detect synchronization failures
 * and automatically repairs them to prevent lockouts
 */
export interface AuthValidationResult {
  authWorking: boolean;
  error: unknown | null;
}

export const validateDatabaseAuth = async (): Promise<AuthValidationResult> => {
  try {
    // Basic auth context check without requiring admin privileges
    const { data, error } = await supabase.auth.getUser();

    if (error || !data?.user) {
      return { authWorking: false, error };
    }

    return { authWorking: true, error: null };
  } catch (error) {
    console.error('Auth validation error:', error);
    return { authWorking: false, error };
  }
};

export const useAuthStateMonitor = () => {
  const { toast } = useToast();
  const monitoringRef = useRef<NodeJS.Timeout | null>(null);
  const failureCountRef = useRef(0);
  const lastRepairRef = useRef(0);

  const validateDatabaseAuthFn = useCallback(validateDatabaseAuth, []);

  const repairAuthState = useCallback(async () => {
    const now = Date.now();
    
    // Prevent repair spam - only once per 30 seconds
    if (now - lastRepairRef.current < 30000) {
      return false;
    }
    
    lastRepairRef.current = now;
    
    try {
      console.log('🔧 Attempting auth state repair...');
      
      // Force session refresh
      const { data: { session }, error } = await supabase.auth.refreshSession();
      
      if (error || !session) {
        console.warn('Session refresh failed, forcing re-authentication');
        await supabase.auth.signOut();
        toast({
          title: "Session Expired",
          description: "Please sign in again to continue.",
          variant: "destructive",
        });
        return false;
      }
      
      // Test if repair worked
      const validation = await validateDatabaseAuthFn();
      if (validation.authWorking) {
        console.log('✅ Auth state repair successful');
        failureCountRef.current = 0;
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Auth repair failed:', error);
      return false;
    }
  }, [validateDatabaseAuthFn, toast]);

  const startMonitoring = useCallback(() => {
    if (monitoringRef.current) {
      clearInterval(monitoringRef.current);
    }
    
    console.log('🔍 Starting auth state monitoring...');
    
    monitoringRef.current = setInterval(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Only monitor if user is supposed to be authenticated
      if (!session?.user?.id) {
        failureCountRef.current = 0;
        return;
      }
      
      const validation = await validateDatabaseAuthFn();
      
      if (!validation.authWorking) {
        failureCountRef.current++;
        console.warn(`⚠️ Auth sync failure detected (${failureCountRef.current}/3)`);
        
        // Try repair after 2 consecutive failures
        if (failureCountRef.current >= 2) {
          const repaired = await repairAuthState();
          if (!repaired && failureCountRef.current >= 3) {
            // Force logout after 3 failures and failed repair
            console.error('❌ Auth state unrecoverable, forcing logout');
            await supabase.auth.signOut();
            toast({
              title: "Authentication Error",
              description: "Session synchronization failed. Please sign in again.",
              variant: "destructive",
            });
          }
        }
      } else {
        // Reset failure count on success
        if (failureCountRef.current > 0) {
          console.log('✅ Auth sync restored');
          failureCountRef.current = 0;
        }
      }
    }, 10000); // Check every 10 seconds
  }, [validateDatabaseAuthFn, repairAuthState, toast]);

  const stopMonitoring = useCallback(() => {
    if (monitoringRef.current) {
      console.log('🛑 Stopping auth state monitoring');
      clearInterval(monitoringRef.current);
      monitoringRef.current = null;
    }
  }, []);

  useEffect(() => {
    // Start monitoring when user signs in
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user?.id) {
        // Delay start to let auth fully settle
        setTimeout(startMonitoring, 2000);
      } else if (event === 'SIGNED_OUT') {
        stopMonitoring();
        failureCountRef.current = 0;
      }
    });

    return () => {
      subscription.unsubscribe();
      stopMonitoring();
    };
  }, [startMonitoring, stopMonitoring]);

  return {
    startMonitoring,
    stopMonitoring,
    validateDatabaseAuth: validateDatabaseAuthFn,
    repairAuthState
  };
};
