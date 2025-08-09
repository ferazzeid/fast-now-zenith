import { useConnectionStore } from '@/stores/connectionStore';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { WifiOff, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

export const OfflineStatusBanner = () => {
  const { isOnline, isConnected } = useConnectionStore();
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Show banner immediately when going offline or losing connection
    if (!isOnline || !isConnected) {
      setShowBanner(true);
    } else {
      // Hide banner with a slight delay when connection is restored
      const timer = setTimeout(() => setShowBanner(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, isConnected]);

  if (!showBanner) return null;

  return (
    <Alert className="fixed top-20 left-4 right-4 max-w-sm mx-auto z-50 border-yellow-200 bg-yellow-100/90 dark:border-yellow-800 dark:bg-yellow-900/90 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        {!isOnline ? (
          <WifiOff className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
        ) : (
          <Loader2 className="h-4 w-4 text-yellow-600 dark:text-yellow-400 animate-spin" />
        )}
        <AlertDescription className="text-yellow-800 dark:text-yellow-200">
          <div className="font-medium">
            {!isOnline ? 'You\'re offline' : 'Connecting...'}
          </div>
          <div className="text-sm opacity-90 mt-1">
            {!isOnline 
              ? 'Changes will be saved locally and sync when you\'re back online.'
              : 'Trying to reconnect to the server...'
            }
          </div>
        </AlertDescription>
      </div>
    </Alert>
  );
};

export default OfflineStatusBanner;