import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useGooglePlayBilling } from '@/hooks/useGooglePlayBilling';
import { useAccess } from '@/hooks/useAccess';
import { detectPlatform, getPlatformDisplayName, getPaymentProviderDisplayName } from '@/utils/platformDetection';
import { Smartphone, ShoppingBag, RefreshCw, ExternalLink } from 'lucide-react';
import { LoadingSpinner } from '@/components/LoadingSpinner';

export const MobileBillingInterface: React.FC = () => {
  const [platform, setPlatform] = useState<string>('web');
  const {
    isProcessing,
    isAvailable,
    checkBillingAvailability,
    purchaseSubscription,
    restorePurchases
  } = useGooglePlayBilling();
  
  const { hasPremiumFeatures, access_level } = useAccess();

  useEffect(() => {
    const detectedPlatform = detectPlatform();
    setPlatform(detectedPlatform);
    
    if (detectedPlatform === 'android') {
      checkBillingAvailability();
    }
  }, [checkBillingAvailability]);

  const handlePurchase = async () => {
    await purchaseSubscription('premium_subscription_monthly');
  };

  const handleRestore = async () => {
    await restorePurchases();
  };

  const renderPlatformSpecificContent = () => {
    switch (platform) {
      case 'android':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-primary" />
              <span className="font-medium">Android Device Detected</span>
              <Badge variant="outline">{getPaymentProviderDisplayName('google_play')}</Badge>
            </div>
            
            {!isAvailable && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Google Play Billing is not available. Make sure you're using the official app from Google Play Store.
                </p>
              </div>
            )}

            {hasPremiumFeatures ? (
              <div className="text-center space-y-2">
                <Badge variant="default" className="bg-green-500">Premium Active</Badge>
                <p className="text-sm text-muted-foreground">
                  Your premium subscription is active. You can manage it through Google Play Store.
                </p>
                <Button
                  variant="outline"
                  onClick={() => window.open('https://play.google.com/store/account/subscriptions', '_blank')}
                  className="w-full"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Manage in Play Store
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <Button
                  onClick={handlePurchase}
                  disabled={isProcessing || !isAvailable}
                  className="w-full"
                  size="lg"
                >
                  {isProcessing ? (
                    <>
                      <ShoppingBag className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="mr-2 h-4 w-4" />
                      Subscribe for $9.99/month
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  onClick={handleRestore}
                  disabled={isProcessing || !isAvailable}
                  className="w-full"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Restore Purchases
                </Button>
              </div>
            )}
          </div>
        );

      case 'ios':
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-primary" />
              <span className="font-medium">iOS Device Detected</span>
              <Badge variant="outline">Apple App Store</Badge>
            </div>
            
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                iOS subscriptions will be available when our app is published to the App Store. 
                For now, you can use the web version with Stripe.
              </p>
            </div>
          </div>
        );

      default:
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-muted-foreground" />
              <span className="font-medium">Web Platform</span>
              <Badge variant="outline">Stripe</Badge>
            </div>
            
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                You're using the web version. Mobile subscriptions are available through our Android and iOS apps. 
                Current subscription management uses Stripe.
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="w-5 h-5" />
          Mobile Billing
        </CardTitle>
        <CardDescription>
          Platform-specific subscription management for {getPlatformDisplayName(platform as any)} devices
        </CardDescription>
      </CardHeader>
      <CardContent>
        {renderPlatformSpecificContent()}
        
        {platform === 'android' && !isAvailable && (
          <div className="mt-4 p-3 bg-info/5 border border-info/20 rounded-lg">
            <p className="text-sm text-info-foreground">
              <strong>Note:</strong> To use Google Play Billing, download our app from the Google Play Store. 
              Web versions cannot access native billing APIs.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};