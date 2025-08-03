import { useState, useCallback } from 'react';

interface CachedSubscriptionData {
  subscribed: boolean;
  subscription_tier: string;
  requests_used: number;
  request_limit: number;
  isPaidUser: boolean;
  hasPremiumFeatures: boolean;
  payment_provider: string;
  platform: string;
  subscription_end_date?: string;
  timestamp: number;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
let subscriptionCache: CachedSubscriptionData | null = null;

export const useSubscriptionCache = () => {
  const [isValidating, setIsValidating] = useState(false);

  const getCachedSubscription = useCallback((): CachedSubscriptionData | null => {
    if (!subscriptionCache) return null;
    
    const now = Date.now();
    if (now - subscriptionCache.timestamp > CACHE_DURATION) {
      subscriptionCache = null;
      return null;
    }
    
    return subscriptionCache;
  }, []);

  const setCachedSubscription = useCallback((data: Omit<CachedSubscriptionData, 'timestamp'>) => {
    subscriptionCache = {
      ...data,
      timestamp: Date.now()
    };
  }, []);

  const clearCache = useCallback(() => {
    subscriptionCache = null;
  }, []);

  const isExpired = useCallback((): boolean => {
    if (!subscriptionCache) return true;
    return Date.now() - subscriptionCache.timestamp > CACHE_DURATION;
  }, []);

  return {
    getCachedSubscription,
    setCachedSubscription,
    clearCache,
    isExpired,
    isValidating,
    setIsValidating
  };
};