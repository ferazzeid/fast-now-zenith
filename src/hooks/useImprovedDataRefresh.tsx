import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';

// Hook to handle proper data refresh across the app
export const useImprovedDataRefresh = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const refreshAllData = useCallback(async () => {
    if (!user) return;

    // Invalidate all queries related to user data
    await queryClient.invalidateQueries({
      predicate: (query) => {
        const queryKey = query.queryKey;
        return (
          queryKey.includes('profile') ||
          queryKey.includes('goals') ||
          queryKey.includes('fasting') ||
          queryKey.includes('walking') ||
          queryKey.includes('food') ||
          queryKey.includes('deficit') ||
          queryKey.includes('calories')
        );
      }
    });
  }, [queryClient, user]);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    await queryClient.invalidateQueries({ queryKey: ['profile', user.id] });
  }, [queryClient, user]);

  const refreshGoals = useCallback(async () => {
    if (!user) return;
    await queryClient.invalidateQueries({ queryKey: ['goals', user.id] });
  }, [queryClient, user]);

  const refreshHistory = useCallback(async () => {
    if (!user) return;
    await queryClient.invalidateQueries({ 
      predicate: (query) => {
        const queryKey = query.queryKey;
        return queryKey.includes('history') || queryKey.includes('sessions');
      }
    });
  }, [queryClient, user]);

  return {
    refreshAllData,
    refreshProfile,
    refreshGoals,
    refreshHistory
  };
};