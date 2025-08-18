import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Static loading fallback that works without any dynamic dependencies
 * Uses only CSS variables and static styling for maximum reliability
 */
export const StaticLoadingFallback = ({ 
  message = "Loading...",
  error,
  onRetry 
}: {
  message?: string;
  error?: string;
  onRetry?: () => void;
}) => {
  if (error) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6 text-center">
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto bg-destructive/10 rounded-full flex items-center justify-center">
              <div className="w-8 h-8 text-destructive">⚠</div>
            </div>
            
            <div className="space-y-2">
              <h2 className="text-lg font-semibold">Startup Error</h2>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>

            <div className="flex flex-col gap-2">
              {onRetry && (
                <Button onClick={onRetry} variant="default" className="w-full">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
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
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 text-center">
        {/* Simple loading spinner using CSS */}
        <div className="space-y-4">
          <div className="relative w-16 h-16 mx-auto">
            <div 
              className="absolute inset-0 border-4 rounded-full border-primary/20"
            ></div>
            <div 
              className="absolute inset-0 border-4 border-transparent border-t-primary rounded-full animate-spin"
            ></div>
            <div 
              className="absolute inset-2 border-2 border-primary/30 rounded-full"
            ></div>
          </div>
          
          <div className="space-y-2">
            <p className="text-lg font-medium text-foreground">{message}</p>
            <p className="text-sm text-muted-foreground">Please wait...</p>
          </div>
          
          {/* Progress dots */}
          <div className="flex justify-center space-x-1">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
            <div 
              className="w-2 h-2 bg-primary rounded-full animate-pulse" 
              style={{animationDelay: '0.2s'}}
            ></div>
            <div 
              className="w-2 h-2 bg-primary rounded-full animate-pulse" 
              style={{animationDelay: '0.4s'}}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};