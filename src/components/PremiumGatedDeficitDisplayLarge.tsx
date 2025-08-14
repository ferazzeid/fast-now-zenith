import React from 'react';
import { PremiumGate } from '@/components/PremiumGate';
import { DeficitDisplay } from '@/components/OptimizedComponents';
import { Card } from '@/components/ui/card';
import { Lock, Crown } from 'lucide-react';
import { useUnifiedSubscription } from '@/hooks/useUnifiedSubscription';

interface PremiumGatedDeficitDisplayLargeProps {
  deficit: number;
  loading: boolean;
  tdee: number;
  fatInGrams?: number;
  thirtyDayProjection?: number;
  userUnits?: 'metric' | 'imperial';
}

export const PremiumGatedDeficitDisplayLarge = ({ 
  deficit, 
  loading, 
  tdee, 
  fatInGrams, 
  thirtyDayProjection, 
  userUnits 
}: PremiumGatedDeficitDisplayLargeProps) => {
  const { hasPremiumFeatures, subscription_tier } = useUnifiedSubscription();
  const hasAccess = subscription_tier === 'admin' || hasPremiumFeatures;

  // For free users, show locked state with upgrade prompt
  if (!hasAccess) {
    return (
      <Card className="p-4 bg-card border-border relative">
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center space-x-2">
            <Lock className="w-6 h-6 text-muted-foreground" />
            <h3 className="text-lg font-semibold text-muted-foreground">Today's Deficit</h3>
          </div>
          <div className="text-3xl font-bold text-muted-foreground">
            🔒 Premium
          </div>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Deficit tracking requires premium
            </p>
            <p className="text-xs text-muted-foreground">
              Unlock detailed calorie deficit analysis, fat loss projections, and more
            </p>
          </div>
        </div>
      </Card>
    );
  }

  // For premium users, show actual deficit display
  return (
    <DeficitDisplay
      deficit={deficit}
      loading={loading}
      tdee={tdee}
      fatInGrams={fatInGrams}
      thirtyDayProjection={thirtyDayProjection}
      userUnits={userUnits}
    />
  );
};