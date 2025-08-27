import React from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAccess } from '@/hooks/useAccess';

interface AIRequestLimitErrorProps {
  error: any;
}

export const showAIRequestLimitError = (error: any, toast: any, createSubscription: () => void) => {
  if (error.message?.includes('AI features are only available') || 
      error.message?.includes('free trial has ended') ||
      error.message?.includes('Monthly request limit') || 
      error.limit_reached) {
    
    // Handle trial exhausted or no access
    if (error.message?.includes('only available to premium users') || 
        error.message?.includes('Start your free trial')) {
      toast({
        title: "AI Features Unavailable",
        description: "AI features are only available to premium users. Start your free trial or upgrade to continue!",
        variant: "default",
        action: (
          <Button 
            onClick={createSubscription}
            size="sm"
            className="ml-2"
          >
            Start Trial
          </Button>
        ),
        duration: 8000,
      });
    } else if (error.message?.includes('free trial has ended')) {
      toast({
        title: "Trial Period Ended",
        description: "Your free trial has ended. Upgrade to premium to continue using AI features!",
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
      // Handle monthly limit reached for premium users
      toast({
        title: "Monthly Limit Reached",
        description: "You've used all your AI requests this month. Your limit will reset next month.",
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
  const { createSubscription } = useAccess();

  React.useEffect(() => {
    showAIRequestLimitError(error, toast, createSubscription);
  }, [error, toast, createSubscription]);

  return null;
};