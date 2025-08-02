// Offline-first caching utilities using localStorage fallback
// Simplified version without IndexedDB to avoid complexity

interface CacheEntry<T> {
  data: T;
  cached_at: number;
  expires_at: number;
}

const CACHE_PREFIX = 'fastnow_cache_';

// Generic cache utilities
const setCache = <T>(key: string, data: T, ttlHours = 24): void => {
  try {
    const entry: CacheEntry<T> = {
      data,
      cached_at: Date.now(),
      expires_at: Date.now() + (ttlHours * 60 * 60 * 1000)
    };
    localStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(entry));
  } catch (error) {
    console.warn('Failed to cache data:', error);
  }
};

const getCache = <T>(key: string): T | null => {
  try {
    const cached = localStorage.getItem(`${CACHE_PREFIX}${key}`);
    if (!cached) return null;
    
    const entry: CacheEntry<T> = JSON.parse(cached);
    if (Date.now() > entry.expires_at) {
      localStorage.removeItem(`${CACHE_PREFIX}${key}`);
      return null;
    }
    
    return entry.data;
  } catch (error) {
    console.warn('Failed to retrieve cached data:', error);
    return null;
  }
};

// Profile caching
export const cacheProfile = (userId: string, profileData: any, ttlHours = 24): void => {
  setCache(`profile_${userId}`, profileData, ttlHours);
};

export const getCachedProfile = (userId: string): any | null => {
  return getCache(`profile_${userId}`);
};

// Subscription caching with 24-hour TTL
export const cacheSubscription = (userId: string, subscriptionData: any): void => {
  setCache(`subscription_${userId}`, subscriptionData, 24);
};

export const getCachedSubscription = (userId: string): any | null => {
  return getCache(`subscription_${userId}`);
};

// Request deduplication cache with short TTL
export const cacheRequest = (requestKey: string, data: any, ttlMinutes = 5): void => {
  const ttlHours = ttlMinutes / 60;
  setCache(`request_${requestKey}`, data, ttlHours);
};

export const getCachedRequest = (requestKey: string): any | null => {
  return getCache(`request_${requestKey}`);
};

// Session caching
export const cacheSession = (sessionId: string, userId: string, type: 'walking' | 'fasting', sessionData: any): void => {
  setCache(`session_${sessionId}`, { ...sessionData, type, user_id: userId }, 1); // 1 hour TTL
};

export const getCachedSessions = (userId: string, type?: 'walking' | 'fasting'): any[] => {
  // This is simplified - in a real implementation we'd scan all session keys
  // For now, we'll return empty array as this is mainly for the performance optimization
  return [];
};

// Food entry caching
export const cacheFoodEntries = (userId: string, date: string, entries: any[]): void => {
  setCache(`food_${userId}_${date}`, entries, 24);
};

export const getCachedFoodEntries = (userId: string, date: string): any[] => {
  return getCache(`food_${userId}_${date}`) || [];
};

// Cleanup expired entries
export const cleanupExpiredData = (): void => {
  try {
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(CACHE_PREFIX)) {
        try {
          const cached = localStorage.getItem(key);
          if (cached) {
            const entry: CacheEntry<any> = JSON.parse(cached);
            if (Date.now() > entry.expires_at) {
              keysToRemove.push(key);
            }
          }
        } catch (error) {
          keysToRemove.push(key);
        }
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
  } catch (error) {
    console.warn('Failed to cleanup expired data:', error);
  }
};

// Request deduplication utility
const pendingRequests = new Map<string, Promise<any>>();

export const deduplicateRequest = async <T>(
  requestKey: string,
  requestFn: () => Promise<T>,
  ttlMinutes = 5
): Promise<T> => {
  // Check cache first
  const cached = getCachedRequest(requestKey);
  if (cached) {
    return cached;
  }
  
  // Check if request is already pending
  if (pendingRequests.has(requestKey)) {
    return pendingRequests.get(requestKey);
  }
  
  // Execute request
  const promise = requestFn().then(async (result) => {
    // Cache the result
    cacheRequest(requestKey, result, ttlMinutes);
    pendingRequests.delete(requestKey);
    return result;
  }).catch((error) => {
    pendingRequests.delete(requestKey);
    throw error;
  });
  
  pendingRequests.set(requestKey, promise);
  return promise;
};

// Initialize cleanup on app start
let cleanupInitialized = false;
export const initOfflineStorage = (): void => {
  if (cleanupInitialized) return;
  
  // Run cleanup immediately
  cleanupExpiredData();
  
  // Run cleanup every hour
  setInterval(cleanupExpiredData, 60 * 60 * 1000);
  
  cleanupInitialized = true;
};