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
      console.error('Unhandled promise rejection:', event.reason);
      
      const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
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
      console.error('Global error:', event.error);
      
      const error = event.error instanceof Error ? event.error : new Error(String(event.error));
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