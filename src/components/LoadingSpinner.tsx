import React, { useState, useEffect } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const LoadingSpinner = ({
  fullScreen = true,
  text = "Loading...",
  subText
}: {
  fullScreen?: boolean;
  text?: string;
  subText?: string;
}) => {
  const [showTimeout, setShowTimeout] = useState(false);

  // Show timeout after 15 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowTimeout(true);
    }, 15000);

    return () => clearTimeout(timer);
  }, []);

  const handleRetry = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.reload();
  };

  const content = (
    <div className="space-y-6 text-center">
      <div className="flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
      
      <div className="space-y-2">
        <p className="text-lg font-medium text-foreground">
          {text}
        </p>
        {subText && (
          <p className="text-sm text-muted-foreground">
            {subText}
          </p>
        )}
      </div>

      {showTimeout && (
        <div className="space-y-3 pt-6 border-t border-border">
          <p className="text-sm text-muted-foreground">
            Taking longer than expected?
          </p>
          <Button 
            onClick={handleRetry} 
            variant="outline" 
            size="sm"
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Retry Connection
          </Button>
        </div>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        {content}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-8">
      {content}
    </div>
  );
};