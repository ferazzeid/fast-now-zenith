import React, { Suspense } from 'react';
import { LoadingRecovery } from './LoadingRecovery';
import { useIsMobile } from '@/hooks/use-mobile';

interface AdminLoadingWrapperProps {
  children: React.ReactNode;
  componentName?: string;
}

export const AdminLoadingWrapper = ({ children, componentName = "component" }: AdminLoadingWrapperProps) => {
  const [hasError, setHasError] = React.useState(false);
  const [isTimeout, setIsTimeout] = React.useState(false);
  const isMobile = useIsMobile();
  
  // Mobile gets shorter timeout due to slower connections
  const timeoutDuration = isMobile ? 12000 : 8000;

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsTimeout(true);
    }, timeoutDuration);

    return () => clearTimeout(timer);
  }, [timeoutDuration]);

  const handleRetry = () => {
    setHasError(false);
    setIsTimeout(false);
    window.location.reload();
  };

  if (hasError || isTimeout) {
    return (
      <div className="p-6">
        <LoadingRecovery
          onRetry={handleRetry}
          message={hasError ? `Failed to load ${componentName}` : `Loading ${componentName} is taking longer than expected`}
          showError={hasError}
        />
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center p-6 min-h-[200px]">
          <div className="space-y-4 text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto animate-spin" />
            <p className="text-sm text-muted-foreground">Loading {componentName}...</p>
            {isMobile && (
              <p className="text-xs text-muted-foreground/70">This may take a moment on mobile</p>
            )}
          </div>
        </div>
      }
    >
      <ErrorBoundary onError={() => setHasError(true)}>
        {children}
      </ErrorBoundary>
    </Suspense>
  );
};

// Simple error boundary for admin components
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; onError: () => void },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; onError: () => void }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Admin component error:', error, errorInfo);
    this.props.onError();
  }

  render() {
    if (this.state.hasError) {
      return null; // Parent will handle the error display
    }

    return this.props.children;
  }
}