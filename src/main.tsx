import { createRoot } from 'react-dom/client';
import { StrictMode } from 'react';
import App from './App.tsx';
import './index.css';
import { AnimationProvider } from './components/AnimationController';
import { initOfflineStorage } from './utils/offlineStorage';
import { useNativeApp } from './hooks/useNativeApp';
import { conditionalPWAInit } from './utils/conditionalPWA';
import './debug/prodErrorBridge'; // Import error bridge at startup
import './env'; // Import build info logging
import { RootErrorBoundary } from './components/RootErrorBoundary';

// Production logging guard - reduce noise in prod
if (process.env.NODE_ENV === 'production') {
  console.debug = () => {};
  console.info = () => {};
}

// Initialize offline storage only (no dynamic assets during startup)
initOfflineStorage();

// Initialize PWA features conditionally (web only, never in native)
if (typeof window !== 'undefined' && !(window as any).Capacitor) {
  conditionalPWAInit();
}

// Simplified App wrapper - no dynamic loading during startup
const SimplifiedApp = () => {
  const { isNativeApp } = useNativeApp();
  
  // For native apps, apply minimal styling immediately
  if (isNativeApp && typeof window !== 'undefined') {
    document.body.classList.add('native-app');
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
  }
  
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
