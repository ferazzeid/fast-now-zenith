import { createRoot } from 'react-dom/client';
import { StrictMode } from 'react';
import App from './App.tsx';
import './index.css';
import { AnimationProvider } from './components/AnimationController';
import { initOfflineStorage } from './utils/offlineStorage';
import { conditionalPWAInit } from './utils/conditionalPWA';
import './debug/prodErrorBridge'; // Import error bridge at startup
import './env'; // Import build info logging
import { RootErrorBoundary } from './components/RootErrorBoundary';

// Production logging guard - reduce noise in prod but keep errors
if (process.env.NODE_ENV === 'production') {
  console.debug = () => {};
  console.info = () => {};
  // Keep console.error and console.warn for debugging critical issues
}

// Initialize offline storage only (no dynamic assets during startup)
initOfflineStorage();

// Initialize PWA features conditionally (web only, never in native)
conditionalPWAInit();

// Simplified App wrapper - no dynamic loading during startup
const SimplifiedApp = () => {
  return <App />;
};

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RootErrorBoundary>
      <AnimationProvider>
        <SimplifiedApp />
      </AnimationProvider>
    </RootErrorBoundary>
  </StrictMode>
);
