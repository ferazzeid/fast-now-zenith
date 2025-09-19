import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAccess } from '@/hooks/useAccess';
import { useGooglePlayBilling } from '@/hooks/useGooglePlayBilling';
import { detectPlatform, getPlatformDisplayName, getPaymentProviderForPlatform, getPaymentProviderDisplayName } from '@/utils/platformDetection';
import { Smartphone, CreditCard, Calendar, ExternalLink, RefreshCw } from 'lucide-react';
import { BillingInformation } from '@/components/BillingInformation';

export const UnifiedSubscriptionStatus: React.FC = () => {
  const [platform, setPlatform] = useState<string>('web');
  const [paymentProvider, setPaymentProvider] = useState<string>('stripe');
  
  const { 
    hasPremiumFeatures, 
    access_level, 
    isTrial, 
    daysRemaining, 
    openCustomerPortal,
    createSubscription 
  } = useAccess();
  
  const {
    isAvailable: isBillingAvailable,
    checkBillingAvailability,
    checkSubscriptionStatus
  } = useGooglePlayBilling();

  useEffect(() => {
    const detectedPlatform = detectPlatform();
    const provider = getPaymentProviderForPlatform(detectedPlatform as any);
    
    setPlatform(detectedPlatform);
    setPaymentProvider(provider);
    
    if (detectedPlatform === 'android') {
      checkBillingAvailability();
    }
  }, [checkBillingAvailability]);

  const getSubscriptionStatusInfo = () => {
    if (access_level === 'admin') {
      return {
        status: 'Admin',
        description: 'Full administrative access',
        variant: 'default' as const,
        showBilling: false
      };
    }
    
    if (hasPremiumFeatures) {
      return {
        status: 'Premium Active',
        description: isTrial 
          ? `Trial - ${daysRemaining} days remaining` 
          : 'Premium subscription active',
        variant: 'default' as const,
        showBilling: true
      };
    }
    
    return {
      status: 'Free',
      description: 'Limited access - upgrade for full features',
      variant: 'secondary' as const,
      showBilling: false
    };
  };

  const statusInfo = getSubscriptionStatusInfo();

  const handleManageSubscription = async () => {
    if (platform === 'android' && isBillingAvailable) {
      // Open Google Play Store subscriptions
      window.open('https://play.google.com/store/account/subscriptions', '_blank');
    } else if (paymentProvider === 'stripe') {
      // Open Stripe customer portal
      await openCustomerPortal();
    }
  };

  const handleUpgrade = async () => {
    if (createSubscription) {
      await createSubscription();
    }
  };

  const renderPlatformSpecificActions = () => {
    switch (platform) {
      case 'android':
        return (
          <div className="space-y-2">
            {hasPremiumFeatures ? (
              <Button
                variant="outline"
                onClick={handleManageSubscription}
                className="w-full"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Manage in Play Store
              </Button>
            ) : (
              <Button
                onClick={handleUpgrade}
                className="w-full"
                disabled={!isBillingAvailable}
              >
                <Smartphone className="mr-2 h-4 w-4" />
                Upgrade via Google Play
              </Button>
            )}
          </div>
        );

      case 'ios':
        return (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              iOS subscriptions coming soon. Use web version for now.
            </p>
            <Button
              onClick={handleUpgrade}
              variant="outline"
              className="w-full"
            >
              <CreditCard className="mr-2 h-4 w-4" />
              Upgrade via Web
            </Button>
          </div>
        );

      default:
        return (
          <div className="space-y-2">
            {hasPremiumFeatures ? (
              <Button
                variant="outline"
                onClick={handleManageSubscription}
                className="w-full"
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Manage Billing
              </Button>
            ) : (
              <Button
                onClick={handleUpgrade}
                className="w-full"
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Upgrade to Premium
              </Button>
            )}
          </div>
        );
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Subscription Status</span>
          <Badge variant={statusInfo.variant}>
            {statusInfo.status}
          </Badge>
        </CardTitle>
        <CardDescription>
          {statusInfo.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-muted-foreground" />
            <span>Platform</span>
          </div>
          <div className="flex items-center gap-2">
            <span>{getPlatformDisplayName(platform as any)}</span>
            <Badge variant="outline" className="text-xs">
              {getPaymentProviderDisplayName(paymentProvider as any)}
            </Badge>
          </div>
        </div>

        {statusInfo.showBilling && paymentProvider === 'stripe' && (
          <BillingInformation />
        )}

        {isTrial && daysRemaining <= 3 && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Trial Ending Soon!</strong> Your trial expires in {daysRemaining} day{daysRemaining !== 1 ? 's' : ''}. 
              Upgrade now to continue accessing premium features.
            </p>
          </div>
        )}

        {renderPlatformSpecificActions()}

        {platform === 'android' && !isBillingAvailable && (
          <div className="p-3 bg-info/5 border border-info/20 rounded-lg">
            <p className="text-sm text-info-foreground">
              Install our app from Google Play Store to use native billing.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};