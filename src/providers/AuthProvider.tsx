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
    // Ultra-simplified initialization for startup performance
    const initializeApp = async () => {
      try {
        // Start connection monitoring immediately (non-blocking)
        startMonitoring();
        
        // Initialize auth (this is now handled by useSimplifiedStartup)
        await initialize();
        
        // Start auth monitoring after initialization
        startAuthMonitoring();
        
        console.log('✅ Auth provider initialized successfully');
      } catch (error) {
        console.error('❌ Auth initialization failed (graceful degradation):', error);
        // Don't block app startup - let it continue with limited functionality
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
  }, [initialize, startMonitoring, stopMonitoring, startAuthMonitoring, stopAuthMonitoring]);

  return <>{children}</>;
};