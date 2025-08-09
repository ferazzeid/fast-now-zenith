
import React from 'react';
import { PremiumGate } from '@/components/PremiumGate';
import { RegenerateImageButton } from '@/components/RegenerateImageButton';
import { useSubscription } from '@/hooks/useSubscription';
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
  const { subscription_tier, isPaidUser, hasPremiumFeatures } = useSubscription();
  const { testRole, isTestingMode } = useRoleTestingContext();
  
  // Use test role if in testing mode, otherwise use actual subscription data
  const effectiveRole = isTestingMode ? testRole : subscription_tier;
  const effectiveHasPremiumFeatures = isTestingMode ? (testRole === 'paid_user' || testRole === 'admin') : hasPremiumFeatures;

  // Check if user has access to the feature
  const hasAccess = effectiveRole === 'admin' || effectiveHasPremiumFeatures;

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
