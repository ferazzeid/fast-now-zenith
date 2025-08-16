
import React from 'react';
import { Clock, Crown } from 'lucide-react';
import { useAccess } from '@/hooks/useAccess';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export const TrialIndicator = () => {
  const { isTrial, daysRemaining, hasPremiumFeatures, createSubscription, loading } = useAccess();

  if (loading || hasPremiumFeatures || !isTrial) {
    return null;
  }

  const daysLeft = daysRemaining || 0;
  const trialExpired = daysLeft <= 0;

  const handleUpgrade = async () => {
    try {
      await createSubscription();
    } catch (error) {
      console.error('Failed to start subscription:', error);
    }
  };

  if (trialExpired) {
    return (
      <Card className="p-4 bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-red-600 dark:text-red-400" />
            <div>
              <p className="text-sm font-medium text-red-800 dark:text-red-200">
                Trial Expired
              </p>
              <p className="text-xs text-red-600 dark:text-red-400">
                Upgrade to access Food tracking and AI features
              </p>
            </div>
          </div>
          <Button 
            size="sm" 
            onClick={handleUpgrade}
            className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
          >
            <Crown className="w-4 h-4 mr-1" />
            Upgrade Now
          </Button>
        </div>
      </Card>
    );
  }

  const urgencyColor = daysLeft <= 1 ? 'yellow' : daysLeft <= 3 ? 'blue' : 'green';
  const colorClasses = {
    yellow: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800',
    blue: 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800',
    green: 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800'
  };
  
  const textColorClasses = {
    yellow: 'text-yellow-800 dark:text-yellow-200',
    blue: 'text-blue-800 dark:text-blue-200', 
    green: 'text-green-800 dark:text-green-200'
  };

  const subTextColorClasses = {
    yellow: 'text-yellow-600 dark:text-yellow-400',
    blue: 'text-blue-600 dark:text-blue-400',
    green: 'text-green-600 dark:text-green-400'
  };

  return (
    <Card className={`p-4 ${colorClasses[urgencyColor]}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className={`w-5 h-5 ${subTextColorClasses[urgencyColor]}`} />
          <div>
            <p className={`text-sm font-medium ${textColorClasses[urgencyColor]}`}>
              {daysLeft} day{daysLeft === 1 ? '' : 's'} left in trial
            </p>
            <p className={`text-xs ${subTextColorClasses[urgencyColor]}`}>
              Enjoying the premium features? Upgrade anytime!
            </p>
          </div>
        </div>
        <Button 
          size="sm" 
          variant="outline"
          onClick={handleUpgrade}
          className="border-current"
        >
          <Crown className="w-4 h-4 mr-1" />
          Upgrade
        </Button>
      </div>
    </Card>
  );
};
