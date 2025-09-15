import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

/**
 * Unified cache manager that consolidates all cache management functionality
 * Replaces useAuthCacheManager, useCacheManager, and related cache utilities
 */
export const useUnifiedCacheManager = () => {
  const queryClient = useQueryClient();

  // Authentication cache management
  const clearAuthCaches = useCallback((userId?: string) => {
    if (userId) {
      // Clear specific user caches
      queryClient.invalidateQueries({ queryKey: ['access', userId] });
      queryClient.invalidateQueries({ queryKey: ['profile', userId] });
      
      // Clear localStorage caches for specific user
      if (typeof window !== 'undefined') {
        localStorage.removeItem(`cache_profile_${userId}`);
        localStorage.removeItem(`dedupe_profile_${userId}`);
        localStorage.removeItem(`cache_access_${userId}`);
        localStorage.removeItem(`dedupe_access_${userId}`);
      }
    } else {
      // Clear all auth caches
      queryClient.invalidateQueries({ queryKey: ['access'] });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      
      // Clear all localStorage auth caches
      if (typeof window !== 'undefined') {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (key.startsWith('cache_profile_') || 
              key.startsWith('dedupe_profile_') ||
              key.startsWith('cache_access_') ||
              key.startsWith('dedupe_access_')) {
            localStorage.removeItem(key);
          }
        });
      }
    }
  }, [queryClient]);

  // Subscription cache management
  const clearSubscriptionCache = useCallback(async (forceReload = false) => {
      console.log('🗑️ Clearing subscription cache');
      
      // Clear all subscription-related queries
      await queryClient.invalidateQueries({ queryKey: ['unified-subscription'] });
    await queryClient.invalidateQueries({ queryKey: ['subscription'] });
    await queryClient.invalidateQueries({ queryKey: ['optimized-subscription'] });
    
    // Remove from cache entirely
    queryClient.removeQueries({ queryKey: ['unified-subscription'] });
    queryClient.removeQueries({ queryKey: ['subscription'] });
    queryClient.removeQueries({ queryKey: ['optimized-subscription'] });
    
    // Clear profile data that might affect subscription
    queryClient.invalidateQueries({ queryKey: ['profile'] });
    
    // Force refetch
    await queryClient.refetchQueries({ 
      queryKey: ['unified-subscription'],
      type: 'active' 
    });
    
    console.log('✅ Subscription cache cleared');
    
    if (forceReload) {
      window.location.reload();
    }
  }, [queryClient]);

  // Walking data cache management
  const clearWalkingCache = useCallback(() => {
    console.log('🗑️ Clearing walking cache');
    queryClient.invalidateQueries({ queryKey: ['walking'] });
    queryClient.removeQueries({ queryKey: ['walking'] });
    console.log('✅ Walking cache cleared');
  }, [queryClient]);

  // Goals and motivators cache management
  const clearGoalsCache = useCallback(() => {
    console.log('🗑️ Clearing goals cache');
    queryClient.invalidateQueries({ queryKey: ['goals'] });
    queryClient.invalidateQueries({ queryKey: ['motivators'] });
    queryClient.removeQueries({ queryKey: ['goals'] });
    queryClient.removeQueries({ queryKey: ['motivators'] });
  }, [queryClient]);

  // Food data cache management
  const clearFoodCache = useCallback((userId?: string, date?: string) => {
    console.log('🗑️ Clearing food cache');
    if (userId && date) {
      queryClient.invalidateQueries({ queryKey: ['food', 'entries', userId, date] });
      queryClient.removeQueries({ queryKey: ['food', 'entries', userId, date] });
    } else if (userId) {
      queryClient.invalidateQueries({ queryKey: ['food', 'entries', userId] });
      queryClient.removeQueries({ queryKey: ['food', 'entries', userId] });
    } else {
      queryClient.invalidateQueries({ queryKey: ['food'] });
      queryClient.removeQueries({ queryKey: ['food'] });
    }
  }, [queryClient]);

  // Profile cache management
  const clearProfileCache = useCallback((userId?: string) => {
    console.log('🗑️ Clearing profile cache');
    if (userId) {
      queryClient.invalidateQueries({ queryKey: ['profile', userId] });
      queryClient.removeQueries({ queryKey: ['profile', userId] });
    } else {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.removeQueries({ queryKey: ['profile'] });
    }
  }, [queryClient]);

  // Complete cache reset (for logout)
  const clearAllCache = useCallback(() => {
    console.log('🗑️ Clearing ALL cache');
    queryClient.clear();
    
    // Clear localStorage
    if (typeof window !== 'undefined') {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('cache_') || key.startsWith('dedupe_')) {
          localStorage.removeItem(key);
        }
      });
    }
    
    console.log('✅ All cache cleared');
  }, [queryClient]);

  // Refresh authentication data
  const refreshAuthData = useCallback((userId?: string) => {
    if (userId) {
      queryClient.refetchQueries({ queryKey: ['access', userId] });
      queryClient.refetchQueries({ queryKey: ['profile', userId] });
    } else {
      queryClient.refetchQueries({ queryKey: ['access'] });
      queryClient.refetchQueries({ queryKey: ['profile'] });
    }
    console.log('🔄 Refreshed authentication data');
  }, [queryClient]);

  // Memory cleanup for mobile devices
  const performMemoryCleanup = useCallback(() => {
    console.log('🧹 Performing memory cleanup');
    
    // Remove stale queries without observers
    queryClient.getQueryCache().getAll().forEach(query => {
      if (query.isStale() && !query.getObserversCount()) {
        queryClient.removeQueries({ queryKey: query.queryKey });
      }
    });
    
    console.log('✅ Memory cleanup completed');
  }, [queryClient]);

  return {
    // Auth management
    clearAuthCaches,
    refreshAuthData,
    
    // Specific cache management
    clearSubscriptionCache,
    clearWalkingCache,
    clearGoalsCache,
    clearFoodCache,
    clearProfileCache,
    
    // Global management
    clearAllCache,
    performMemoryCleanup,
  };
};