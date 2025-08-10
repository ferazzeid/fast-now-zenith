
import React from 'react';
import { PremiumGate } from '@/components/PremiumGate';
import { CircularVoiceButton } from '@/components/CircularVoiceButton';
import { useSubscription } from '@/hooks/useSubscription';
import { useRoleTestingContext } from '@/contexts/RoleTestingContext';
import { showAIRequestLimitError } from '@/components/AIRequestLimitToast';
import { useToast } from '@/hooks/use-toast';

interface PremiumGatedVoiceButtonProps {
  onTranscription: (text: string) => void;
  isDisabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const PremiumGatedVoiceButton = (props: PremiumGatedVoiceButtonProps) => {
  const { subscription_tier, isPaidUser, hasPremiumFeatures, createSubscription } = useSubscription();
  const { testRole, isTestingMode } = useRoleTestingContext();
  const { toast } = useToast();
  
  // Use test role if in testing mode, otherwise use actual subscription data
  const effectiveRole = isTestingMode ? testRole : subscription_tier;
  const effectiveHasPremiumFeatures = isTestingMode ? (testRole === 'paid_user' || testRole === 'admin') : hasPremiumFeatures;

  // Check if user has access to the feature
  const hasAccess = effectiveRole === 'admin' || effectiveHasPremiumFeatures;

  // If no access and free user, show upgrade prompt instead of functioning
  const disabledProps = !hasAccess && effectiveRole === 'free_user' 
    ? { 
        ...props, 
        onTranscription: () => {
          showAIRequestLimitError(
            { current_tier: 'free_user', limit_reached: true }, 
            toast, 
            createSubscription
          );
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
