import { useConnectionStore } from '@/stores/connectionStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { WifiOff, RefreshCw, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

// EnhancedConnectionStatus removed - using only Navigation dot for connection status

export const OfflineIndicator = ({ 
  className,
  showText = true 
}: {
  className?: string;
  showText?: boolean;
}) => {
  const { isOnline } = useConnectionStore();
  
  if (isOnline) return null;

  return (
    <div className={cn(
      "flex items-center gap-2 text-muted-foreground text-xs",
      className
    )}>
      <WifiOff className="w-3 h-3" />
      {showText && (
        <span>Offline</span>
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
  const { isOnline } = useConnectionStore();
  
  if (!error) return <>{children}</>;

  const canRetry = retryCount < maxRetries && isOnline;

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