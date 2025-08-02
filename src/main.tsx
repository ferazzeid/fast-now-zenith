import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { AnimationProvider } from './components/AnimationController'
import { initOfflineStorage } from './utils/offlineStorage'

// Initialize offline storage and cleanup
initOfflineStorage();

createRoot(document.getElementById("root")!).render(
  <AnimationProvider>
    <App />
  </AnimationProvider>
);
