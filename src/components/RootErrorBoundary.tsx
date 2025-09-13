import React from 'react';

type Props = { children: React.ReactNode };
type State = { hasError: boolean };

export class RootErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };
  
  static getDerivedStateFromError() { 
    return { hasError: true }; 
  }
  
  componentDidCatch(error: any, info: any) {
    console.error('[ErrorBoundary]', error?.message || error, info?.componentStack);
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 16, color: '#fff', background: '#111', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <h2>Something went wrong.</h2>
          <p>Please restart the app.</p>
          <button 
            onClick={() => window.location.reload()} 
            style={{ marginTop: 16, padding: '8px 16px', background: '#333', color: '#fff', border: 'none', borderRadius: 4 }}
          >
            Restart App
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}