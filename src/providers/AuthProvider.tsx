import { ReactNode, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useConnectionStore } from '@/stores/connectionStore';
import { useToast } from '@/hooks/use-toast';

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const { toast } = useToast();
  const initialize = useAuthStore(state => state.initialize);
  const startMonitoring = useConnectionStore(state => state.startMonitoring);
  const stopMonitoring = useConnectionStore(state => state.stopMonitoring);
  
  useEffect(() => {
    // Initialize auth and connection monitoring
    const initializeApp = async () => {
      try {
        // Start connection monitoring first
        startMonitoring();
        
        // Then initialize auth
        await initialize();
      } catch (error) {
        console.error('App initialization failed:', error);
        toast({
          title: "Initialization Failed",
          description: "There was a problem starting the app. Please refresh the page.",
          variant: "destructive",
        });
      }
    };
    
    initializeApp();
    
    // Cleanup on unmount
    return () => {
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