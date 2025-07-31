// Memory management utilities to prevent leaks and optimize performance

export const createMemoizedFn = <T extends (...args: any[]) => any>(
  fn: T, 
  dependencies: any[]
): T => {
  let cached: ReturnType<T> | undefined;
  let lastDeps: any[] = [];
  
  return ((...args: Parameters<T>) => {
    const depsChanged = dependencies.some((dep, index) => dep !== lastDeps[index]);
    
    if (!cached || depsChanged) {
      cached = fn(...args);
      lastDeps = [...dependencies];
    }
    
    return cached;
  }) as T;
};

export const debounce = <T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

export const throttle = <T extends (...args: any[]) => any>(
  fn: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

export const cleanupArray = (array: any[]) => {
  array.length = 0;
  return array;
};

export const safeSetInterval = (callback: () => void, interval: number) => {
  const intervalId = setInterval(callback, interval);
  
  // Return cleanup function
  return () => {
    clearInterval(intervalId);
  };
};

export const createSafeAsyncEffect = (
  effect: () => Promise<void | (() => void)>, 
  deps: any[]
) => {
  return {
    effect,
    deps,
    cleanup: null as (() => void) | null
  };
};