import React from 'react';
import { PremiumGate } from '@/components/PremiumGate';
import { RegenerateImageButton } from '@/components/RegenerateImageButton';
import { useMultiPlatformSubscription } from '@/hooks/useMultiPlatformSubscription';
import { useRoleTestingContext } from '@/contexts/RoleTestingContext';

interface PremiumGatedRegenerateButtonProps {
  prompt: string;
  filename: string;
  bucket?: string;
  onImageGenerated: (imageUrl: string) => void;
  disabled?: boolean;
  className?: string;
  motivatorId?: string;
}

export const PremiumGatedRegenerateButton = (props: PremiumGatedRegenerateButtonProps) => {
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

  // If no access and free user, disable the onImageGenerated callback
  const disabledProps = !hasAccess && effectiveRole === 'free_user' 
    ? { ...props, onImageGenerated: () => {}, disabled: true }
    : props;

  return (
    <PremiumGate feature="AI Image Generation" grayOutForFree={true}>
      <RegenerateImageButton {...disabledProps} />
    </PremiumGate>
  );
};