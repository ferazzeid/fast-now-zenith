import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useConnectionStore } from '@/stores/connectionStore';
import { useToast } from '@/hooks/use-toast';

/**
 * Hook to handle auth recovery and cleanup stuck states
 */
export const useAuthRecovery = () => {
  const { reset, loading, initialized } = useAuthStore();
  const { isConnected } = useConnectionStore();
  const { toast } = useToast();

  useEffect(() => {
    // Recovery mechanism for stuck loading states
    let recoveryTimer: NodeJS.Timeout;

    if (loading && !initialized) {
      // If we're stuck loading for too long, attempt recovery
      recoveryTimer = setTimeout(() => {
        console.log('🔧 Auth recovery: Stuck loading detected, attempting recovery...');
        
        // Clear any stuck localStorage auth data
        try {
          const authStorage = localStorage.getItem('auth-storage');
          if (authStorage) {
            const parsed = JSON.parse(authStorage);
            // Keep only the initialized flag, clear potentially corrupted session data
            localStorage.setItem('auth-storage', JSON.stringify({
              state: { initialized: false },
              version: parsed.version || 0
            }));
          }
        } catch (error) {
          console.error('🔧 Auth recovery: localStorage cleanup failed:', error);
          localStorage.removeItem('auth-storage');
        }

        // Reset auth state
        reset();
        
        toast({
          title: "Recovering Session",
          description: "Attempting to restore your session...",
          duration: 3000,
        });

        // Force reload if recovery doesn't work within 5 seconds
        setTimeout(() => {
          if (useAuthStore.getState().loading) {
            console.log('🔧 Auth recovery: Force reload required');
            window.location.reload();
          }
        }, 5000);
        
      }, 15000); // 15 second timeout for recovery
    }

    return () => {
      if (recoveryTimer) {
        clearTimeout(recoveryTimer);
      }
    };
  }, [loading, initialized, reset, toast]);

  // Handle page visibility changes to recover from stuck states
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Check if we're in a stuck state when page becomes visible
        const { loading, initialized } = useAuthStore.getState();
        if (loading && initialized) {
          console.log('🔧 Page visible: Checking for stuck auth state...');
          
          // Give it a moment, then check if still stuck
          setTimeout(() => {
            const currentState = useAuthStore.getState();
            if (currentState.loading && currentState.initialized) {
              console.log('🔧 Stuck auth state detected on page focus, recovering...');
              reset();
            }
          }, 2000);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [reset]);

  return {
    isRecovering: loading && !initialized,
  };
};
