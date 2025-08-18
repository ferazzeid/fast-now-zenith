import { createRoot } from 'react-dom/client';
import { StrictMode } from 'react';
import App from './App.tsx';
import './index.css';
import { AnimationProvider } from './components/AnimationController';
import { initOfflineStorage } from './utils/offlineStorage';
import { useNativeApp } from './hooks/useNativeApp';
import { conditionalPWAInit } from './utils/conditionalPWA';

// Production logging guard - reduce noise in prod
if (process.env.NODE_ENV === 'production') {
  console.debug = () => {};
  console.info = () => {};
}

// Initialize offline storage only (no dynamic assets during startup)
initOfflineStorage();

// Initialize PWA features conditionally (web only)
conditionalPWAInit();

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
    <AnimationProvider>
      <SimplifiedApp />
    </AnimationProvider>
  </StrictMode>
);
