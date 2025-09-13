import { useState, useEffect, useRef } from 'react';

interface LoadingDebounceConfig {
  debounceMs?: number;
  maxConcurrent?: number;
}

/**
 * Hook to prevent multiple simultaneous loading operations and provide debouncing
 */
export const useLoadingDebounce = (config: LoadingDebounceConfig = {}) => {
  const { debounceMs = 300, maxConcurrent = 1 } = config;
  const [isLoading, setIsLoading] = useState(false);
  const activeOperations = useRef(new Set<string>());
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  
  const startOperation = async <T,>(
    operationId: string,
    operation: () => Promise<T>
  ): Promise<T | null> => {
    // Check if operation is already running
    if (activeOperations.current.has(operationId)) {
      console.log(`🚫 Operation ${operationId} already running, skipping`);
      return null;
    }
    
    // Check concurrent limit
    if (activeOperations.current.size >= maxConcurrent) {
      console.log(`🚫 Too many concurrent operations (${activeOperations.current.size}), skipping ${operationId}`);
      return null;
    }
    
    // Clear any existing debounce timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    
    return new Promise((resolve) => {
      debounceTimer.current = setTimeout(async () => {
        activeOperations.current.add(operationId);
        setIsLoading(true);
        
        try {
          console.log(`🚀 Starting operation: ${operationId}`);
          const result = await operation();
          resolve(result);
        } catch (error) {
          console.error(`❌ Operation ${operationId} failed:`, error);
          resolve(null);
        } finally {
          activeOperations.current.delete(operationId);
          if (activeOperations.current.size === 0) {
            setIsLoading(false);
          }
          console.log(`✅ Completed operation: ${operationId}`);
        }
      }, debounceMs);
    });
  };
  
  const isOperationRunning = (operationId: string) => {
    return activeOperations.current.has(operationId);
  };
  
  const cancelAllOperations = () => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = null;
    }
    activeOperations.current.clear();
    setIsLoading(false);
  };
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelAllOperations();
    };
  }, []);
  
  return {
    isLoading,
    startOperation,
    isOperationRunning,
    cancelAllOperations,
    activeOperationsCount: activeOperations.current.size
  };
};