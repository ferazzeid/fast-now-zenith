/**
 * Detects when users are stuck on loading screens and provides automatic recovery
 */

const LOADING_TIMEOUT = 15000; // 15 seconds
const RECOVERY_KEY = 'app_recovery_attempt';

export class StuckLoadingDetector {
  private static instance: StuckLoadingDetector;
  private loadingStartTime: number = 0;
  private timeoutId: NodeJS.Timeout | null = null;
  private hasRecovered = false;

  static getInstance(): StuckLoadingDetector {
    if (!StuckLoadingDetector.instance) {
      StuckLoadingDetector.instance = new StuckLoadingDetector();
    }
    return StuckLoadingDetector.instance;
  }

  startLoadingTimer(loadingState: string) {
    this.loadingStartTime = Date.now();
    this.clearTimeout();
    
    this.timeoutId = setTimeout(() => {
      this.handleStuckLoading(loadingState);
    }, LOADING_TIMEOUT);
  }

  stopLoadingTimer() {
    this.clearTimeout();
    this.loadingStartTime = 0;
  }

  private clearTimeout() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  private async handleStuckLoading(loadingState: string) {
    if (this.hasRecovered) return;
    
    console.warn(`Stuck loading detected in state: ${loadingState}`);
    
    // Check if we've already tried recovery recently
    const lastRecovery = localStorage.getItem(RECOVERY_KEY);
    if (lastRecovery && Date.now() - parseInt(lastRecovery) < 60000) {
      console.warn('Recovery attempted recently, skipping automatic recovery');
      return;
    }

    this.hasRecovered = true;
    localStorage.setItem(RECOVERY_KEY, Date.now().toString());

    try {
      // Force clear caches and reload
      await this.performRecovery();
    } catch (error) {
      console.error('Recovery failed:', error);
    }
  }

  private async performRecovery() {
    console.log('Performing automatic recovery...');
    
    // Clear all caches
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
    }
    
    // Clear storage
    try {
      sessionStorage.clear();
      localStorage.removeItem('app_recovery_attempt'); // Keep recovery tracking
    } catch (e) {
      console.warn('Could not clear storage:', e);
    }
    
    // Force service worker update
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          await registration.update();
          await registration.unregister();
        }
        
        // Re-register service worker
        await navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' });
      } catch (e) {
        console.warn('Service worker recovery failed:', e);
      }
    }
    
    // Reload the page
    window.location.reload();
  }
}

// Export singleton instance
export const stuckLoadingDetector = StuckLoadingDetector.getInstance();