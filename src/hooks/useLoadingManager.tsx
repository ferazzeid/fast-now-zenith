import { create } from 'zustand';
import { useCallback, useEffect } from 'react';

interface LoadingState {
  [key: string]: boolean;
}

interface LoadingStore {
  loadingStates: LoadingState;
  timeouts: { [key: string]: NodeJS.Timeout };
  setLoading: (key: string, loading: boolean) => void;
  isLoading: (key: string) => boolean;
  clearTimeout: (key: string) => void;
}

// Global loading state manager
const useLoadingStore = create<LoadingStore>((set, get) => ({
  loadingStates: {},
  timeouts: {},
  
  setLoading: (key: string, loading: boolean) => {
    const { timeouts, clearTimeout } = get();
    
    // Clear existing timeout for this key
    if (timeouts[key]) {
      clearTimeout(key);
    }
    
    if (loading) {
      // Set loading state immediately
      set(state => ({
        loadingStates: { ...state.loadingStates, [key]: true }
      }));
      
      // Set timeout to force-clear loading after 10 seconds
      const timeoutId = setTimeout(() => {
        console.warn(`Loading timeout for ${key} - forcing to false`);
        set(state => ({
          loadingStates: { ...state.loadingStates, [key]: false },
          timeouts: { ...state.timeouts, [key]: undefined }
        }));
      }, 10000);
      
      set(state => ({
        timeouts: { ...state.timeouts, [key]: timeoutId }
      }));
    } else {
      // Clear loading state
      set(state => ({
        loadingStates: { ...state.loadingStates, [key]: false }
      }));
      
      // Clear timeout
      if (timeouts[key]) {
        clearTimeout(key);
      }
    }
  },
  
  isLoading: (key: string) => {
    return get().loadingStates[key] || false;
  },
  
  clearTimeout: (key: string) => {
    const { timeouts } = get();
    if (timeouts[key]) {
      clearTimeout(timeouts[key]);
      set(state => ({
        timeouts: { ...state.timeouts, [key]: undefined }
      }));
    }
  }
}));

// Hook for components to use
export const useLoadingManager = (key: string) => {
  const { setLoading, isLoading, clearTimeout } = useLoadingStore();
  const loading = useLoadingStore(state => state.loadingStates[key] || false);
  
  const startLoading = useCallback(() => {
    setLoading(key, true);
  }, [key, setLoading]);
  
  const stopLoading = useCallback(() => {
    setLoading(key, false);
  }, [key, setLoading]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimeout(key);
      setLoading(key, false);
    };
  }, [key, clearTimeout, setLoading]);
  
  return {
    loading,
    startLoading,
    stopLoading,
    setLoading: (loading: boolean) => setLoading(key, loading)
  };
};