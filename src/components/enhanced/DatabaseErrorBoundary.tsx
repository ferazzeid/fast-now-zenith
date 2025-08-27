import React, { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface DatabaseErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onRetry?: () => void;
}

interface DatabaseErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  retryCount: number;
}

export class DatabaseErrorBoundary extends Component<DatabaseErrorBoundaryProps, DatabaseErrorBoundaryState> {
  constructor(props: DatabaseErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, retryCount: 0 };
  }

  static getDerivedStateFromError(error: Error): DatabaseErrorBoundaryState {
    return { hasError: true, error, retryCount: 0 };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('DatabaseErrorBoundary caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: undefined,
      retryCount: prevState.retryCount + 1
    }));
    
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center p-8 space-y-4 bg-background text-foreground">
          <AlertCircle className="w-12 h-12 text-destructive" />
          <h2 className="text-xl font-semibold">Database Connection Issue</h2>
          <p className="text-center text-muted-foreground max-w-md">
            There was a problem connecting to the database. This often happens during sign-in. 
            Please try again.
          </p>
          {this.state.retryCount < 3 && (
            <Button onClick={this.handleRetry} variant="outline" className="mt-4">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          )}
          {this.state.retryCount >= 3 && (
            <Button onClick={() => window.location.reload()} variant="default" className="mt-4">
              <RefreshCw className="w-4 h-4 mr-2" />
              Reload Page
            </Button>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}