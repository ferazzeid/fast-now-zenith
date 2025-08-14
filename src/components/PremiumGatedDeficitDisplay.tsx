import React from 'react';
import { PremiumGate } from '@/components/PremiumGate';
import { Lock } from 'lucide-react';
import { useUnifiedSubscription } from '@/hooks/useUnifiedSubscription';

interface PremiumGatedDeficitDisplayProps {
  value: number;
  formatNumber: (num: number) => string;
  getDeficitColor: (deficit: number) => string;
  loading: boolean;
  tdee: number;
}

export const PremiumGatedDeficitDisplay = ({ 
  value, 
  formatNumber, 
  getDeficitColor, 
  loading,
  tdee 
}: PremiumGatedDeficitDisplayProps) => {
  const { hasPremiumFeatures, subscription_tier } = useUnifiedSubscription();
  const hasAccess = subscription_tier === 'admin' || hasPremiumFeatures;

  // For free users, show lock icon instead of actual values
  if (!hasAccess) {
    return (
      <div className="flex items-center space-x-1">
        <Lock className="w-3 h-3 text-muted-foreground" />
        <span className="text-sm font-bold text-muted-foreground">Premium</span>
      </div>
    );
  }

  // For premium users, show actual deficit without redundant "deficit" text
  return (
    <span className={`text-sm font-bold ${getDeficitColor(value)}`}>
      {loading && value === 0 && tdee === 0 ? '...' : `${formatNumber(value)} cal`}
    </span>
  );
};