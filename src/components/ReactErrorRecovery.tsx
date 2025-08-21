import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  retryCount: number;
}

/**
 * Enhanced error boundary for React #300 hook consistency errors
 * Attempts automatic recovery before showing fallback UI
 */
export class ReactErrorRecovery extends Component<Props, State> {
  private retryTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, retryCount: 0 };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Check if this is a React hooks error (Error #300)
    if (error.message.includes('Rendered fewer hooks') || 
        error.message.includes('hook calls') ||
        error.message.includes('Hook call')) {
      console.error('🚨 React #300 hook consistency error detected:', error.message);
      return { hasError: true, error };
    }
    
    // Let other errors bubble up
    throw error;
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ReactErrorRecovery caught React #300 error:', error, errorInfo);
    
    // In development, provide helpful debugging info
    if (process.env.NODE_ENV === 'development') {
      console.group('🔧 React #300 Error Debug Info');
      console.log('Error:', error.message);
      console.log('Component Stack:', errorInfo.componentStack);
      console.log('Retry Count:', this.state.retryCount);
      console.log('Possible causes:');
      console.log('- Conditional hook calls (hooks inside if statements)');
      console.log('- Early return statements before all hooks are called');
      console.log('- Auth state changes causing different hook execution paths');
      console.log('- Query functions with conditional returns');
      console.groupEnd();
    }

    // Attempt automatic recovery for React #300 errors (up to 3 times)
    if (this.state.retryCount < 3 && 
        (error.message.includes('Rendered fewer hooks') || 
         error.message.includes('hook calls'))) {
      
      console.log(`🔄 Attempting automatic recovery (attempt ${this.state.retryCount + 1}/3)`);
      
      this.retryTimeoutId = setTimeout(() => {
        this.setState(prevState => ({
          hasError: false,
          error: undefined,
          retryCount: prevState.retryCount + 1
        }));
      }, 1000); // Wait 1 second before retry
    }
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <div className="max-w-md w-full text-center">
            <h2 className="text-xl font-semibold mb-4 text-destructive">
              App Recovery in Progress
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              The app is automatically recovering from a rendering issue...
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              Retry attempt: {this.state.retryCount}/3
            </p>
            {this.state.retryCount >= 3 && (
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                Refresh App
              </button>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}