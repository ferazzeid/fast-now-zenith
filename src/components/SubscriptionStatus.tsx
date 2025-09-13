import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CreditCard, Calendar, ExternalLink, Clock, Crown } from 'lucide-react';
import { useAccess } from '@/hooks/useAccess';

export const SubscriptionStatus: React.FC = () => {
  const { 
    hasPremiumFeatures, 
    access_level,
    isTrial,
    daysRemaining,
    openCustomerPortal 
  } = useAccess();

  const getNextBillingDate = () => {
    if (isTrial && daysRemaining) {
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + daysRemaining);
      return nextDate.toLocaleDateString();
    }
    // For actual subscriptions, this would come from Stripe data
    return "N/A";
  };

  const getStatusInfo = () => {
    if (access_level === 'admin') {
      return {
        status: 'Admin Account',
        description: 'Full access to all features',
        variant: 'default' as const,
        showBilling: false
      };
    }
    
    if (hasPremiumFeatures) {
      return {
        status: 'Active Subscription',
        description: 'Premium features enabled',
        variant: 'default' as const,
        showBilling: true
      };
    }
    
    if (isTrial) {
      return {
        status: 'Free Trial',
        description: `${daysRemaining} days remaining`,
        variant: 'secondary' as const,
        showBilling: true
      };
    }
    
    return {
      status: 'Free Account',
      description: 'Limited features available',
      variant: 'outline' as const,
      showBilling: false
    };
  };

  const statusInfo = getStatusInfo();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crown className="w-5 h-5" />
          Subscription Status
        </CardTitle>
        <CardDescription>
          Your membership and feature access details
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Status */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Crown className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">{statusInfo.status}</p>
              <p className="text-sm text-muted-foreground">{statusInfo.description}</p>
            </div>
          </div>
          <Badge variant={statusInfo.variant}>
            {access_level}
          </Badge>
        </div>

        {/* Subscription Details */}
        {statusInfo.showBilling && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">Payment Method</p>
                <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/30">
                  <CreditCard className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">Stripe</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium">Next Renewal</p>
                <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/30">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{getNextBillingDate()}</span>
                </div>
              </div>
            </div>

            {/* Trial Countdown */}
            {isTrial && daysRemaining && (
              <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <p className="font-medium text-blue-800 dark:text-blue-200">Trial Period</p>
                </div>
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  Your free trial will end in {daysRemaining} day{daysRemaining !== 1 ? 's' : ''}. 
                  Upgrade to continue enjoying premium features.
                </p>
              </div>
            )}

            {/* Premium Features */}
            <div className="space-y-3">
              <p className="text-sm font-medium">Premium Features Included:</p>
              <div className="grid grid-cols-1 gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Unlimited AI voice input and chat
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Advanced food tracking with image analysis
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Comprehensive goal setting and analytics
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Priority customer support
                </div>
              </div>
            </div>

            {/* Manage Subscription */}
            {hasPremiumFeatures && (
              <Button 
                onClick={openCustomerPortal}
                variant="outline"
                className="w-full flex items-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Manage Subscription & Payment Methods
              </Button>
            )}
          </div>
        )}

        {/* Free Account Upgrade CTA */}
        {!hasPremiumFeatures && !isTrial && (
          <div className="p-4 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950 dark:to-red-950 border border-orange-200 dark:border-orange-800 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Crown className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              <p className="font-medium text-orange-800 dark:text-orange-200">Upgrade to Premium</p>
            </div>
            <p className="text-sm text-orange-600 dark:text-orange-400 mb-3">
              Unlock all premium features and get the most out of your health journey.
            </p>
            <Button size="sm" className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700">
              <Crown className="w-4 h-4 mr-2" />
              Start Premium Trial
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};