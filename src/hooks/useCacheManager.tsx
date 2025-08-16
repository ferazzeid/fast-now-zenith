import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

export const useCacheManager = () => {
  const queryClient = useQueryClient();

  const clearAllSubscriptionCache = useCallback(async () => {
    console.log('🗑️ Clearing ALL subscription-related cache');
    
    try {
      // Clear all subscription-related queries
      await queryClient.invalidateQueries({ queryKey: ['unified-subscription'] });
      await queryClient.invalidateQueries({ queryKey: ['subscription'] });
      await queryClient.invalidateQueries({ queryKey: ['optimized-subscription'] });
      
      // Remove from cache entirely to prevent stale data
      queryClient.removeQueries({ queryKey: ['unified-subscription'] });
      queryClient.removeQueries({ queryKey: ['subscription'] });
      queryClient.removeQueries({ queryKey: ['optimized-subscription'] });
      
      // Clear any cached profile data that might affect subscription status
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      
      // Force complete refetch with network request
      await queryClient.refetchQueries({ 
        queryKey: ['unified-subscription'],
        type: 'active' 
      });
      
      // Small delay to ensure cache is fully cleared
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log('✅ All subscription cache cleared and refetched');
      
      // Force browser to refresh any cached subscription state
      window.location.reload();
    } catch (error) {
      console.error('❌ Error clearing subscription cache:', error);
    }
  }, [queryClient]);

  const forceRefreshSubscription = useCallback(() => {
    console.log('🔄 Force refreshing subscription data');
    queryClient.invalidateQueries({ queryKey: ['unified-subscription'] });
    queryClient.refetchQueries({ queryKey: ['unified-subscription'] });
  }, [queryClient]);

  const clearSubscriptionCache = useCallback((options: { showToast?: boolean; delay?: number } = {}) => {
    console.log('🗑️ Clearing subscription cache');
    queryClient.invalidateQueries({ queryKey: ['unified-subscription'] });
    queryClient.invalidateQueries({ queryKey: ['subscription'] });
    queryClient.removeQueries({ queryKey: ['unified-subscription'] });
    queryClient.removeQueries({ queryKey: ['subscription'] });
    
    if (options.showToast) {
      console.log('✅ Subscription cache cleared');
    }
  }, [queryClient]);

  const clearWalkingCache = useCallback((options: { showToast?: boolean } = {}) => {
    console.log('🗑️ Clearing walking cache');
    queryClient.invalidateQueries({ queryKey: ['walking'] });
    queryClient.removeQueries({ queryKey: ['walking'] });
    
    if (options.showToast) {
      console.log('✅ Walking cache cleared');
    }
  }, [queryClient]);

  const clearGoalsCache = useCallback(async (options: { showToast?: boolean } = {}) => {
    console.log('🗑️ Clearing goals cache');
    queryClient.invalidateQueries({ queryKey: ['goals'] });
    queryClient.invalidateQueries({ queryKey: ['motivators'] });
    queryClient.removeQueries({ queryKey: ['goals'] });
    queryClient.removeQueries({ queryKey: ['motivators'] });
    
    if (options.showToast) {
      console.log('✅ Goals cache cleared');
    }
  }, [queryClient]);

  const clearProfileCache = useCallback(async (options: { showToast?: boolean } = {}) => {
    console.log('🗑️ Clearing profile cache');
    queryClient.invalidateQueries({ queryKey: ['profile'] });
    queryClient.removeQueries({ queryKey: ['profile'] });
    
    if (options.showToast) {
      console.log('✅ Profile cache cleared');
    }
  }, [queryClient]);

  return {
    clearAllSubscriptionCache,
    forceRefreshSubscription,
    clearSubscriptionCache,
    clearWalkingCache,
    clearGoalsCache,
    clearProfileCache,
  };
};