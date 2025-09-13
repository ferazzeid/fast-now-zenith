import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useConnectionMonitor = () => {
  const [isConnected, setIsConnected] = useState(true);
  const [lastCheck, setLastCheck] = useState<Date>(new Date());
  const [retryCount, setRetryCount] = useState(0);

  const checkConnection = async () => {
    try {
      // Simple health check query
      const { error } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);
      
      if (error) {
        console.warn('Connection check failed:', error);
        setIsConnected(false);
        setRetryCount(prev => prev + 1);
      } else {
        setIsConnected(true);
        setRetryCount(0);
      }
      
      setLastCheck(new Date());
    } catch (error) {
      console.error('Connection monitor error:', error);
      setIsConnected(false);
      setRetryCount(prev => prev + 1);
    }
  };

  useEffect(() => {
    // Initial check
    checkConnection();

    // Set up periodic checks (every 30 seconds when connected, every 10 when not)
    const interval = setInterval(
      checkConnection,
      isConnected ? 30000 : 10000
    );

    return () => clearInterval(interval);
  }, [isConnected]);

  // Also monitor online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsConnected(true);
      checkConnection();
    };
    
    const handleOffline = () => {
      setIsConnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    isConnected,
    lastCheck,
    retryCount,
    checkConnection,
    isUnstable: retryCount > 2
  };
};