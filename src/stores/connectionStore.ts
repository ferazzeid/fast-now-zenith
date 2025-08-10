import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';

interface QueuedOperation {
  id: string;
  operation: () => Promise<any>;
  retries: number;
  maxRetries: number;
}

interface ConnectionState {
  isOnline: boolean;
  isConnected: boolean;
  lastConnectedAt: Date | null;
  retryCount: number;
  queue: QueuedOperation[];
  currentInterval: number; // For exponential backoff
  
  // Actions
  checkConnection: () => Promise<boolean>;
  startMonitoring: () => void;
  stopMonitoring: () => void;
  queueOperation: (operation: () => Promise<any>, maxRetries?: number) => string;
  processQueue: () => Promise<void>;
  removeFromQueue: (id: string) => void;
  forceRetry: () => Promise<void>;
}

let monitoringInterval: NodeJS.Timeout | null = null;

export const useConnectionStore = create<ConnectionState>((set, get) => ({
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  isConnected: true, // Start optimistic - will validate on first check
  lastConnectedAt: null,
  retryCount: 0,
  queue: [],
  currentInterval: 120000, // Start with 2 minutes

  checkConnection: async () => {
    try {
      // Simple connectivity test with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const { error } = await supabase
        .from('profiles')
        .select('id')
        .limit(1)
        .abortSignal(controller.signal);
      
      clearTimeout(timeoutId);
      const connected = !error;
      
      set(state => ({
        isConnected: connected,
        lastConnectedAt: connected ? new Date() : state.lastConnectedAt,
        retryCount: connected ? 0 : state.retryCount + 1,
        currentInterval: connected ? 120000 : Math.min(state.currentInterval * 1.2, 300000), // Slower exponential backoff, max 5 minutes
      }));
      
      if (connected) {
        // Process any queued operations
        get().processQueue();
      }
      
      return connected;
    } catch (error) {
      console.log('Connection check failed:', error);
      set(state => ({
        isConnected: false,
        retryCount: state.retryCount + 1,
      }));
      return false;
    }
  },

  startMonitoring: () => {
    console.log('🌐 Starting connection monitoring...');
    
    // Listen to online/offline events only
    const handleOnline = () => {
      console.log('🌐 Network online detected');
      set({ isOnline: true });
      // Check connection when coming back online
      setTimeout(() => get().checkConnection(), 500);
    };
    
    const handleOffline = () => {
      console.log('🌐 Network offline detected');
      set({ isOnline: false, isConnected: false });
    };
    
    // Handle page focus - check connection when user returns
    const handleFocus = () => {
      console.log('🌐 Page focus detected - checking connection');
      get().checkConnection();
    };
    
    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      window.addEventListener('focus', handleFocus);
      
      // Store event listeners for cleanup
      (window as any).__connectionListeners = { handleOnline, handleOffline, handleFocus };
      
      // Initial connection check
      setTimeout(() => {
        get().checkConnection();
      }, 1000);
    }
  },

  stopMonitoring: () => {
    console.log('🌐 Stopping connection monitoring...');
    
    if (monitoringInterval) {
      clearInterval(monitoringInterval);
      monitoringInterval = null;
    }
    
    const listeners = (window as any).__connectionListeners;
    if (listeners) {
      window.removeEventListener('online', listeners.handleOnline);
      window.removeEventListener('offline', listeners.handleOffline);
      window.removeEventListener('focus', listeners.handleFocus);
      delete (window as any).__connectionListeners;
    }
  },

  queueOperation: (operation: () => Promise<any>, maxRetries = 3) => {
    const id = Math.random().toString(36).substr(2, 9);
    const queuedOp: QueuedOperation = {
      id,
      operation,
      retries: 0,
      maxRetries,
    };
    
    set(state => ({
      queue: [...state.queue, queuedOp],
    }));
    
    return id;
  },

  processQueue: async () => {
    const { queue, isConnected, removeFromQueue } = get();
    
    if (!isConnected || queue.length === 0) return;
    
    for (const queuedOp of queue) {
      try {
        await queuedOp.operation();
        removeFromQueue(queuedOp.id);
      } catch (error) {
        if (queuedOp.retries < queuedOp.maxRetries) {
          set(state => ({
            queue: state.queue.map(op => 
              op.id === queuedOp.id 
                ? { ...op, retries: op.retries + 1 }
                : op
            ),
          }));
        } else {
          // Max retries reached, remove from queue
          removeFromQueue(queuedOp.id);
          console.error('Operation failed after max retries:', error);
        }
      }
    }
  },

  removeFromQueue: (id: string) => {
    set(state => ({
      queue: state.queue.filter(op => op.id !== id),
    }));
  },

  forceRetry: async () => {
    set({ retryCount: 0, currentInterval: 120000 }); // Reset to initial interval
    await get().checkConnection();
  },
}));