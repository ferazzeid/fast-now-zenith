import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useVisibilityControl } from '@/utils/visibilityUtils';

interface CachedMotivators {
  data: any[];
  timestamp: number;
  ttl: number;
}

const CACHE_KEY = 'motivators_cache';
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

export const useMotivatorCache = () => {
  const [cachedMotivators, setCachedMotivators] = useState<any[] | null>(null);
  const [lastFetch, setLastFetch] = useState<number>(0);
  const { user } = useAuth();
  const { shouldRefetch } = useVisibilityControl();

  // Load from localStorage on mount
  useEffect(() => {
    if (!user) return;
    
    try {
      const cached = localStorage.getItem(`${CACHE_KEY}_${user.id}`);
      if (cached) {
        const parsed: CachedMotivators = JSON.parse(cached);
        const now = Date.now();
        
        // Check if cache is still valid
        if (now - parsed.timestamp < parsed.ttl) {
          setCachedMotivators(parsed.data);
          setLastFetch(parsed.timestamp);
          return;
        }
      }
    } catch (error) {
      console.error('Error loading cached motivators:', error);
    }
    
    setCachedMotivators(null);
  }, [user?.id]);

  const shouldFetchMotivators = useCallback(() => {
    if (!user) return false;
    if (!cachedMotivators) return true;
    // If cache exists but is empty, force a fetch to avoid "no motivators yet" stale state
    if (Array.isArray(cachedMotivators) && cachedMotivators.length === 0) return true;
    
    const now = Date.now();
    const timeSinceLastFetch = now - lastFetch;
    
    // Only fetch if:
    // 1. No cached data
    // 2. Cached array is empty
    // 3. Cache is expired (24 hours)
    // 4. Tab is visible and user is active (every 30 min min)
    return timeSinceLastFetch > CACHE_TTL || 
           (timeSinceLastFetch > 30 * 60 * 1000 && shouldRefetch()); // 30 min minimum for active refresh
  }, [user, cachedMotivators, lastFetch, shouldRefetch]);

  const cacheMotivators = useCallback((motivators: any[]) => {
    if (!user) return;
    
    try {
      const cacheData: CachedMotivators = {
        data: motivators,
        timestamp: Date.now(),
        ttl: CACHE_TTL
      };
      
      localStorage.setItem(`${CACHE_KEY}_${user.id}`, JSON.stringify(cacheData));
      setCachedMotivators(motivators);
      setLastFetch(Date.now());
    } catch (error) {
      console.error('Error caching motivators:', error);
    }
  }, [user?.id]);

  const invalidateCache = useCallback(() => {
    if (!user) return;
    
    try {
      localStorage.removeItem(`${CACHE_KEY}_${user.id}`);
      setCachedMotivators(null);
      setLastFetch(0);
    } catch (error) {
      console.error('Error invalidating motivator cache:', error);
    }
  }, [user?.id]);

  return {
    cachedMotivators,
    shouldFetchMotivators,
    cacheMotivators,
    invalidateCache
  };
};