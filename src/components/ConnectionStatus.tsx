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

  // Show toast for connectivity issues (less aggressive)
  useEffect(() => {
    const now = Date.now();
    // Only show if not during app initialization and with longer delay
    if (!isConnected && isOnline && now - lastToastTime > 60000 && !(window as any).__initializingApp) {
      toast({
        title: "Connection Issue",
        description: "Checking connection...",
        duration: 2000,
      });
      setLastToastTime(now);
    }
  }, [isConnected, isOnline, toast, lastToastTime]);

  // Show toast when connection is restored (only if we had real issues)
  useEffect(() => {
    if (isConnected && isOnline && retryCount > 2 && !(window as any).__initializingApp) {
      toast({
        title: "Connected",
        description: "Connection restored successfully",
        duration: 1500,
      });
    }
  }, [isConnected, isOnline, retryCount, toast]);

  // For now, we don't render any persistent UI elements
  // The connection status is shown via the navigation dot
  return null;
};