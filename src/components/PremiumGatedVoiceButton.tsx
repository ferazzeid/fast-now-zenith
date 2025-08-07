import React from 'react';
import { PremiumGate } from '@/components/PremiumGate';
import { CircularVoiceButton } from '@/components/CircularVoiceButton';
import { useMultiPlatformSubscription } from '@/hooks/useMultiPlatformSubscription';
import { useRoleTestingContext } from '@/contexts/RoleTestingContext';

interface PremiumGatedVoiceButtonProps {
  onTranscription: (text: string) => void;
  isDisabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const PremiumGatedVoiceButton = (props: PremiumGatedVoiceButtonProps) => {
  const { subscribed, subscription_tier, requests_used, request_limit } = useMultiPlatformSubscription();
  const { testRole, isTestingMode } = useRoleTestingContext();
  
  // Use test role if in testing mode, otherwise use actual subscription data
  const effectiveRole = isTestingMode ? testRole : subscription_tier;
  const effectiveRequestsUsed = isTestingMode && testRole === 'free_user' ? 15 : requests_used;
  const effectiveRequestLimit = isTestingMode && testRole === 'free_user' ? 15 : request_limit;
  const effectiveSubscribed = isTestingMode ? (testRole === 'paid_user' || testRole === 'api_user') : subscribed;

  // Check if user has access to the feature
  const hasAccess = effectiveRole === 'api_user' || 
                   effectiveSubscribed || 
                   (effectiveRequestsUsed < effectiveRequestLimit) ||
                   effectiveRole === 'admin';

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