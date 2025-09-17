
import React from 'react';
import { useAccess } from '@/hooks/useAccess';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Crown, ExternalLink, Calendar, Clock, TestTube, RefreshCw } from 'lucide-react';
import { TrialIndicator } from './TrialIndicator';
import { useUnifiedCacheManager } from '@/hooks/useUnifiedCacheManager';
import { SubscriptionSystemReset } from './SubscriptionSystemReset';

export const SettingsSubscription = () => {
  const { 
    hasPremiumFeatures, 
    access_level,
    isTrial,
    daysRemaining,
    createSubscription, 
    openCustomerPortal, 
    loading,
    refetch,
  } = useAccess();
  const { clearSubscriptionCache } = useUnifiedCacheManager();

  // Force refresh subscription data when Settings page loads
  React.useEffect(() => {
    console.log('⚙️ Settings page loaded - refreshing subscription data');
    refetch();
  }, [refetch]);

  const isWeb = true; // Always web platform
  const platformName = 'Stripe';
  const manageUrl = 'https://billing.stripe.com/p/login';

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const getTrialTimeRemaining = () => {
    if (!daysRemaining) return null;
    
    if (daysRemaining <= 0) return { expired: true, text: 'Trial expired' };
    
    return { 
      expired: false, 
      text: `${daysRemaining} day${daysRemaining > 1 ? 's' : ''} remaining` 
    };
  };

  const getMemberSinceDate = () => {
    if (!hasPremiumFeatures) return null;
    // For simplicity, estimate member since as 30 days ago
    const memberSince = new Date();
    memberSince.setDate(memberSince.getDate() - 30);
    return memberSince.toLocaleDateString();
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'premium': 
      case 'admin': return 'default';
      case 'trial': return 'secondary';
      case 'free': return 'outline';
      default: return 'outline';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'premium': return 'Active Subscription';
      case 'admin': return 'Admin Account';
      case 'trial': return 'Free Trial';
      case 'free': return 'Free Account';
      default: return status;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5" />
            Account
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Loading subscription details...</div>
        </CardContent>
      </Card>
    );
  }

  // Enhanced debug logging
  React.useEffect(() => {
    console.log('⚙️ SETTINGS SUBSCRIPTION RENDER DEBUG:', {
      hasPremiumFeatures,
      access_level,
      isTrial,
      daysRemaining,
      computedAccountType: hasPremiumFeatures ? 'Premium User' : isTrial ? 'Free Trial' : 'Free User',
      shouldShowTrial: isTrial && daysRemaining,
      timestamp: new Date().toISOString()
    });
  }, [hasPremiumFeatures, access_level, isTrial, daysRemaining]);

  return (
    <div className="space-y-6">
      <SubscriptionSystemReset />
      <TrialIndicator />
      
      <Card>
        <CardHeader>
          <CardTitle className="text-heading flex items-center gap-2">
            <Crown className="w-5 h-5" />
            Account
          </CardTitle>
          <CardDescription className="text-ui-sm text-muted-foreground">
            Your account and subscription information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Account Information */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-label">Account Type</p>
                <p className="text-ui-sm text-muted-foreground">
                  {hasPremiumFeatures ? 'Premium User' : isTrial ? 'Free Trial' : 'Free User'}
                </p>
              </div>
              <Badge variant={getStatusBadgeVariant(access_level)}>
                {getStatusLabel(access_level)}
              </Badge>
            </div>

            {/* Trial Status */}
            {isTrial && daysRemaining && (() => {
              const timeRemaining = getTrialTimeRemaining();
              if (!timeRemaining) return null;
              
              return (
                <div className="flex items-center justify-between py-2 px-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <div>
                    <p className="text-label text-blue-800 dark:text-blue-200">Trial Status</p>
                    <p className="text-ui-sm text-blue-600 dark:text-blue-400">
                      {timeRemaining.expired ? 'Trial expired' : timeRemaining.text}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-ui-xs text-blue-600 dark:text-blue-400">Days Left</p>
                    <p className="text-ui-sm text-blue-800 dark:text-blue-200">
                      {daysRemaining}
                    </p>
                  </div>
                </div>
              );
            })()}

            {/* Premium Member Info */}
            {hasPremiumFeatures && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-label">Member Since</p>
                    <p className="text-ui-sm text-muted-foreground">
                      {getMemberSinceDate()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between py-2 px-3 bg-green-50 dark:bg-green-950 rounded-lg">
                  <div>
                    <p className="text-label text-green-800 dark:text-green-200">Active Subscription</p>
                    <p className="text-ui-sm text-green-600 dark:text-green-400">
                      You have full access to premium features
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-ui-xs text-green-600 dark:text-green-400">Status</p>
                    <p className="text-ui-sm text-green-800 dark:text-green-200">
                      Active
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Platform and Login Info */}
          <div className="grid grid-cols-2 gap-4 p-3 bg-muted/30 rounded-lg">
            <div>
              <p className="text-ui-xs text-muted-foreground">Platform</p>
              <Badge variant="outline" className="mt-1 text-ui-xs">web</Badge>
            </div>
            <div>
              <p className="text-ui-xs text-muted-foreground">Login Method</p>
              <Badge variant="outline" className="mt-1 text-ui-xs">email</Badge>
            </div>
          </div>

          {/* Debug Section */}
          <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-gray-600 dark:text-gray-400">Debug Info</span>
              <Button
                onClick={() => {
                  console.log('🔄 Manual cache clear requested');
                  clearSubscriptionCache(true);
                }}
                variant="outline"
                size="sm"
                className="h-6 px-2 text-xs"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Refresh
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-gray-500">Trial:</span> {String(isTrial)}
              </div>
              <div>
                <span className="text-gray-500">Access:</span> {access_level}
              </div>
              <div>
                <span className="text-gray-500">Premium:</span> {String(hasPremiumFeatures)}
              </div>
              <div>
                <span className="text-gray-500">Platform:</span> web
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            {!hasPremiumFeatures ? (
              isWeb ? (
                <Button 
                  onClick={createSubscription}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                >
                  <Crown className="w-4 h-4 mr-2" />
                  Upgrade to Premium
                </Button>
              ) : (
                <Button 
                  onClick={createSubscription}
                  className="flex-1"
                >
                  <Crown className="w-4 h-4 mr-2" />
                  Upgrade via {platformName}
                </Button>
              )
            ) : (
              isWeb ? (
                <Button 
                  onClick={openCustomerPortal}
                  variant="outline"
                  className="flex-1"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Manage Subscription
                </Button>
              ) : (
                <Button 
                  onClick={() => window.open(manageUrl, '_blank')}
                  variant="outline"
                  className="flex-1"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Manage on {platformName}
                </Button>
              )
            )}
          </div>

          {/* Feature List */}
          <div className="pt-4 border-t">
            <p className="text-label mb-3">Premium Features</p>
            <div className="space-y-2 text-ui-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Food tracking with AI assistance
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Unlimited voice input and AI chat
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Advanced goal setting and tracking
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
