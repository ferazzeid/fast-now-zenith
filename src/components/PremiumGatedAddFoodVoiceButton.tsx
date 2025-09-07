import React from 'react';
import { Lock } from 'lucide-react';
import { useAccess } from '@/hooks/useAccess';
import { showAIAccessError } from '@/components/AIRequestLimitToast';
import { useToast } from '@/hooks/use-toast';
import { EnhancedVoiceFoodInput } from '@/components/EnhancedVoiceFoodInput';

interface PremiumGatedAddFoodVoiceButtonProps {
  onFoodParsed: (result: any) => void;
  onProcessingStateChange?: (state: 'idle' | 'listening' | 'analyzing') => void;
}

export const PremiumGatedAddFoodVoiceButton = ({ 
  onFoodParsed, 
  onProcessingStateChange 
}: PremiumGatedAddFoodVoiceButtonProps) => {
  const { access_level, hasAIAccess, createSubscription, testRole, isTestingMode } = useAccess();
  const { toast } = useToast();
  
  // Use test role if in testing mode, otherwise use actual access level
  const effectiveLevel = isTestingMode ? testRole : access_level;
  const effectiveHasAIAccess = isTestingMode ? (testRole === 'paid_user' || testRole === 'admin' || testRole === 'free_full') : hasAIAccess;

  // Check if user has access to AI voice features
  const hasAccess = effectiveLevel === 'admin' || effectiveHasAIAccess;

  if (!hasAccess) {
    return (
      <button
        onClick={() => {
          showAIAccessError(toast, createSubscription);
        }}
        className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center opacity-50"
        title="AI Voice Assistant (Premium Feature)"
        aria-label="AI voice input - premium feature"
      >
        <Lock className="w-4 h-4 text-muted-foreground" />
      </button>
    );
  }

  return (
    <EnhancedVoiceFoodInput
      onFoodParsed={onFoodParsed}
      onProcessingStateChange={onProcessingStateChange}
    />
  );
};