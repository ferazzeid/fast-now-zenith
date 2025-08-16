import React, { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RefreshCw, AlertTriangle, Home } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  level?: 'page' | 'component' | 'critical';
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  autoRetry?: boolean;
  maxRetries?: number;
}

interface State {
  hasError: boolean;
  error: Error | null;
  retryCount: number;
  autoRetrying: boolean;
}

class ComprehensiveErrorBoundary extends Component<Props, State> {
  private retryTimeout: NodeJS.Timeout | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      retryCount: 0,
      autoRetrying: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ComprehensiveErrorBoundary caught an error:', error, errorInfo);
    
    this.props.onError?.(error, errorInfo);
    
    // Auto-retry for component-level errors
    if (this.props.autoRetry && this.props.level === 'component' && this.state.retryCount < (this.props.maxRetries || 2)) {
      this.setState({ autoRetrying: true });
      this.retryTimeout = setTimeout(() => {
        this.handleRetry();
      }, 2000);
    }
  }

  componentWillUnmount() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
  }

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      retryCount: prevState.retryCount + 1,
      autoRetrying: false,
    }));
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { level = 'component' } = this.props;
      const { autoRetrying, retryCount } = this.state;

      if (autoRetrying) {
        return (
          <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center gap-2 text-amber-700 dark:text-amber-300">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span className="text-sm">Recovering automatically...</span>
              </div>
            </CardContent>
          </Card>
        );
      }

      if (level === 'critical') {
        return (
          <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <Card className="max-w-md w-full border-destructive/20">
              <CardContent className="p-6 text-center space-y-4">
                <AlertTriangle className="w-12 h-12 text-destructive mx-auto" />
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Critical Error</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    The application encountered a critical error and needs to be restarted.
                  </p>
                </div>
                <div className="space-y-2">
                  <Button onClick={this.handleRetry} className="w-full">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Restart Application
                  </Button>
                  <Button variant="outline" onClick={this.handleGoHome} className="w-full">
                    <Home className="w-4 h-4 mr-2" />
                    Go to Home
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      }

      if (level === 'page') {
        return (
          <div className="min-h-[50vh] flex items-center justify-center p-4">
            <Card className="max-w-sm w-full">
              <CardContent className="p-6 text-center space-y-4">
                <AlertTriangle className="w-8 h-8 text-muted-foreground mx-auto" />
                <div>
                  <h3 className="font-medium text-foreground">Page Error</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    This page couldn't load properly.
                  </p>
                </div>
                <div className="space-y-2">
                  <Button onClick={this.handleRetry} size="sm" className="w-full">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again
                  </Button>
                  <Button variant="outline" onClick={this.handleGoHome} size="sm" className="w-full">
                    <Home className="w-4 h-4 mr-2" />
                    Go Home
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      }

      // Component level
      return (
        <Card className="border-muted bg-muted/5">
          <CardContent className="p-4 text-center space-y-3">
            <AlertTriangle className="w-6 h-6 text-muted-foreground mx-auto" />
            <div>
              <p className="text-sm text-muted-foreground">
                Something went wrong with this component.
              </p>
              {retryCount < (this.props.maxRetries || 2) && (
                <p className="text-xs text-muted-foreground mt-1">
                  Attempt {retryCount + 1} of {(this.props.maxRetries || 2) + 1}
                </p>
              )}
            </div>
            <Button onClick={this.handleRetry} size="sm" variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

// Convenience wrappers
export const CriticalErrorBoundary = ({ children, onError }: { children: ReactNode; onError?: (error: Error, errorInfo: React.ErrorInfo) => void }) => (
  <ComprehensiveErrorBoundary level="critical" onError={onError}>
    {children}
  </ComprehensiveErrorBoundary>
);

export const PageErrorBoundary = ({ children, onError }: { children: ReactNode; onError?: (error: Error, errorInfo: React.ErrorInfo) => void }) => (
  <ComprehensiveErrorBoundary level="page" onError={onError}>
    {children}
  </ComprehensiveErrorBoundary>
);

export const ComponentErrorBoundary = ({ children, onError, autoRetry = true }: { children: ReactNode; onError?: (error: Error, errorInfo: React.ErrorInfo) => void; autoRetry?: boolean }) => (
  <ComprehensiveErrorBoundary level="component" autoRetry={autoRetry} onError={onError}>
    {children}
  </ComprehensiveErrorBoundary>
);

export { ComprehensiveErrorBoundary };