import { ReactNode, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useConnectionStore } from '@/stores/connectionStore';
import { useToast } from '@/hooks/use-toast';
import { useAuthStateMonitor } from '@/hooks/useAuthStateMonitor';

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const { toast } = useToast();
  const initialize = useAuthStore(state => state.initialize);
  const startMonitoring = useConnectionStore(state => state.startMonitoring);
  const stopMonitoring = useConnectionStore(state => state.stopMonitoring);
  const { startMonitoring: startAuthMonitoring, stopMonitoring: stopAuthMonitoring } = useAuthStateMonitor();
  
  useEffect(() => {
    // Simplified initialization to prevent race conditions
    const initializeApp = async () => {
      try {
        startMonitoring();
        await initialize();
        startAuthMonitoring();
      } catch (error) {
        console.error('App initialization failed:', error);
        // Graceful degradation - don't block app
      }
    };
    
    initializeApp();
    
    // Cleanup on unmount
    return () => {
      stopMonitoring();
      stopAuthMonitoring();
      
      // Clean up auth subscription
      const subscription = (window as any).__authSubscription;
      if (subscription) {
        subscription.unsubscribe();
        delete (window as any).__authSubscription;
      }
    };
  }, [initialize, startMonitoring, stopMonitoring, startAuthMonitoring, stopAuthMonitoring, toast]);

  return <>{children}</>;
};