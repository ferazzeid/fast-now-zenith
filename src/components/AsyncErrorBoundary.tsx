import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface AsyncErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error) => void;
}

export const AsyncErrorBoundary = ({ children, fallback, onError }: AsyncErrorBoundaryProps) => {
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Handle unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = String(event.reason);
      
      // Ignore browser extension errors that aren't from our app
      if (reason.includes('Extension context invalidated') ||
          reason.includes('chrome-extension://') ||
          reason.includes('moz-extension://') ||
          reason.includes('safari-extension://') ||
          reason.includes('MetaMask') ||
          reason.includes('connect to MetaMask')) {
        console.log('Ignoring browser extension error:', reason);
        event.preventDefault();
        return;
      }
      
      console.error('Unhandled promise rejection:', event.reason);
      
      const error = event.reason instanceof Error ? event.reason : new Error(reason);
      setError(error);
      onError?.(error);
      
      // Show user-friendly toast
      toast({
        title: "Something went wrong",
        description: "We encountered an unexpected error. Please try again.",
        variant: "destructive",
      });
      
      // Prevent the default behavior
      event.preventDefault();
    };

    // Handle async errors in components
    const handleError = (event: ErrorEvent) => {
      const message = String(event.error?.message || event.message || event.error);
      
      // Ignore browser extension errors
      if (message.includes('Extension context invalidated') ||
          message.includes('chrome-extension://') ||
          message.includes('moz-extension://') ||
          message.includes('safari-extension://')) {
        console.log('Ignoring browser extension error:', message);
        return;
      }
      
      console.error('Global error:', event.error);
      
      const error = event.error instanceof Error ? event.error : new Error(message);
      setError(error);
      onError?.(error);
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, [onError, toast]);

  // Reset error state when children change
  useEffect(() => {
    if (error) {
      setError(null);
    }
  }, [children]);

  if (error) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="bg-muted/50 border border-border rounded-lg p-4 text-center">
        <div className="text-sm text-muted-foreground">
          An error occurred. Please try again.
        </div>
      </div>
    );
  }

  return <>{children}</>;
};