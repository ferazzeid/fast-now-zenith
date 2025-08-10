import { ReactNode, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useConnectionStore } from '@/stores/connectionStore';
import { useToast } from '@/hooks/use-toast';
import { performAuthCleanupIfNeeded, handleGoogleAuthRedirectCleanup } from '@/utils/authCleanup';

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const { toast } = useToast();
  const initialize = useAuthStore(state => state.initialize);
  const startMonitoring = useConnectionStore(state => state.startMonitoring);
  const stopMonitoring = useConnectionStore(state => state.stopMonitoring);
  
  useEffect(() => {
    // Initialize app with better error handling and cleanup
    const initializeApp = async () => {
      try {
        console.log('🚀 Starting app initialization...');
        
        // Clean up any OAuth redirect artifacts first
        handleGoogleAuthRedirectCleanup();
        
        // Check for and clean up stuck auth states
        const hadStuckState = performAuthCleanupIfNeeded();
        if (hadStuckState) {
          toast({
            title: "Session Recovered",
            description: "Cleared stuck authentication state.",
            duration: 3000,
          });
        }
        
        // Start connection monitoring first
        startMonitoring();
        
        // Initialize auth without aggressive timeout
        await initialize();
        console.log('🚀 App initialization complete');
        
      } catch (error) {
        console.error('🚀 App initialization failed:', error);
      }
    };
    
    initializeApp();
    
    // Cleanup on unmount
    return () => {
      console.log('🚀 Cleaning up auth provider...');
      stopMonitoring();
      
      // Clean up auth subscription
      const subscription = (window as any).__authSubscription;
      if (subscription) {
        subscription.unsubscribe();
        delete (window as any).__authSubscription;
      }
    };
  }, [initialize, startMonitoring, stopMonitoring, toast]);

  return <>{children}</>;
};