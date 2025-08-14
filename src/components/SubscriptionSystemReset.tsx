import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCacheManager } from '@/hooks/useCacheManager';

export const SubscriptionSystemReset: React.FC = () => {
  const { clearAllSubscriptionCache } = useCacheManager();
  const { toast } = useToast();

  const handleCompleteReset = async () => {
    toast({
      title: "Resetting Subscription System",
      description: "Clearing all caches and refreshing data...",
    });

    try {
      await clearAllSubscriptionCache();
      
      toast({
        title: "System Reset Complete",
        description: "All subscription data has been refreshed.",
      });
    } catch (error) {
      console.error('Complete reset failed:', error);
      toast({
        title: "Reset Failed",
        description: "There was an error resetting the system. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg border border-yellow-200 dark:border-yellow-800">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-medium text-yellow-800 dark:text-yellow-200 mb-1">
            Subscription Issues Detected
          </h3>
          <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
            If you're experiencing subscription inconsistencies, use this button to completely reset and refresh all subscription data.
          </p>
          <Button
            onClick={handleCompleteReset}
            variant="outline"
            size="sm"
            className="bg-yellow-100 dark:bg-yellow-900 border-yellow-300 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200 hover:bg-yellow-200 dark:hover:bg-yellow-800"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Complete System Reset
          </Button>
        </div>
      </div>
    </div>
  );
};