import React, { useState, useEffect } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { useAppLogo } from '@/hooks/useAppLogo';
import { Button } from '@/components/ui/button';

export const LoadingSpinner = ({
  fullScreen = true,
  text = "Loading...",
  subText,
  showLogo = true
}: {
  fullScreen?: boolean;
  text?: string;
  subText?: string;
  showLogo?: boolean;
}) => {
  const { appLogo } = useAppLogo();
  const [dots, setDots] = useState('');
  const [showTimeout, setShowTimeout] = useState(false);

  // Animate the dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);

    return () => clearInterval(interval);
  }, []);

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
    <div className="space-y-4 text-center">
      {showLogo && appLogo && (
        <img 
          src={appLogo} 
          alt="App Logo" 
          className="w-12 h-12 object-contain rounded-lg mx-auto"
        />
      )}
      
      {showLogo && !appLogo && (
        <div className="w-12 h-12 bg-primary/10 rounded-lg mx-auto flex items-center justify-center">
          <span className="text-primary font-bold text-xl">F</span>
        </div>
      )}
      
      <div className="flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
      
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">
          {text}{dots}
        </p>
        {subText && (
          <p className="text-xs text-muted-foreground">
            {subText}
          </p>
        )}
      </div>

      {showTimeout && (
        <div className="space-y-3 pt-4 border-t">
          <p className="text-xs text-muted-foreground">
            Taking longer than expected?
          </p>
          <Button 
            onClick={handleRetry} 
            variant="outline" 
            size="sm"
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
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