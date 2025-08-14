import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCacheManager } from '@/hooks/useCacheManager';

export const ClearSubscriptionCacheButton: React.FC = () => {
  const { clearSubscriptionCache } = useCacheManager();

  const handleClearCache = () => {
    clearSubscriptionCache({ showToast: true, delay: 0 });
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