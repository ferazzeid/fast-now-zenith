import React from 'react';
import { Button } from '@/components/ui/button';
import { Lock, Mic } from 'lucide-react';
import { useAccess } from '@/hooks/useAccess';
import { showAIAccessError } from '@/components/AIRequestLimitToast';
import { useToast } from '@/hooks/use-toast';

interface PremiumGatedFoodVoiceButtonProps {
  onVoiceClick?: () => void;
}

export const PremiumGatedFoodVoiceButton = ({ onVoiceClick }: PremiumGatedFoodVoiceButtonProps) => {
  const { access_level, hasAIAccess, createSubscription, testRole, isTestingMode } = useAccess();
  const { toast } = useToast();
  
  // Use test role if in testing mode, otherwise use actual access level
  const effectiveLevel = isTestingMode ? testRole : access_level;
  const effectiveHasAIAccess = isTestingMode ? (testRole === 'paid_user' || testRole === 'admin' || testRole === 'free_full') : hasAIAccess;

  // Check if user has access to AI voice features
  const hasAccess = effectiveLevel === 'admin' || effectiveHasAIAccess;

  const handleClick = () => {
    if (!hasAccess) {
      showAIAccessError(toast, createSubscription);
      return;
    }
    
    // For users with access, trigger the voice functionality
    if (onVoiceClick) {
      onVoiceClick();
    }
  };

  return (
    <Button
      variant="action-primary"
      size="action-tall"
      onClick={handleClick}
      className={`w-full flex items-center justify-center bg-ai hover:bg-ai/90 text-ai-foreground ${!hasAccess ? 'opacity-50' : ''}`}
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