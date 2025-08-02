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
  isOnline: navigator.onLine,
  isConnected: true,
  lastConnectedAt: new Date(),
  retryCount: 0,
  queue: [],
  currentInterval: 120000, // Start with 2 minutes

  checkConnection: async () => {
    try {
      const { error } = await supabase.from('profiles').select('id').limit(1);
      const connected = !error;
      
      set(state => ({
        isConnected: connected,
        lastConnectedAt: connected ? new Date() : state.lastConnectedAt,
        retryCount: connected ? 0 : state.retryCount + 1,
        currentInterval: connected ? 120000 : Math.min(state.currentInterval * 1.5, 600000), // Exponential backoff, max 10 minutes
      }));
      
      if (connected) {
        // Process any queued operations
        get().processQueue();
      }
      
      return connected;
    } catch (error) {
      set(state => ({
        isConnected: false,
        retryCount: state.retryCount + 1,
      }));
      return false;
    }
  },

  startMonitoring: () => {
    const { checkConnection } = get();
    
    // Check connection immediately
    checkConnection();
    
    // Set up periodic checks
    if (monitoringInterval) {
      clearInterval(monitoringInterval);
    }
    
    const startInterval = () => {
      const currentState = get();
      monitoringInterval = setInterval(() => {
        checkConnection();
      }, currentState.currentInterval); // Dynamic interval based on connection state
    };
    
    startInterval();
    
    // Listen to online/offline events
    const handleOnline = () => {
      set({ isOnline: true });
      checkConnection();
    };
    
    const handleOffline = () => {
      set({ isOnline: false, isConnected: false });
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Store event listeners for cleanup
    (window as any).__connectionListeners = { handleOnline, handleOffline };
  },

  stopMonitoring: () => {
    if (monitoringInterval) {
      clearInterval(monitoringInterval);
      monitoringInterval = null;
    }
    
    const listeners = (window as any).__connectionListeners;
    if (listeners) {
      window.removeEventListener('online', listeners.handleOnline);
      window.removeEventListener('offline', listeners.handleOffline);
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