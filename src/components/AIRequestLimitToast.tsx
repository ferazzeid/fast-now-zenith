import React from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useSubscription } from '@/hooks/useSubscription';

interface AIRequestLimitErrorProps {
  error: any;
}

export const showAIRequestLimitError = (error: any, toast: any, createSubscription: () => void) => {
  if (error.message?.includes('Monthly request limit') || error.limit_reached) {
    const currentTier = error.current_tier || 'free_user';
    
    if (currentTier === 'free_user') {
      toast({
        title: "AI Features Unavailable",
        description: "AI features are only available to premium users. Upgrade now to unlock unlimited AI assistance!",
        variant: "default",
        action: (
          <Button 
            onClick={createSubscription}
            size="sm"
            className="ml-2"
          >
            Upgrade Now
          </Button>
        ),
        duration: 8000,
      });
    } else {
      toast({
        title: "Monthly Limit Reached",
        description: "You've reached your monthly AI request limit. Your limit will reset next month.",
        variant: "destructive",
        duration: 6000,
      });
    }
    return true;
  }
  return false;
};

export const showFoodTrackingLimitError = (toast: any, createSubscription: () => void) => {
  toast({
    title: "Food Tracking Unavailable",
    description: "Food tracking is only available to premium users. Upgrade now to unlock unlimited food logging!",
    variant: "default",
    action: (
      <Button 
        onClick={createSubscription}
        size="sm"
        className="ml-2"
      >
        Upgrade Now
      </Button>
    ),
    duration: 8000,
  });
};

export const AIRequestLimitToast: React.FC<AIRequestLimitErrorProps> = ({ error }) => {
  const { toast } = useToast();
  const { createSubscription } = useSubscription();

  React.useEffect(() => {
    showAIRequestLimitError(error, toast, createSubscription);
  }, [error, toast, createSubscription]);

  return null;
};