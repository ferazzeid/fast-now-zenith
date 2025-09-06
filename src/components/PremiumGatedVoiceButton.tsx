
import React from 'react';
import { PremiumGate } from '@/components/PremiumGate';
import { CircularVoiceButton } from '@/components/CircularVoiceButton';
import { useAccess } from '@/hooks/useAccess';

import { showAIAccessError } from '@/components/AIRequestLimitToast';
import { useToast } from '@/hooks/use-toast';

interface PremiumGatedVoiceButtonProps {
  onTranscription: (text: string) => void;
  isDisabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const PremiumGatedVoiceButton = (props: PremiumGatedVoiceButtonProps) => {
  const { access_level, hasAIAccess, createSubscription, testRole, isTestingMode } = useAccess();
  const { toast } = useToast();
  
  // Use test role if in testing mode, otherwise use actual access level
  const effectiveLevel = isTestingMode ? testRole : access_level;
  const effectiveHasAIAccess = isTestingMode ? (testRole === 'paid_user' || testRole === 'admin') : hasAIAccess;

  // Check if user has access to the feature
  const hasAccess = effectiveLevel === 'admin' || effectiveHasAIAccess;

  // If no access and free user, show upgrade prompt instead of functioning
  const disabledProps = !hasAccess && effectiveLevel === 'free' 
    ? { 
        ...props, 
        onTranscription: () => {
          showAIAccessError(toast, createSubscription);
        },
        isDisabled: false  // Allow clicking to show upgrade prompt
      }
    : props;

  return (
    <PremiumGate feature="Voice Input" grayOutForFree={true}>
      <CircularVoiceButton {...disabledProps} />
    </PremiumGate>
  );
};
