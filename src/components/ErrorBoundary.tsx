import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  level?: 'page' | 'component' | 'critical';
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Log error to external service in production
    if (process.env.NODE_ENV === 'production') {
      // Could integrate with Sentry, LogRocket, etc.
      console.error('Production error:', {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack
      });
    }

    this.setState({ errorInfo });
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { level = 'component' } = this.props;
      const { error } = this.state;

      // Page-level error (full screen)
      if (level === 'page') {
        return (
          <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <Card className="w-full max-w-md p-6 text-center space-y-4">
              <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
                <AlertTriangle className="w-8 h-8 text-destructive" />
              </div>
              
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-foreground">Something went wrong</h2>
                <p className="text-sm text-muted-foreground">
                  We encountered an unexpected error. Please try refreshing the page.
                </p>
              </div>

              {process.env.NODE_ENV === 'development' && error && (
                <div className="bg-muted p-3 rounded-lg text-left">
                  <p className="text-xs font-mono text-destructive break-all">
                    {error.message}
                  </p>
                </div>
              )}

              <div className="flex gap-2">
                <Button 
                  onClick={this.handleRetry} 
                  variant="outline" 
                  className="flex-1"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
                <Button 
                  onClick={this.handleGoHome}
                  className="flex-1"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Go Home
                </Button>
              </div>
            </Card>
          </div>
        );
      }

      // Critical error (important components)
      if (level === 'critical') {
        return (
          <Card className="p-4 border-destructive/20 bg-destructive/5">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-medium text-destructive">Critical Error</h3>
                <p className="text-sm text-muted-foreground">
                  This component failed to load. Please refresh the page.
                </p>
              </div>
              <Button size="sm" onClick={this.handleRetry} variant="outline">
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        );
      }

      // Component-level error (graceful degradation)
      return (
        <div className="bg-muted/50 border border-normal rounded-lg p-4 text-center">
          <div className="flex items-center justify-center space-x-2 text-muted-foreground">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm">Component unavailable</span>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={this.handleRetry}
              className="h-6 px-2"
            >
              <RefreshCw className="w-3 h-3" />
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Convenience wrapper components for different use cases
export const PageErrorBoundary = ({ children, onError }: { children: ReactNode; onError?: Props['onError'] }) => (
  <ErrorBoundary level="page" onError={onError}>
    {children}
  </ErrorBoundary>
);

export const ComponentErrorBoundary = ({ children, onError }: { children: ReactNode; onError?: Props['onError'] }) => (
  <ErrorBoundary level="component" onError={onError}>
    {children}
  </ErrorBoundary>
);

export const CriticalErrorBoundary = ({ children, onError }: { children: ReactNode; onError?: Props['onError'] }) => (
  <ErrorBoundary level="critical" onError={onError}>
    {children}
  </ErrorBoundary>
);