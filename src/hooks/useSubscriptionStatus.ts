import { useMemo } from 'react';
import { useAccess } from '@/hooks/useAccess';

export const useSubscriptionStatus = () => {
  const {
    hasPremiumFeatures,
    access_level,
    isTrial,
    daysRemaining,
    openCustomerPortal,
  } = useAccess();

  const statusInfo = useMemo(() => {
    if (access_level === 'admin') {
      return {
        status: 'Admin Account',
        description: 'Full access to all features',
        variant: 'default' as const,
        showBilling: false,
      };
    }

    if (hasPremiumFeatures) {
      return {
        status: 'Active Subscription',
        description: 'Premium features enabled',
        variant: 'default' as const,
        showBilling: true,
      };
    }

    if (isTrial) {
      return {
        status: 'Free Trial',
        description: `${daysRemaining} days remaining`,
        variant: 'secondary' as const,
        showBilling: true,
      };
    }

    return {
      status: 'Free Account',
      description: 'Limited features available',
      variant: 'outline' as const,
      showBilling: false,
    };
  }, [access_level, hasPremiumFeatures, isTrial, daysRemaining]);

  return {
    hasPremiumFeatures,
    access_level,
    isTrial,
    daysRemaining,
    openCustomerPortal,
    statusInfo,
  };
};

export type SubscriptionStatusInfo = ReturnType<typeof useSubscriptionStatus>['statusInfo'];
