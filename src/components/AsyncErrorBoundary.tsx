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
    const handleUnhandledRejection = async (event: PromiseRejectionEvent) => {
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
      
      // Handle IndexedDB VersionError automatically
      if (event.reason?.name === 'VersionError' || reason.includes('VersionError')) {
        console.log('VersionError detected - clearing IndexedDB');
        
        try {
          // Clear IndexedDB databases
          if ('indexedDB' in window) {
            const databases = await indexedDB.databases();
            await Promise.all(
              databases.map(db => {
                if (db.name) {
                  return new Promise<void>((resolve, reject) => {
                    const deleteReq = indexedDB.deleteDatabase(db.name!);
                    deleteReq.onsuccess = () => resolve();
                    deleteReq.onerror = () => reject(deleteReq.error);
                  });
                }
              })
            );
          }
          
          toast({
            title: "Database updated",
            description: "Fixed version conflict. Please refresh the page.",
          });
          
          // Auto-refresh after a short delay
          setTimeout(() => {
            location.reload();
          }, 2000);
          
        } catch (clearError) {
          console.error('Failed to clear IndexedDB:', clearError);
          toast({
            title: "Database issue detected",
            description: "Please clear your browser cache or try refreshing.",
            variant: "destructive",
          });
        }
        
        event.preventDefault();
        return;
      }
      
      console.error('Unhandled promise rejection:', event.reason);
      
      const error = event.reason instanceof Error ? event.reason : new Error(reason);
      setError(error);
      onError?.(error);
      
      // Show user-friendly toast with more details for debugging
      toast({
        title: "Something went wrong",
        description: `Error: ${reason}`,
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