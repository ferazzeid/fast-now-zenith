import { useConnectionStore } from '@/stores/connectionStore';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';

export const ConnectionStatus = () => {
  const { isOnline, isConnected, retryCount, queue } = useConnectionStore();
  const { toast } = useToast();
  const [lastToastTime, setLastToastTime] = useState(0);
  const [prolongedOutageStart, setProlongedOutageStart] = useState<number | null>(null);

  // Track prolonged outages (>5 minutes)
  useEffect(() => {
    if (!isOnline || !isConnected) {
      if (!prolongedOutageStart) {
        setProlongedOutageStart(Date.now());
      }
    } else {
      setProlongedOutageStart(null);
    }
  }, [isOnline, isConnected, prolongedOutageStart]);

  // Show toast for brief connectivity issues (not too frequent)
  useEffect(() => {
    const now = Date.now();
    if (!isConnected && isOnline && now - lastToastTime > 30000) { // Max one toast per 30 seconds
      toast({
        title: "Connection Issue",
        description: "Checking connection...",
        duration: 3000,
      });
      setLastToastTime(now);
    }
  }, [isConnected, isOnline, toast, lastToastTime]);

  // Show toast when connection is restored
  useEffect(() => {
    if (isConnected && isOnline && retryCount > 0) {
      toast({
        title: "Connected",
        description: "Connection restored successfully",
        duration: 2000,
      });
    }
  }, [isConnected, isOnline, retryCount, toast]);

  // For now, we don't render any persistent UI elements
  // The connection status is shown via the navigation dot
  return null;
};