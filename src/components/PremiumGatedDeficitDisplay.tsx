import React from 'react';
import { PremiumGate } from '@/components/PremiumGate';
import { Lock } from 'lucide-react';
import { useAccess } from '@/hooks/useAccess';

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
  const { hasFoodAccess, access_level, testRole, isTestingMode } = useAccess();
  
  // Use test role if in testing mode, otherwise use actual access level
  const effectiveLevel = isTestingMode ? testRole : access_level;
  const effectiveHasFoodAccess = isTestingMode ? (testRole === 'paid_user' || testRole === 'admin' || testRole === 'free_food_only' || testRole === 'free_full') : hasFoodAccess;
  
  const hasAccess = effectiveLevel === 'admin' || effectiveHasFoodAccess;

  // For free users, show lock icon instead of actual values
  if (!hasAccess) {
    return (
      <Lock className="w-3 h-3 text-muted-foreground" />
    );
  }

  // For premium users, show actual deficit without redundant "deficit" text
  return (
    <span className={`text-sm font-bold ${getDeficitColor(value)}`}>
      {loading && value === 0 && tdee === 0 ? '...' : `${formatNumber(value)} cal`}
    </span>
  );
};