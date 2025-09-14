// Installation and preloading manager for PWA
// Handles service worker installation progress and data preloading

import { useState, useEffect } from 'react';

interface InstallationProgress {
  stage: 'installing' | 'preloading' | 'complete' | 'error';
  message: string;
  progress: number; // 0-100
}

type InstallationCallback = (progress: InstallationProgress) => void;

class InstallationManager {
  private callbacks: Set<InstallationCallback> = new Set();
  private currentProgress: InstallationProgress = {
    stage: 'installing',
    message: 'Loading app...',
    progress: 0
  };
  private initializationTimeout: NodeJS.Timeout | null = null;

  constructor() {
    this.setupServiceWorkerListeners();
    // Don't start the timeout immediately in constructor, let the setup complete first
  }

  private startInitializationTimeout() {
    // Fallback timeout to prevent infinite loading
    this.initializationTimeout = setTimeout(() => {
      if (this.currentProgress.stage !== 'complete') {
        console.log('Installation timeout reached, marking as complete');
        this.updateProgress({
          stage: 'complete',
          message: 'Ready!',
          progress: 100
        });
      }
    }, 2000); // Reduced to 2 second timeout for faster regular page loads
  }

  private setupServiceWorkerListeners() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'INSTALL_COMPLETE') {
          this.completeInstallation();
        }
      });

      // Check if service worker is already ready
      navigator.serviceWorker.ready.then((registration) => {
        if (registration.active && registration.active.state === 'activated') {
          // Service worker is already active, complete immediately (common case for regular browsing/page reloads)
          this.completeInstallation();
        } else if (registration.installing) {
          // Only show installation screen if actually installing for first time
          const isFirstInstall = !localStorage.getItem('sw-installed');
          if (isFirstInstall) {
            this.startInitializationTimeout();
            this.trackInstallationProgress(registration.installing);
            localStorage.setItem('sw-installed', 'true');
          } else {
            // Already installed before, just complete
            this.completeInstallation();
          }
        } else if (registration.waiting) {
          this.completeInstallation();
        } else {
          // For regular web browsing, complete immediately
          this.completeInstallation();
        }
      }).catch(() => {
        // Service worker not available, complete anyway
        setTimeout(() => this.completeInstallation(), 500);
      });
    } else {
      // No service worker support, complete immediately
      this.completeInstallation();
    }
  }

  private completeInstallation() {
    if (this.initializationTimeout) {
      clearTimeout(this.initializationTimeout);
      this.initializationTimeout = null;
    }
    this.updateProgress({
      stage: 'complete',
      message: 'Ready!',
      progress: 100
    });
  }

  private trackInstallationProgress(worker: ServiceWorker) {
    worker.addEventListener('statechange', () => {
      switch (worker.state) {
        case 'installing':
          this.updateProgress({
            stage: 'installing',
            message: 'Loading app...',
            progress: 25
          });
          break;
        case 'installed':
          this.updateProgress({
            stage: 'preloading',
            message: 'Almost ready...',
            progress: 75
          });
          break;
        case 'activated':
          this.completeInstallation();
          break;
        case 'redundant':
          this.updateProgress({
            stage: 'error',
            message: 'Loading failed. Please refresh.',
            progress: 0
          });
          break;
      }
    });
  }

  private updateProgress(progress: InstallationProgress) {
    this.currentProgress = progress;
    this.callbacks.forEach(callback => callback(progress));
  }

  public onProgress(callback: InstallationCallback): () => void {
    this.callbacks.add(callback);
    // Immediately call with current progress
    callback(this.currentProgress);
    
    // Return unsubscribe function
    return () => {
      this.callbacks.delete(callback);
    };
  }

  public getCurrentProgress(): InstallationProgress {
    return this.currentProgress;
  }

  // Force a fresh installation with data preloading
  public async forceReinstall(): Promise<void> {
    try {
      if ('serviceWorker' in navigator) {
        // Unregister current service worker
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          await registration.unregister();
        }

        // Clear all caches
        if ('caches' in window) {
          const cacheNames = await caches.keys();
          await Promise.all(cacheNames.map(name => caches.delete(name)));
        }

        // Re-register service worker
        await navigator.serviceWorker.register('/sw.js');
        
        this.updateProgress({
          stage: 'installing',
          message: 'Reinstalling...',
          progress: 10
        });
      }
    } catch (error) {
      console.error('Failed to force reinstall:', error);
      this.updateProgress({
        stage: 'error',
        message: 'Reinstallation failed. Please refresh manually.',
        progress: 0
      });
    }
  }

  // Check if critical data is available offline
  public async checkOfflineDataAvailability(): Promise<boolean> {
    try {
      if (!('caches' in window)) return false;

      const cache = await caches.open('fastnow-data-v1757846000000');
      const keys = await cache.keys();
      
      // Check if we have the essential endpoints cached - expanded for mobile
      const essentialEndpoints = [
        'default_foods',
        'shared_settings', 
        'brand_primary_color', // Color data is critical for UI
        'predefined_motivators'
      ];

      const cachedUrls = keys.map(req => req.url);
      const hasEssentialData = essentialEndpoints.every(endpoint => 
        cachedUrls.some(url => url.includes(endpoint))
      );

      console.log('Offline data availability check:', {
        hasEssentialData,
        cachedEndpoints: cachedUrls.length,
        essentialEndpoints,
        cachedUrls: cachedUrls.map(url => url.split('/').pop()).slice(0, 10) // Show first 10 for debugging
      });

      return hasEssentialData;
    } catch (error) {
      console.error('Failed to check offline data:', error);
      return false;
    }
  }
}

// Singleton instance
export const installationManager = new InstallationManager();

// React hook for installation progress
export const useInstallationProgress = () => {
  const [progress, setProgress] = useState<InstallationProgress>(
    installationManager.getCurrentProgress()
  );

  useEffect(() => {
    const unsubscribe = installationManager.onProgress(setProgress);
    return unsubscribe;
  }, []);

  return {
    progress,
    forceReinstall: installationManager.forceReinstall.bind(installationManager),
    checkOfflineAvailability: installationManager.checkOfflineDataAvailability.bind(installationManager)
  };
};
