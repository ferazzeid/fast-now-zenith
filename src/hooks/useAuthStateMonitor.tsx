import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from './useAuth';

/**
 * Continuously monitors auth.uid() in database context to detect synchronization failures
 * and automatically repairs them to prevent lockouts.
 * 
 * Mobile-optimized: Reduced frequency, startup-aware, better network handling
 */
export const useAuthStateMonitor = () => {
  const { toast } = useToast();
  const { user, loading } = useAuth();
  const monitoringRef = useRef<NodeJS.Timeout | null>(null);
  const failureCountRef = useRef(0);
  const lastRepairRef = useRef(0);
  const isStartupPhaseRef = useRef(true);

  const validateDatabaseAuth = useCallback(async () => {
    // Skip validation during startup phase
    if (isStartupPhaseRef.current || loading) {
      return { authWorking: true, error: null };
    }
    
    // Check network connectivity first (mobile optimization)
    if (!navigator.onLine) {
      return { authWorking: true, error: null };
    }
    
    try {
      // Test auth.uid() in database context
      const { data, error } = await supabase.rpc('is_current_user_admin');
      
      if (error) {
        // Check if it's an auth.uid() = NULL error
        if (error.message?.includes('permission denied') || 
            error.message?.includes('insufficient_privilege') ||
            error.message?.includes('new row violates')) {
          return { authWorking: false, error };
        }
        // Other errors might not be auth-related
        return { authWorking: true, error: null };
      }
      
      return { authWorking: true, error: null };
    } catch (error) {
      console.error('Auth validation error:', error);
      return { authWorking: false, error };
    }
  }, [loading]);

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
      const validation = await validateDatabaseAuth();
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
  }, [validateDatabaseAuth, toast]);

  const startMonitoring = useCallback(() => {
    if (monitoringRef.current) {
      clearInterval(monitoringRef.current);
    }
    
    // Don't start monitoring during startup phase
    if (isStartupPhaseRef.current) {
      console.log('🔍 Delaying auth monitoring until startup complete...');
      return;
    }
    
    console.log('🔍 Starting auth state monitoring...');
    
    // Longer interval on mobile to reduce battery drain
    const monitorInterval = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ? 30000 : 15000;
    
    monitoringRef.current = setInterval(async () => {
      // Skip if offline
      if (!navigator.onLine) {
        return;
      }
      
      const { data: { session } } = await supabase.auth.getSession();
      
      // Only monitor if user is supposed to be authenticated and system is ready
      if (!session?.user?.id || loading) {
        failureCountRef.current = 0;
        return;
      }
      
      const validation = await validateDatabaseAuth();
      
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
    }, monitorInterval);
  }, [validateDatabaseAuth, repairAuthState, toast, loading]);

  const stopMonitoring = useCallback(() => {
    if (monitoringRef.current) {
      console.log('🛑 Stopping auth state monitoring');
      clearInterval(monitoringRef.current);
      monitoringRef.current = null;
    }
  }, []);

  useEffect(() => {
    // Track when startup phase ends
    const checkStartupPhase = () => {
      if (!loading) {
        isStartupPhaseRef.current = false;
        // Start monitoring after startup phase ends
        setTimeout(startMonitoring, 3000);
      }
    };
    
    checkStartupPhase();
  }, [loading, startMonitoring]);

  useEffect(() => {
    // Start monitoring when user signs in
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user?.id) {
        // Reset startup phase flag
        isStartupPhaseRef.current = false;
        // Longer delay to let auth fully settle on mobile
        setTimeout(startMonitoring, 5000);
      } else if (event === 'SIGNED_OUT') {
        stopMonitoring();
        failureCountRef.current = 0;
        isStartupPhaseRef.current = true; // Reset for next login
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
    validateDatabaseAuth,
    repairAuthState
  };
};
