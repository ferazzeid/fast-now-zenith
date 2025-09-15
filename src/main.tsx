import { createRoot } from 'react-dom/client';
import { StrictMode } from 'react';
import App from './App.tsx';
import './index.css';

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

// Defer heavy operations to not block initial render - enhanced for mobile
setTimeout(() => {
  // Initialize offline storage immediately for mobile performance
  initOfflineStorage();
  
  // Initialize PWA features conditionally (web only, never in native)
  conditionalPWAInit();
}, 50); // Reduced delay for mobile responsiveness

// Simplified App wrapper - no dynamic loading during startup
const SimplifiedApp = () => {
  return <App />;
};

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RootErrorBoundary>
      <SimplifiedApp />
    </RootErrorBoundary>
  </StrictMode>
);
