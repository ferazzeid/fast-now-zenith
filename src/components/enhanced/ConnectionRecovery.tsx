import { useConnectionStore } from '@/stores/connectionStore';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { WifiOff, RefreshCw, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export const EnhancedConnectionStatus = () => {
  const { isOnline, isConnected, retryCount, queue, forceRetry } = useConnectionStore();
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

  // Show prominent alert only for prolonged outages (>5 minutes)
  const isProlongedOutage = prolongedOutageStart && (Date.now() - prolongedOutageStart) > 5 * 60 * 1000;

  if (isProlongedOutage && (!isOnline || !isConnected)) {
    return (
      <Alert className="fixed top-24 left-4 right-4 max-w-sm mx-auto z-50 border-orange-200 bg-orange-100/90 dark:border-orange-800 dark:bg-orange-900/90 backdrop-blur-sm">
        <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
        <AlertDescription className="text-orange-800 dark:text-orange-200">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="font-medium">{!isOnline ? 'Extended Offline Period' : 'Connection Issues'}</div>
              <div className="text-sm opacity-90 mt-1">
                {!isOnline 
                  ? 'Working offline for over 5 minutes. Changes will sync when connected.'
                  : 'Unable to connect for over 5 minutes. Trying automatically every few minutes.'
                }
              </div>
            </div>
            {isOnline && (
              <Button 
                onClick={forceRetry} 
                size="sm" 
                variant="outline"
                className="ml-3"
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                Retry
              </Button>
            )}
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  // No persistent UI for brief issues - handled by toasts and navigation dot
  return null;
};

// Offline indicator for specific components
export const OfflineIndicator = ({ 
  className,
  showText = true 
}: {
  className?: string;
  showText?: boolean;
}) => {
  const { isOnline, isConnected } = useConnectionStore();
  
  if (isOnline && isConnected) return null;

  return (
    <div className={cn(
      "flex items-center gap-2 text-muted-foreground text-xs",
      className
    )}>
      <WifiOff className="w-3 h-3" />
      {showText && (
        <span>
          {!isOnline ? 'Offline' : 'Connection lost'}
        </span>
      )}
    </div>
  );
};

// Enhanced retry mechanism for failed operations
export const RetryableAction = ({ 
  children, 
  onRetry,
  maxRetries = 3,
  retryCount = 0,
  error
}: {
  children: React.ReactNode;
  onRetry: () => void;
  maxRetries?: number;
  retryCount?: number;
  error?: Error | null;
}) => {
  const { isConnected, isOnline } = useConnectionStore();
  
  if (!error) return <>{children}</>;

  const canRetry = retryCount < maxRetries && isOnline && isConnected;

  return (
    <Card className="border-destructive/20 bg-destructive/5">
      <CardContent className="p-4 text-center space-y-3">
        <AlertTriangle className="w-6 h-6 text-destructive mx-auto" />
        <div>
          <p className="text-sm text-muted-foreground">
            Action failed{retryCount > 0 && ` (attempt ${retryCount + 1})`}
          </p>
          {!isOnline && (
            <p className="text-xs text-muted-foreground mt-1">
              Check your internet connection
            </p>
          )}
        </div>
        {canRetry && (
          <Button onClick={onRetry} size="sm" variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        )}
      </CardContent>
    </Card>
  );
};