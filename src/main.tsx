import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { AnimationProvider } from './components/AnimationController'
import { initOfflineStorage } from './utils/offlineStorage'
import { useDynamicFavicon } from './hooks/useDynamicFavicon'

// Initialize offline storage and cleanup
initOfflineStorage();

const AppWithFavicon = () => {
  useDynamicFavicon();
  return <App />;
};

createRoot(document.getElementById("root")!).render(
  <AnimationProvider>
    <AppWithFavicon />
  </AnimationProvider>
);
