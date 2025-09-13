import { ReactNode, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useConnectionStore } from '@/stores/connectionStore';
import { useToast } from '@/hooks/use-toast';
import { useAuthStateMonitor } from '@/hooks/useAuthStateMonitor';
import { storageReady } from '@/integrations/supabase/storage';

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
    // Initialize auth and connection monitoring with coordination
    const initializeApp = async () => {
      try {
        // Add coordination flag to prevent conflicts
        (window as any).__initializingApp = true;
        
        // Start connection monitoring first
        startMonitoring();
        
        // Small delay to prevent race conditions
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Then initialize auth after storage is ready
        await storageReady;
        await initialize();
        
        // Start auth state monitoring
        startAuthMonitoring();
        
        (window as any).__initializingApp = false;
      } catch (error) {
        console.error('App initialization failed:', error);
        (window as any).__initializingApp = false;
        
        // Wait 3 seconds before showing error to avoid premature failures
        setTimeout(() => {
          // Only show error if we're still having issues
          if (!(window as any).__authInitialized) {
            toast({
              title: "Initialization Failed",
              description: "There was a problem starting the app. Please refresh the page.",
              variant: "destructive",
            });
          }
        }, 3000);
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