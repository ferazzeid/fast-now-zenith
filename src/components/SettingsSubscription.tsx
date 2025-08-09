
import React from 'react';
import { useSubscription } from '@/hooks/useSubscription';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Crown, ExternalLink, Calendar, Clock } from 'lucide-react';
import { TrialIndicator } from './TrialIndicator';

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
    loading 
  } = useSubscription();

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
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
            Subscription
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">Loading subscription details...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <TrialIndicator />
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5" />
            Subscription
          </CardTitle>
          <CardDescription>
            Manage your subscription and billing information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Status */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Current Plan</p>
              <p className="text-sm text-muted-foreground">
                {subscribed ? 'Premium' : inTrial ? 'Free Trial' : 'Free'}
              </p>
            </div>
            <Badge variant={getStatusBadgeVariant(subscription_status)}>
              {getStatusLabel(subscription_status)}
            </Badge>
          </div>

          {/* Trial Information */}
          {inTrial && trialEndsAt && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Trial expires on {formatDate(trialEndsAt)}
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  Upgrade anytime to continue accessing premium features
                </p>
              </div>
            </div>
          )}

          {/* Subscription End Date */}
          {subscribed && subscription_end_date && (
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Next Billing Date</p>
                <p className="text-sm text-muted-foreground">
                  Your subscription will renew automatically
                </p>
              </div>
              <div className="flex items-center gap-1 text-sm">
                <Calendar className="w-4 h-4" />
                {formatDate(subscription_end_date)}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            {!subscribed ? (
              <Button 
                onClick={createSubscription}
                className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
              >
                <Crown className="w-4 h-4 mr-2" />
                Upgrade to Premium
              </Button>
            ) : (
              <Button 
                onClick={openCustomerPortal}
                variant="outline"
                className="flex-1"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Manage Subscription
              </Button>
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
