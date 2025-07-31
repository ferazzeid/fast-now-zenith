import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useConnectionMonitor = () => {
  const [isConnected, setIsConnected] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  
  const checkConnection = async () => {
    try {
      const { error } = await supabase.from('profiles').select('id').limit(1);
      if (error) throw error;
      setIsConnected(true);
      setRetryCount(0);
      return true;
    } catch (error) {
      setIsConnected(false);
      return false;
    }
  };
  
  const forceRetry = () => {
    setRetryCount(0);
    checkConnection();
  };
  
  useEffect(() => {
    checkConnection();
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, []);
  
  return { isConnected, retryCount, forceRetry, checkConnection };
};