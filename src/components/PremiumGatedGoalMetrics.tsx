import React from 'react';
import { PremiumGate } from '@/components/PremiumGate';
import { GoalMetrics } from '@/components/GoalMetrics';

export const PremiumGatedGoalMetrics = () => {
  return (
    <PremiumGate feature="Goal Metrics" grayOutForFree={true} showUpgrade={false}>
      <GoalMetrics />
    </PremiumGate>
  );
};