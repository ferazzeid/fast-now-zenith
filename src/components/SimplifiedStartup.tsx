import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export type StartupState = 'loading' | 'auth' | 'profile' | 'ready' | 'error';

interface SimplifiedStartupProps {
  children: React.ReactNode;
  state: StartupState;
  error?: string;
  isOnline?: boolean;
  onRetry?: () => void;
  onForceRefresh?: () => void;
}

export const SimplifiedStartup = ({ 
  children, 
  state, 
  error, 
  isOnline = true,
  onRetry,
  onForceRefresh 
}: SimplifiedStartupProps) => {
  const [timeoutReached, setTimeoutReached] = useState(false);

  useEffect(() => {
    if (state === 'loading' || state === 'auth' || state === 'profile') {
      const timer = setTimeout(() => {
        setTimeoutReached(true);
      }, 8000); // 8 second timeout

      return () => clearTimeout(timer);
    }
  }, [state]);

  // Clear timeout when state changes to ready or error
  useEffect(() => {
    if (state === 'ready' || state === 'error') {
      setTimeoutReached(false);
    }
  }, [state]);

  const getLoadingMessage = () => {
    switch (state) {
      case 'auth':
        return 'Checking authentication...';
      case 'profile':
        return 'Loading profile...';
      case 'loading':
      default:
        return 'Starting app...';
    }
  };

  const showTimeoutActions = timeoutReached && (state === 'loading' || state === 'auth' || state === 'profile');

  if (state === 'ready') {
    return <>{children}</>;
  }

  if (state === 'error' || showTimeoutActions) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6 text-center">
          <div className="space-y-4">
            {/* Connection indicator */}
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              {isOnline ? (
                <>
                  <Wifi className="w-4 h-4" />
                  <span>Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4" />
                  <span>Offline</span>
                </>
              )}
            </div>

            {/* Error icon */}
            <div className="w-16 h-16 mx-auto bg-destructive/10 rounded-full flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>

            {/* Error message */}
            <div className="space-y-2">
              <h2 className="text-lg font-semibold">
                {state === 'error' ? 'Startup Error' : 'Taking Too Long'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {error || (showTimeoutActions 
                  ? `App is stuck ${getLoadingMessage().toLowerCase()}`
                  : 'Something went wrong during startup'
                )}
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-2">
              {onRetry && (
                <Button onClick={onRetry} variant="default" className="w-full">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
              )}
              
              {onForceRefresh && (
                <Button onClick={onForceRefresh} variant="outline" className="w-full">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Force Refresh
                </Button>
              )}

              <Button 
                onClick={() => window.location.reload()} 
                variant="outline" 
                className="w-full"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reload Page
              </Button>
            </div>

            {/* Debug info for non-production */}
            {process.env.NODE_ENV !== 'production' && (
              <div className="text-xs text-muted-foreground border rounded p-2 bg-muted/50">
                <div>State: {state}</div>
                <div>Online: {isOnline ? 'Yes' : 'No'}</div>
                <div>Timeout: {timeoutReached ? 'Yes' : 'No'}</div>
                {error && <div>Error: {error}</div>}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Normal loading state
  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 text-center">
        {/* Connection indicator */}
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          {isOnline ? (
            <>
              <Wifi className="w-4 h-4" />
              <span>Online</span>
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4" />
              <span>Offline</span>
            </>
          )}
        </div>

        {/* Loading spinner */}
        <div className="space-y-4">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-transparent border-t-primary rounded-full animate-spin"></div>
            <div className="absolute inset-2 border-2 border-primary/30 rounded-full"></div>
          </div>
          
          {/* Loading text */}
          <div className="space-y-2">
            <p className="text-lg font-medium text-foreground">{getLoadingMessage()}</p>
            <p className="text-sm text-muted-foreground">Please wait...</p>
          </div>
          
          {/* Progress dots */}
          <div className="flex justify-center space-x-1">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
          </div>
        </div>
      </div>
    </div>
  );
};