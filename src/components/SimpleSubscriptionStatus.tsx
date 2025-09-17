import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, Clock } from 'lucide-react';
import { useAccess } from '@/hooks/useAccess';

export const SimpleSubscriptionStatus: React.FC = () => {
  const { 
    hasPremiumFeatures, 
    access_level,
    isTrial,
    daysRemaining,
    openCustomerPortal 
  } = useAccess();

  const getStatusInfo = () => {
    if (access_level === 'admin') {
      return {
        status: 'Admin Account',
        description: 'Full access to all features',
        variant: 'default' as const
      };
    }
    
    if (hasPremiumFeatures) {
      return {
        status: 'Premium Active',
        description: 'All features unlocked',
        variant: 'default' as const
      };
    }
    
    if (isTrial) {
      return {
        status: 'Free Trial',
        description: `${daysRemaining} days remaining`,
        variant: 'secondary' as const
      };
    }
    
    return {
      status: 'Free Account',
      description: 'Limited features',
      variant: 'outline' as const
    };
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="space-y-4">
      {/* Current Status */}
      <div className="flex items-center justify-between p-3 border-subtle rounded-lg">
        <div>
          <p className="font-medium text-sm">{statusInfo.status}</p>
          <p className="text-xs text-muted-foreground">{statusInfo.description}</p>
        </div>
        <Badge variant={statusInfo.variant} className="text-xs">
          {access_level}
        </Badge>
      </div>

      {/* Trial Warning */}
      {isTrial && daysRemaining && (
        <div className="p-3 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-3 h-3 text-blue-600" />
            <p className="font-medium text-xs text-blue-800 dark:text-blue-200">Trial Ending Soon</p>
          </div>
          <p className="text-xs text-blue-600 dark:text-blue-400">
            {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} remaining. Upgrade to keep premium features.
          </p>
        </div>
      )}

      {/* Manage Subscription Button */}
      {(hasPremiumFeatures || isTrial) && (
        <Button 
          onClick={openCustomerPortal}
          variant="outline"
          size="sm"
          className="w-full text-xs"
        >
          <ExternalLink className="w-3 h-3 mr-1" />
          Manage Subscription
        </Button>
      )}

      {/* Upgrade CTA for Free Users */}
      {!hasPremiumFeatures && !isTrial && (
        <div className="p-3 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/50 dark:to-red-950/50 border border-orange-200 dark:border-orange-800 rounded-lg">
          <p className="font-medium text-xs text-orange-800 dark:text-orange-200 mb-2">Upgrade to Premium</p>
          <p className="text-xs text-orange-600 dark:text-orange-400 mb-2">
            Unlock unlimited AI features and advanced tracking.
          </p>
          <Button size="sm" className="w-full text-xs bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700">
            Start Premium Trial
          </Button>
        </div>
      )}
    </div>
  );
};