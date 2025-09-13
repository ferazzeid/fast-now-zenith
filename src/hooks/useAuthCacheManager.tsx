import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

/**
 * Unified cache manager for authentication-related data
 * Addresses the authentication chaos by providing synchronized cache invalidation
 */
export const useAuthCacheManager = () => {
  const queryClient = useQueryClient();

  const clearAllAuthCaches = useCallback(() => {
    // Fully clear React Query caches
    queryClient.clear();

    // Clear localStorage caches including persisted query data
    if (typeof window !== 'undefined') {
      // Remove React Query persister storage
      localStorage.removeItem('REACT_QUERY_OFFLINE_CACHE');

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

    console.log('🧹 Cleared all authentication caches');
  }, [queryClient]);

  const clearUserSpecificCaches = useCallback((userId: string) => {
    // Clear React Query caches for specific user
    queryClient.invalidateQueries({ queryKey: ['access', userId] });
    queryClient.invalidateQueries({ queryKey: ['profile', userId] });
    
    // Clear localStorage caches for specific user
    if (typeof window !== 'undefined') {
      localStorage.removeItem(`cache_profile_${userId}`);
      localStorage.removeItem(`dedupe_profile_${userId}`);
      localStorage.removeItem(`cache_access_${userId}`);
      localStorage.removeItem(`dedupe_access_${userId}`);
    }
    
    console.log(`🧹 Cleared caches for user: ${userId}`);
  }, [queryClient]);

  const refreshAuthData = useCallback((userId?: string) => {
    if (userId) {
      // Refresh specific user data
      queryClient.refetchQueries({ queryKey: ['access', userId] });
      queryClient.refetchQueries({ queryKey: ['profile', userId] });
    } else {
      // Refresh all auth data
      queryClient.refetchQueries({ queryKey: ['access'] });
      queryClient.refetchQueries({ queryKey: ['profile'] });
    }
    
    console.log('🔄 Refreshed authentication data');
  }, [queryClient]);

  return {
    clearAllAuthCaches,
    clearUserSpecificCaches,
    refreshAuthData,
  };
};