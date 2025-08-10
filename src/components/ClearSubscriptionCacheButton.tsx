import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSubscriptionCache } from '@/hooks/optimized/useOptimizedSubscription';
import { useAuth } from '@/hooks/useAuth';

export const ClearSubscriptionCacheButton: React.FC = () => {
  const { toast } = useToast();
  const { clearSubscriptionCache } = useSubscriptionCache();
  const { user } = useAuth();

  const handleClearCache = async () => {
    try {
      // Clear React Query cache
      if (user?.id) {
        clearSubscriptionCache(user.id);
      }
      
      // Clear legacy subscription cache
      const legacyCacheKey = `subscription_${user?.id}`;
      localStorage.removeItem(legacyCacheKey);
      localStorage.removeItem('subscription_cache');
      
      // Clear any other subscription-related cache keys
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('subscription') || key.includes('user_tier'))) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
      
      toast({
        title: "🔄 Cache Cleared",
        description: "Subscription cache cleared. Refresh the page to reload your subscription status.",
      });
      
      // Force reload after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 1500);
      
    } catch (error) {
      console.error('Error clearing subscription cache:', error);
      toast({
        title: "Error",
        description: "Failed to clear cache. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Button 
      onClick={handleClearCache}
      variant="outline"
      size="sm"
      className="flex items-center gap-2"
    >
      <RefreshCw className="w-4 h-4" />
      Clear Subscription Cache
    </Button>
  );
};