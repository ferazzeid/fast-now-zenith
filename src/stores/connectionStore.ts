import { create } from 'zustand';

interface ConnectionState {
  isOnline: boolean;
  lastChecked: number;
  isTestingConnection: boolean;
  
  // Actions
  startMonitoring: () => void;
  stopMonitoring: () => void;
  testConnection: () => Promise<boolean>;
}

export const useConnectionStore = create<ConnectionState>((set, get) => ({
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  lastChecked: Date.now(),
  isTestingConnection: false,

  testConnection: async () => {
    const state = get();
    if (state.isTestingConnection) return state.isOnline;
    
    set({ isTestingConnection: true });
    
    try {
      // Test actual connectivity with a small request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch('/favicon.ico', {
        method: 'HEAD',
        cache: 'no-cache',
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      const isConnected = response.ok;
      
      set({ 
        isOnline: isConnected, 
        lastChecked: Date.now(),
        isTestingConnection: false 
      });
      
      return isConnected;
    } catch (error) {
      set({ 
        isOnline: false, 
        lastChecked: Date.now(),
        isTestingConnection: false 
      });
      return false;
    }
  },

  startMonitoring: () => {
    const { testConnection } = get();
    
    const handleOnline = () => {
      set({ isOnline: true, lastChecked: Date.now() });
      // Test actual connection after going online
      setTimeout(() => testConnection(), 1000);
    };
    
    const handleOffline = () => {
      set({ isOnline: false, lastChecked: Date.now() });
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      
      // Periodic connection test (every 30 seconds when online)
      const intervalId = setInterval(() => {
        const state = get();
        if (state.isOnline && Date.now() - state.lastChecked > 30000) {
          testConnection();
        }
      }, 30000);
      
      // Store event listeners and interval for cleanup
      (window as any).__connectionListeners = { 
        handleOnline, 
        handleOffline, 
        intervalId 
      };
      
      // Initial connection test
      setTimeout(() => testConnection(), 500);
    }
  },

  stopMonitoring: () => {
    const listeners = (window as any).__connectionListeners;
    if (listeners) {
      window.removeEventListener('online', listeners.handleOnline);
      window.removeEventListener('offline', listeners.handleOffline);
      if (listeners.intervalId) {
        clearInterval(listeners.intervalId);
      }
      delete (window as any).__connectionListeners;
    }
  },
}));