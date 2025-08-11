import { useEffect } from 'react';
import { App } from '@capacitor/core';
import { Network } from '@capacitor/core';
import { useOutboxSync } from './useOutboxSync';
import { isOfflineModeEnabled } from './useOfflineMode';

export const useCapacitorLifecycle = () => {
  const { triggerSync } = useOutboxSync();

  useEffect(() => {
    const setupLifecycleListeners = async () => {
      // Only set up listeners if offline mode is enabled
      const offlineEnabled = await isOfflineModeEnabled();
      if (!offlineEnabled) return;

      // Handle app resume - sync when coming back to foreground
      const resumeListener = App.addListener('appStateChange', ({ isActive }) => {
        if (isActive) {
          console.log('App resumed - triggering sync');
          triggerSync();
        }
      });

      // Handle network changes - sync when coming back online
      const networkListener = Network.addListener('networkStatusChange', (status) => {
        if (status.connected) {
          console.log('Network reconnected - triggering sync');
          triggerSync();
        }
      });

      // Handle Android back button behavior
      const backButtonListener = App.addListener('backButton', ({ canGoBack }) => {
        // Let the default browser back behavior handle this for web apps
        // This prevents the app from exiting unexpectedly
        if (canGoBack) {
          window.history.back();
        } else {
          // If we're at the root and user presses back, don't exit
          // This provides more predictable behavior
          console.log('Back button pressed at root - ignoring');
        }
      });

      return () => {
        resumeListener.remove();
        networkListener.remove();
        backButtonListener.remove();
      };
    };

    setupLifecycleListeners();
  }, [triggerSync]);
};