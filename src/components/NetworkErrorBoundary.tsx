import React, { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Wifi } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  isNetworkError: boolean;
  errorInfo: string;
}

export class NetworkErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, isNetworkError: false, errorInfo: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    const isNetworkError = 
      error.message.includes('fetch') ||
      error.message.includes('network') ||
      error.message.includes('offline') ||
      error.name === 'TypeError' && error.message.includes('Failed to fetch');

    return {
      hasError: true,
      isNetworkError,
      errorInfo: error.message
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Network Error Boundary caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, isNetworkError: false, errorInfo: '' });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex items-center justify-center min-h-[200px] p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-3">
                {this.state.isNetworkError ? (
                  <Wifi className="w-6 h-6 text-destructive" />
                ) : (
                  <AlertTriangle className="w-6 h-6 text-destructive" />
                )}
              </div>
              <CardTitle className="text-lg">
                {this.state.isNetworkError ? 'Connection Problem' : 'Something went wrong'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              <p className="text-sm text-muted-foreground">
                {this.state.isNetworkError
                  ? 'Unable to connect to our servers. Please check your internet connection.'
                  : 'An unexpected error occurred. Please try again.'
                }
              </p>
              
              <Button onClick={this.handleRetry} className="w-full">
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              
              {this.state.isNetworkError && (
                <p className="text-xs text-muted-foreground">
                  Your data is saved locally and will sync when you're back online.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}