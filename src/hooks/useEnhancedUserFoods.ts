import { useCallback, useEffect, useState } from 'react';
import { useUserLibraryIndex } from '@/hooks/useUserLibraryIndex';

/**
 * Enhanced user foods hook with 24-hour local caching
 * Provides instant access to user's food library with background sync
 */
export const useEnhancedUserFoods = () => {
  const { isInLibrary, refresh, addLocal, loading } = useUserLibraryIndex();
  const [lastRefresh, setLastRefresh] = useState<number>(0);
  
  // Cache duration: 24 hours
  const CACHE_DURATION = 24 * 60 * 60 * 1000;
  
  // Check if cache is stale
  const isCacheStale = useCallback(() => {
    const now = Date.now();
    return (now - lastRefresh) > CACHE_DURATION;
  }, [lastRefresh]);
  
  // Background refresh if cache is stale
  useEffect(() => {
    if (isCacheStale() && !loading) {
      refresh().then(() => {
        setLastRefresh(Date.now());
      });
    }
  }, [isCacheStale, loading, refresh]);
  
  // Manual refresh with cache timestamp update
  const refreshWithCache = useCallback(async () => {
    await refresh();
    setLastRefresh(Date.now());
  }, [refresh]);
  
  return {
    isInLibrary,
    refreshLibrary: refreshWithCache,
    addToLocalCache: addLocal,
    loading,
    isCacheStale: isCacheStale()
  };
};

export default useEnhancedUserFoods;