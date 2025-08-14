import { WifiOff, RefreshCw, Settings, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useConnectionStore } from '@/stores/connectionStore';
import { useOutboxSync } from '@/hooks/useOutboxSync';
import { cn } from '@/lib/utils';

export const OfflineScreen = ({ 
  showFullScreen = false,
  className 
}: { 
  showFullScreen?: boolean;
  className?: string;
}) => {
  const { isOnline, testConnection } = useConnectionStore();
  const { pending } = useOutboxSync();

  if (isOnline) return null;

  if (showFullScreen) {
    return (
      <div className="fixed inset-0 bg-background/95 backdrop-blur z-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <WifiOff className="w-8 h-8 text-muted-foreground" />
            </div>
            <CardTitle>You're Offline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-muted-foreground">
              Check your internet connection to sync your latest changes.
            </p>
            
            {pending > 0 && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>{pending} change(s) waiting to sync</span>
              </div>
            )}

            <div className="space-y-2">
              <Button onClick={testConnection} className="w-full">
                <RefreshCw className="w-4 h-4 mr-2" />
                Check Connection
              </Button>
              
              <p className="text-xs text-muted-foreground">
                Your timers and data are saved locally and will sync when you're back online.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <Card className={cn("border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950", className)}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <WifiOff className="w-5 h-5 text-orange-600 dark:text-orange-400" />
          <div className="flex-1">
            <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
              Limited connectivity
            </p>
            <p className="text-xs text-orange-600 dark:text-orange-400">
              Some features may be unavailable
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={testConnection}>
            <RefreshCw className="w-3 h-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};