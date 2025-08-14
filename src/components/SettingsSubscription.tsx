
import React from 'react';
import { useUnifiedSubscription } from '@/hooks/useUnifiedSubscription';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Crown, ExternalLink, Calendar, Clock, TestTube } from 'lucide-react';
import { TrialIndicator } from './TrialIndicator';
import { useRoleTestingContext } from '@/contexts/RoleTestingContext';

export const SettingsSubscription = () => {
  const { 
    subscribed, 
    subscription_status, 
    subscription_tier,
    subscription_end_date,
    inTrial,
    trialEndsAt,
    createSubscription, 
    openCustomerPortal, 
    loading,
    platform,
    login_method,
    debug,
  } = useUnifiedSubscription();

  const { testRole, isTestingMode } = useRoleTestingContext();

  const isWeb = platform === 'web';
  const platformName = platform === 'ios' ? 'App Store' : platform === 'android' ? 'Google Play' : 'Stripe';
  const manageUrl = platform === 'ios'
    ? 'https://apps.apple.com/account/subscriptions'
    : 'https://play.google.com/store/account/subscriptions';

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const getTrialTimeRemaining = () => {
    if (!trialEndsAt) return null;
    
    const now = new Date();
    const trialEnd = new Date(trialEndsAt);
    const timeDiff = trialEnd.getTime() - now.getTime();
    
    if (timeDiff <= 0) return { expired: true, text: 'Trial expired' };
    
    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) {
      return { 
        expired: false, 
        text: `${days} day${days > 1 ? 's' : ''}${hours > 0 ? ` and ${hours} hour${hours > 1 ? 's' : ''}` : ''} remaining` 
      };
    } else if (hours > 0) {
      return { expired: false, text: `${hours} hour${hours > 1 ? 's' : ''} remaining` };
    } else {
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
      return { expired: false, text: `${Math.max(1, minutes)} minute${minutes > 1 ? 's' : ''} remaining` };
    }
  };

  const getMemberSinceDate = () => {
    if (!subscribed || !subscription_end_date) return null;
    // Calculate member since date by going back one billing cycle (assuming monthly)
    const renewalDate = new Date(subscription_end_date);
    const memberSince = new Date(renewalDate);
    memberSince.setMonth(memberSince.getMonth() - 1);
    return memberSince.toLocaleDateString();
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'trial': return 'secondary';
      case 'free': return 'outline';
      default: return 'outline';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Active Subscription';
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

  // Debug logging
  console.log('🔍 SettingsSubscription Debug:', {
    subscribed,
    subscription_status,
    inTrial,
    trialEndsAt,
    subscription_tier,
    platform,
    login_method
  });

  return (
    <div className="space-y-6">
      <TrialIndicator />
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5" />
            Account
          </CardTitle>
          <CardDescription>
            Your account and subscription information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Account Information */}
          <div className="space-y-4">
            {/* Role Testing Indicator */}
            {isTestingMode && (
              <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <TestTube className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    Role Testing Active: {testRole}
                  </p>
                  <p className="text-xs text-yellow-600 dark:text-yellow-400">
                    Actual account data (trial/subscription) shown below
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Account Type</p>
                <p className="text-sm text-muted-foreground">
                  {subscribed ? 'Premium User' : inTrial ? 'Free Trial' : 'Free User'}
                  {isTestingMode && (
                    <span className="ml-2 text-xs text-yellow-600 dark:text-yellow-400">
                      (Real status, not test role)
                    </span>
                  )}
                </p>
              </div>
              <Badge variant={getStatusBadgeVariant(subscription_status)}>
                {getStatusLabel(subscription_status)}
              </Badge>
            </div>

            {/* Trial Status */}
            {inTrial && trialEndsAt && (() => {
              const timeRemaining = getTrialTimeRemaining();
              if (!timeRemaining) return null;
              
              return (
                <div className="flex items-center justify-between py-2 px-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <div>
                    <p className="font-medium text-blue-800 dark:text-blue-200">Trial Status</p>
                    <p className="text-sm text-blue-600 dark:text-blue-400">
                      {timeRemaining.expired ? 'Trial expired' : timeRemaining.text}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-blue-600 dark:text-blue-400">Expires</p>
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                      {formatDate(trialEndsAt)}
                    </p>
                  </div>
                </div>
              );
            })()}

            {/* Premium Member Info */}
            {subscribed && subscription_end_date && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Member Since</p>
                    <p className="text-sm text-muted-foreground">
                      {getMemberSinceDate()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between py-2 px-3 bg-green-50 dark:bg-green-950 rounded-lg">
                  <div>
                    <p className="font-medium text-green-800 dark:text-green-200">Next Renewal</p>
                    <p className="text-sm text-green-600 dark:text-green-400">
                      Your subscription renews automatically
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-green-600 dark:text-green-400">Date</p>
                    <p className="text-sm font-medium text-green-800 dark:text-green-200">
                      {formatDate(subscription_end_date)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Platform and Login Info */}
          <div className="grid grid-cols-2 gap-4 p-3 bg-muted/30 rounded-lg">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Platform</p>
              <Badge variant="outline" className="mt-1">{platform}</Badge>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Login Method</p>
              <Badge variant="outline" className="mt-1">{login_method || 'email'}</Badge>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            {!subscribed ? (
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
            <p className="font-medium mb-3">Premium Features</p>
            <div className="space-y-2 text-sm">
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
                AI image generation for motivators
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
