import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Error boundary specifically for catching React hook errors
 * Replaces the debugging system with proper error handling
 */
export class HookConsistencyBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Check if this is a React hooks error (Error #300)
    if (error.message.includes('Rendered fewer hooks') || 
        error.message.includes('hook calls') ||
        error.message.includes('Hook call')) {
      console.error('🚨 React hooks consistency error detected:', error.message);
      return { hasError: true, error };
    }
    
    // Let other errors bubble up
    throw error;
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('HookConsistencyBoundary caught error:', error, errorInfo);
    
    // In development, provide helpful debugging info
    if (process.env.NODE_ENV === 'development') {
      console.group('🔧 Hook Consistency Error Debug Info');
      console.log('Error:', error.message);
      console.log('Component Stack:', errorInfo.componentStack);
      console.log('Possible causes:');
      console.log('- Early return statements before all hooks are called');
      console.log('- Conditional hook calls (hooks inside if statements)');
      console.log('- Components that skip hook calls during certain renders');
      console.groupEnd();
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <div className="max-w-md w-full text-center">
            <h2 className="text-xl font-semibold mb-4 text-destructive">
              App Rendering Error
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              The app encountered a rendering issue. Please refresh to continue.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Refresh App
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}