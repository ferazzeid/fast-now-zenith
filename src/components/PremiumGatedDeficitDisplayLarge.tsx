import React from 'react';
import { PremiumGate } from '@/components/PremiumGate';
import { DeficitDisplay } from '@/components/OptimizedComponents';
import { Card } from '@/components/ui/card';
import { Lock, Crown } from 'lucide-react';
import { useAccess } from '@/hooks/useAccess';

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
  const { hasFoodAccess, access_level, testRole, isTestingMode } = useAccess();
  
  // Use test role if in testing mode, otherwise use actual access level
  const effectiveLevel = isTestingMode ? testRole : access_level;
  const effectiveHasFoodAccess = isTestingMode ? (testRole === 'paid_user' || testRole === 'admin' || testRole === 'free_food_only' || testRole === 'free_full') : hasFoodAccess;
  
  const hasAccess = effectiveLevel === 'admin' || effectiveHasFoodAccess;

  // For free users, show locked state with upgrade prompt
  if (!hasAccess) {
    return (
      <Card className="p-4 bg-card border-border relative">
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center space-x-2">
            <h3 className="text-lg font-semibold text-muted-foreground">Today's Deficit</h3>
          </div>
          <div className="text-3xl font-bold text-muted-foreground">
            <Lock className="w-8 h-8 mx-auto" />
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