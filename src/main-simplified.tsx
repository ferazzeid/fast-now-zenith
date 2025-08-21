import { createRoot } from 'react-dom/client';
import { StrictMode } from 'react';
import App from './App.tsx';
import './index.css';
import { AnimationProvider } from './components/AnimationController';
import { initOfflineStorage } from './utils/offlineStorage';

// Production logging guard - reduce noise in prod but keep errors
if (process.env.NODE_ENV === 'production') {
  console.debug = () => {};
  console.info = () => {};
  // Keep console.error and console.warn for debugging critical issues
}

// Initialize offline storage only (no dynamic assets)
initOfflineStorage();

// Simplified App wrapper - no dynamic loading during startup  
const SimplifiedApp = () => {
  return <App />;
};

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AnimationProvider>
      <SimplifiedApp />
    </AnimationProvider>
  </StrictMode>
);