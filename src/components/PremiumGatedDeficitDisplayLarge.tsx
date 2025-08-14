import React from 'react';
import { PremiumGate } from '@/components/PremiumGate';
import { DeficitDisplay } from '@/components/OptimizedComponents';

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
  return (
    <PremiumGate feature="Deficit Analysis" grayOutForFree={true} showUpgrade={false}>
      <DeficitDisplay
        deficit={deficit}
        loading={loading}
        tdee={tdee}
        fatInGrams={fatInGrams}
        thirtyDayProjection={thirtyDayProjection}
        userUnits={userUnits}
      />
    </PremiumGate>
  );
};