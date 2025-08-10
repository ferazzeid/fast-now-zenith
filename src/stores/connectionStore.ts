import { create } from 'zustand';

interface ConnectionState {
  isOnline: boolean;
  
  // Actions
  startMonitoring: () => void;
  stopMonitoring: () => void;
}

export const useConnectionStore = create<ConnectionState>((set, get) => ({
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,

  startMonitoring: () => {
    const handleOnline = () => set({ isOnline: true });
    const handleOffline = () => set({ isOnline: false });
    
    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      
      // Store event listeners for cleanup
      (window as any).__connectionListeners = { handleOnline, handleOffline };
    }
  },

  stopMonitoring: () => {
    const listeners = (window as any).__connectionListeners;
    if (listeners) {
      window.removeEventListener('online', listeners.handleOnline);
      window.removeEventListener('offline', listeners.handleOffline);
      delete (window as any).__connectionListeners;
    }
  },
}));