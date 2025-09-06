import React from 'react';
import { Button } from '@/components/ui/button';
import { Lock, Mic } from 'lucide-react';
import { useAccess } from '@/hooks/useAccess';
import { showAIRequestLimitError } from '@/components/AIRequestLimitToast';
import { useToast } from '@/hooks/use-toast';

export const PremiumGatedFoodVoiceButton = () => {
  const { access_level, hasAIAccess, createSubscription, testRole, isTestingMode } = useAccess();
  const { toast } = useToast();
  
  // Use test role if in testing mode, otherwise use actual access level
  const effectiveLevel = isTestingMode ? testRole : access_level;
  const effectiveHasAIAccess = isTestingMode ? (testRole === 'paid_user' || testRole === 'admin') : hasAIAccess;

  // Check if user has access to AI voice features
  const hasAccess = effectiveLevel === 'admin' || effectiveHasAIAccess;

  const handleClick = () => {
    if (!hasAccess) {
      showAIRequestLimitError(
        { current_tier: 'free', limit_reached: true }, 
        toast, 
        createSubscription
      );
    }
    // For users with access, the actual voice functionality would be handled here
    // This is a simplified version - the real implementation would integrate with voice recording
  };

  return (
    <Button
      variant="action-primary"
      size="action-tall"
      onClick={handleClick}
      className={`w-full flex items-center justify-center ${!hasAccess ? 'opacity-50' : ''}`}
      title={hasAccess ? "AI Voice Assistant" : "AI Voice Assistant (Premium Feature)"}
      aria-label={hasAccess ? "AI voice input" : "AI voice input - premium feature"}
    >
      {hasAccess ? (
        <Mic className="w-6 h-6" />
      ) : (
        <Lock className="w-6 h-6" />
      )}
    </Button>
  );
};