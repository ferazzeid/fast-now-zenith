import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface CacheManagerOptions {
  showToast?: boolean;
  delay?: number;
}

export const useCacheManager = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  const clearSubscriptionCache = async (options: CacheManagerOptions = {}) => {
    const { showToast = true, delay = 0 } = options;

    try {
      // Clear React Query subscription caches
      await queryClient.invalidateQueries({ queryKey: ['subscription'] });
      await queryClient.invalidateQueries({ queryKey: ['unified-subscription'] });
      await queryClient.invalidateQueries({ queryKey: ['optimized-subscription'] });
      await queryClient.invalidateQueries({ queryKey: ['multi-platform-subscription'] });
      
      // Clear profile cache since subscription is tied to profile
      await queryClient.invalidateQueries({ queryKey: ['profile'] });
      
      // Clear legacy localStorage cache
      if (user?.id) {
        const legacyCacheKey = `subscription_${user.id}`;
        localStorage.removeItem(legacyCacheKey);
      }
      localStorage.removeItem('subscription_cache');
      
      // Clear other subscription-related keys
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('subscription') || key.includes('user_tier'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));

      if (showToast) {
        toast({
          title: "✅ Cache Refreshed",
          description: "Subscription data has been reloaded successfully.",
        });
      }

      // Optional delay for better UX
      if (delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }

    } catch (error) {
      console.error('Error clearing subscription cache:', error);
      if (showToast) {
        toast({
          title: "Cache Error",
          description: "Failed to refresh cache. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const clearProfileCache = async (options: CacheManagerOptions = {}) => {
    const { showToast = true } = options;

    try {
      await queryClient.invalidateQueries({ queryKey: ['profile'] });
      await queryClient.invalidateQueries({ queryKey: ['user-settings'] });
      
      if (showToast) {
        toast({
          title: "✅ Profile Refreshed",
          description: "Profile data has been reloaded successfully.",
        });
      }
    } catch (error) {
      console.error('Error clearing profile cache:', error);
      if (showToast) {
        toast({
          title: "Cache Error",
          description: "Failed to refresh profile cache.",
          variant: "destructive",
        });
      }
    }
  };

  const clearGoalsCache = async (options: CacheManagerOptions = {}) => {
    const { showToast = false } = options;

    try {
      await queryClient.invalidateQueries({ queryKey: ['goals'] });
      await queryClient.invalidateQueries({ queryKey: ['admin-goals'] });
      await queryClient.invalidateQueries({ queryKey: ['goal-ideas'] });
      
      if (showToast) {
        toast({
          title: "✅ Goals Refreshed",
          description: "Goal data has been reloaded successfully.",
        });
      }
    } catch (error) {
      console.error('Error clearing goals cache:', error);
    }
  };

  const clearWalkingCache = async (options: CacheManagerOptions = {}) => {
    const { showToast = false } = options;

    try {
      await queryClient.invalidateQueries({ queryKey: ['walking'] });
      await queryClient.invalidateQueries({ queryKey: ['walking-sessions'] });
      await queryClient.invalidateQueries({ queryKey: ['walking-history'] });
      
      if (showToast) {
        toast({
          title: "✅ Walking Data Refreshed",
          description: "Walking session data has been reloaded successfully.",
        });
      }
    } catch (error) {
      console.error('Error clearing walking cache:', error);
    }
  };

  const clearAllCaches = async (options: CacheManagerOptions = {}) => {
    const { showToast = true } = options;

    try {
      await queryClient.clear();
      localStorage.clear();
      sessionStorage.clear();
      
      if (showToast) {
        toast({
          title: "✅ All Caches Cleared",
          description: "All application data has been refreshed.",
        });
      }
    } catch (error) {
      console.error('Error clearing all caches:', error);
      if (showToast) {
        toast({
          title: "Cache Error",
          description: "Failed to clear all caches.",
          variant: "destructive",
        });
      }
    }
  };

  return {
    clearSubscriptionCache,
    clearProfileCache,
    clearGoalsCache,
    clearWalkingCache,
    clearAllCaches,
  };
};