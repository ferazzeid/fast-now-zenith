import { useConnectionStore } from '@/stores/connectionStore';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { WifiOff, Wifi, RefreshCw } from 'lucide-react';

export const ConnectionStatus = () => {
  const { isOnline, isConnected, retryCount, queue, forceRetry } = useConnectionStore();
  const hasQueuedOperations = queue.length > 0;

  // Don't show anything if everything is working fine
  if (isOnline && isConnected && !hasQueuedOperations) {
    return null;
  }

  if (!isOnline) {
    return (
      <Alert className="border-destructive bg-destructive/10 fixed top-24 left-4 right-4 mx-auto max-w-sm z-50">
        <WifiOff className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>You're offline. Changes will sync when connection is restored.</span>
        </AlertDescription>
      </Alert>
    );
  }

  if (!isConnected) {
    return (
      <Alert className="border-warning bg-warning/10 fixed top-24 left-4 right-4 mx-auto max-w-sm z-50">
        <WifiOff className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <div>
            <span>Connection lost. {retryCount > 0 && `Retried ${retryCount} times.`}</span>
            {hasQueuedOperations && (
              <div className="text-sm text-muted-foreground mt-1">
                {queue.length} operations queued for retry
              </div>
            )}
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={forceRetry}
            className="ml-2"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (hasQueuedOperations) {
    return (
      <Alert className="border-info bg-info/10 fixed top-24 left-4 right-4 mx-auto max-w-sm z-50">
        <Wifi className="h-4 w-4" />
        <AlertDescription>
          Processing {queue.length} queued operation{queue.length !== 1 ? 's' : ''}...
        </AlertDescription>
      </Alert>
    );
  }

  return null;
};