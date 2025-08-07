import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { AnimationProvider } from './components/AnimationController'
import { initOfflineStorage } from './utils/offlineStorage'
import { useDynamicFavicon } from './hooks/useDynamicFavicon'
import { RoleTestingProvider } from './contexts/RoleTestingContext'

// Production logging guard - reduce noise in prod
if (process.env.NODE_ENV === 'production') {
  console.debug = () => {};
  console.info = () => {};
}
// Initialize offline storage and cleanup
initOfflineStorage();
const AppWithFavicon = () => {
  useDynamicFavicon();
  return <App />;
};

createRoot(document.getElementById("root")!).render(
  <RoleTestingProvider>
    <AnimationProvider>
      <AppWithFavicon />
    </AnimationProvider>
  </RoleTestingProvider>
);
