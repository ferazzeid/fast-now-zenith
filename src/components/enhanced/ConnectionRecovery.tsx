import { useEffect, useState } from 'react';
import { useConnectionStore } from '@/stores/connectionStore';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  CheckCircle, 
  Clock,
  AlertTriangle,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export const EnhancedConnectionStatus = () => {
  const { 
    isOnline, 
    isConnected, 
    retryCount, 
    queue, 
    forceRetry,
    checkConnection 
  } = useConnectionStore();
  
  const [lastSuccessfulConnection, setLastSuccessfulConnection] = useState<Date | null>(null);
  const [showSuccessFeedback, setShowSuccessFeedback] = useState(false);
  const { toast } = useToast();

  // Track successful connections
  useEffect(() => {
    if (isConnected && isOnline) {
      setLastSuccessfulConnection(new Date());
      
      // Show success feedback if we just recovered
      if (retryCount > 0) {
        setShowSuccessFeedback(true);
        toast({
          title: "Connection restored",
          description: "You're back online and all queued actions will be processed.",
          variant: "default",
        });
        
        setTimeout(() => setShowSuccessFeedback(false), 5000);
      }
    }
  }, [isConnected, isOnline, retryCount, toast]);

  const hasQueuedOperations = queue.length > 0;
  const connectionIssue = !isOnline || !isConnected;

  // Don't show anything if everything is working fine
  if (!connectionIssue && !hasQueuedOperations && !showSuccessFeedback) {
    return null;
  }

  const handleRetry = async () => {
    try {
      await forceRetry();
    } catch (error) {
      toast({
        title: "Retry failed",
        description: "Unable to reconnect. Please check your internet connection.",
        variant: "destructive",
      });
    }
  };

  // Success feedback
  if (showSuccessFeedback) {
    return (
      <Alert className="mx-4 mt-4 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20">
        <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
        <AlertDescription className="text-green-800 dark:text-green-200">
          Connection restored successfully! All systems are working normally.
        </AlertDescription>
      </Alert>
    );
  }

  // Offline state
  if (!isOnline) {
    return (
      <Alert className="mx-4 mt-4 border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/20">
        <WifiOff className="h-4 w-4 text-orange-600 dark:text-orange-400" />
        <AlertDescription className="text-orange-800 dark:text-orange-200">
          <div className="flex items-center justify-between">
            <span>You're currently offline. Changes will be saved when connection is restored.</span>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  // Disconnected from server
  if (!isConnected) {
    return (
      <Alert className="mx-4 mt-4 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20">
        <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
        <AlertDescription className="text-red-800 dark:text-red-200">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="font-medium">Connection lost</div>
              <div className="text-sm opacity-90 mt-1">
                {retryCount > 0 && `Attempt ${retryCount} failed. `}
                Unable to reach our servers.
              </div>
            </div>
            <Button 
              onClick={handleRetry} 
              size="sm" 
              variant="outline"
              className="ml-3 bg-white dark:bg-gray-800 border-red-300 dark:border-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              Retry
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  // Queued operations
  if (hasQueuedOperations) {
    return (
      <Alert className="mx-4 mt-4 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20">
        <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <AlertDescription className="text-blue-800 dark:text-blue-200">
          <div className="flex items-center justify-between">
            <span>
              {queue.length} action{queue.length !== 1 ? 's' : ''} queued and will be processed shortly.
            </span>
            <div className="flex items-center gap-1 text-xs">
              <Zap className="w-3 h-3" />
              Processing...
            </div>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

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