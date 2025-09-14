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
  const { access_level, hasAIAccess, hasFoodAccess, hasPremiumFeatures, createSubscription } = useAccess();
  const { toast } = useToast();

  // Compute access based on feature
  let hasAccess = false;
  if (feature === 'ai') {
    hasAccess = access_level === 'admin' || hasAIAccess;
  } else if (feature === 'food') {
    hasAccess = access_level === 'admin' || hasFoodAccess;
  } else {
    hasAccess = access_level === 'admin' || hasPremiumFeatures;
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

