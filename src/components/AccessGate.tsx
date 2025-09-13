import React from 'react';
import { useAccess } from '@/hooks/useAccess';
import { useToast } from '@/hooks/use-toast';
import { showAIAccessError, showFoodTrackingLimitError } from '@/components/AIRequestLimitToast';

export type AccessFeature = 'ai' | 'food' | 'premium';

interface AccessGateRenderProps {
  hasAccess: boolean;
  requestUpgrade: () => void;
}

interface AccessGateProps {
  feature: AccessFeature;
  children: (props: AccessGateRenderProps) => React.ReactNode;
}

export const AccessGate = ({ feature, children }: AccessGateProps) => {
  const { access_level, hasAIAccess, hasFoodAccess, hasPremiumFeatures, createSubscription, testRole, isTestingMode } = useAccess();
  const { toast } = useToast();

  // Determine effective level when testing
  const effectiveLevel = isTestingMode ? testRole : access_level;
  const effectiveHasAIAccess = isTestingMode
    ? testRole === 'paid_user' || testRole === 'admin' || testRole === 'free_full'
    : hasAIAccess;
  const effectiveHasFoodAccess = isTestingMode
    ? testRole === 'paid_user' || testRole === 'admin' || testRole === 'free_full' || testRole === 'free_food_only'
    : hasFoodAccess;
  const effectiveHasPremium = isTestingMode
    ? testRole === 'paid_user' || testRole === 'admin' || testRole === 'free_full'
    : hasPremiumFeatures;

  // Compute access based on feature
  let hasAccess = false;
  if (feature === 'ai') {
    hasAccess = effectiveLevel === 'admin' || effectiveHasAIAccess;
  } else if (feature === 'food') {
    hasAccess = effectiveLevel === 'admin' || effectiveHasFoodAccess;
  } else {
    hasAccess = effectiveLevel === 'admin' || effectiveHasPremium;
  }

  const requestUpgrade = () => {
    if (feature === 'ai') {
      showAIAccessError(toast, createSubscription);
    } else if (feature === 'food') {
      showFoodTrackingLimitError(toast, createSubscription);
    } else if (createSubscription) {
      createSubscription();
    }
  };

  return <>{children({ hasAccess, requestUpgrade })}</>;
};

