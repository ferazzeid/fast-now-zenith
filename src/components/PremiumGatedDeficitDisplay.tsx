import React from 'react';
import { PremiumGate } from '@/components/PremiumGate';
import { Lock } from 'lucide-react';

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
  return (
    <PremiumGate feature="Deficit Tracking" grayOutForFree={true} showUpgrade={false}>
      <span className={`text-sm font-bold ${getDeficitColor(value)}`}>
        {loading && value === 0 && tdee === 0 ? '...' : `${formatNumber(value)} cal deficit`}
      </span>
    </PremiumGate>
  );
};