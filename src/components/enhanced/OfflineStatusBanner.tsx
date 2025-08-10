import { useConnectionStore } from '@/stores/connectionStore';
import { WifiOff, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

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
    <div className="fixed top-2 left-2 z-50 pointer-events-none">
      <div className={cn(
        "flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium",
        "bg-yellow-100/95 dark:bg-yellow-900/95 backdrop-blur-sm",
        "border border-yellow-200 dark:border-yellow-800",
        "text-yellow-800 dark:text-yellow-200",
        "shadow-sm transition-all duration-300"
      )}>
        {!isOnline ? (
          <WifiOff className="h-3 w-3" />
        ) : (
          <Loader2 className="h-3 w-3 animate-spin" />
        )}
        <span className="whitespace-nowrap">
          {!isOnline ? 'Offline' : 'Connecting...'}
        </span>
      </div>
    </div>
  );
};

export default OfflineStatusBanner;