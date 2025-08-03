import React from 'react';
import { PremiumGate } from '@/components/PremiumGate';
import { DeficitAnalysisButton } from '@/components/DeficitAnalysisButton';

export const PremiumGatedDeficitAnalysis = () => {
  return (
    <PremiumGate feature="AI Analysis">
      <DeficitAnalysisButton />
    </PremiumGate>
  );
};