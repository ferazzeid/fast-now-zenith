
import React from 'react';
import { PremiumGate } from '@/components/PremiumGate';
import { CircularVoiceButton } from '@/components/CircularVoiceButton';
import { useSubscription } from '@/hooks/useSubscription';
import { useRoleTestingContext } from '@/contexts/RoleTestingContext';

interface PremiumGatedVoiceButtonProps {
  onTranscription: (text: string) => void;
  isDisabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const PremiumGatedVoiceButton = (props: PremiumGatedVoiceButtonProps) => {
  const { subscription_tier, isPaidUser, hasPremiumFeatures } = useSubscription();
  const { testRole, isTestingMode } = useRoleTestingContext();
  
  // Use test role if in testing mode, otherwise use actual subscription data
  const effectiveRole = isTestingMode ? testRole : subscription_tier;
  const effectiveHasPremiumFeatures = isTestingMode ? (testRole === 'paid_user' || testRole === 'admin') : hasPremiumFeatures;

  // Check if user has access to the feature
  const hasAccess = effectiveRole === 'admin' || effectiveHasPremiumFeatures;

  // If no access and free user, disable the onTranscription callback
  const disabledProps = !hasAccess && effectiveRole === 'free_user' 
    ? { ...props, onTranscription: () => {}, isDisabled: true }
    : props;

  return (
    <PremiumGate feature="Voice Input" grayOutForFree={true}>
      <CircularVoiceButton {...disabledProps} />
    </PremiumGate>
  );
};
