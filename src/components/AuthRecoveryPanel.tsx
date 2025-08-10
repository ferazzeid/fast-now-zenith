import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, Trash2, ExternalLink, AlertTriangle } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useConnectionStore } from '@/stores/connectionStore';
import { clearAuthData, isStuckInAuthLoop } from '@/utils/authCleanup';
import { useToast } from '@/hooks/use-toast';

export const AuthRecoveryPanel = () => {
  const [isClearing, setIsClearing] = useState(false);
  const { reset, loading, initialized, user } = useAuthStore();
  const { forceRetry, isConnected } = useConnectionStore();
  const { toast } = useToast();

  const handleClearAuthData = async () => {
    setIsClearing(true);
    try {
      const success = clearAuthData();
      if (success) {
        reset();
        toast({
          title: "Auth Data Cleared",
          description: "All authentication data has been cleared. The app will reload.",
          duration: 3000,
        });
        
        // Reload the page after a short delay
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    } catch (error) {
      toast({
        title: "Clear Failed",
        description: "Failed to clear auth data. Please try refreshing the page.",
        variant: "destructive",
      });
    } finally {
      setIsClearing(false);
    }
  };

  const handleForceRefresh = () => {
    toast({
      title: "Refreshing App",
      description: "Forcing a complete app refresh...",
    });
    window.location.reload();
  };

  const handleRetryConnection = async () => {
    toast({
      title: "Retrying Connection",
      description: "Attempting to reconnect...",
    });
    await forceRetry();
  };

  const isStuck = isStuckInAuthLoop();
  const showPanel = isStuck || loading || !initialized || !isConnected;

  // Only show for development or when there are actual issues
  if (!showPanel && user && isConnected) {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 max-w-sm mx-auto">
      <Card className="border-orange-200 bg-orange-50/95 dark:border-orange-800 dark:bg-orange-950/95 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            Connection Issues?
          </CardTitle>
          <CardDescription className="text-xs">
            If you're experiencing loading issues or stuck screens, try these recovery options:
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRetryConnection}
              disabled={!isConnected}
              className="text-xs"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleForceRefresh}
              className="text-xs"
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Refresh
            </Button>
          </div>
          
          {(isStuck || (!initialized && loading)) && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleClearAuthData}
              disabled={isClearing}
              className="w-full text-xs"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              {isClearing ? 'Clearing...' : 'Clear Auth Data'}
            </Button>
          )}
          
          <div className="text-xs text-muted-foreground">
            Status: {!isConnected ? 'Disconnected' : loading ? 'Loading' : !initialized ? 'Initializing' : 'Ready'}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};