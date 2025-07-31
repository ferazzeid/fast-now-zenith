import React, { memo, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { ClickableTooltip } from '@/components/ClickableTooltip';
import { TrendingDown, TrendingUp, Info } from 'lucide-react';

// Optimized stat display component with React.memo
interface StatDisplayProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtitle?: string;
  tooltip: string;
  className?: string;
}

export const StatDisplay = memo<StatDisplayProps>(({ 
  icon, 
  label, 
  value, 
  subtitle, 
  tooltip,
  className = '' 
}) => {
  return (
    <Card className={`p-3 bg-ceramic-base border-ceramic-rim relative ${className}`}>
      {/* Tooltip icon positioned in top-right corner */}
      <div className="absolute top-2 right-2">
        <ClickableTooltip content={tooltip}>
          <Info className="w-3 h-3 text-muted-foreground" />
        </ClickableTooltip>
      </div>
      
      <div className="flex items-center space-x-2 mb-2 pr-6">
        {icon}
        <span className="text-xs font-medium text-warm-text">{label}</span>
      </div>
      <div className="text-lg font-bold text-primary">
        {typeof value === 'number' ? value.toLocaleString() : value} cal
      </div>
      {subtitle && (
        <div className="text-xs text-muted-foreground mt-1">
          {subtitle}
        </div>
      )}
    </Card>
  );
});

StatDisplay.displayName = 'StatDisplay';

// Optimized deficit display with memo
interface DeficitDisplayProps {
  deficit: number;
  loading: boolean;
  tdee: number;
}

export const DeficitDisplay = memo<DeficitDisplayProps>(({ deficit, loading, tdee }) => {
  const { color, icon: DeficitIcon } = useMemo(() => {
    const color = deficit > 0 ? 'text-green-600 dark:text-green-400' : 
                  deficit < 0 ? 'text-red-600 dark:text-red-400' : 
                  'text-muted-foreground';
    const icon = deficit > 0 ? TrendingDown : TrendingUp;
    return { color, icon };
  }, [deficit]);

  const formattedValue = useMemo(() => {
    if (loading && deficit === 0 && tdee === 0) return '...';
    return `${Math.abs(deficit).toLocaleString()} cal`;
  }, [deficit, loading, tdee]);

  return (
    <Card className="p-4 bg-ceramic-base border-ceramic-rim relative">
      {/* Tooltip icon positioned in top-right corner */}
      <div className="absolute top-3 right-3">
        <ClickableTooltip 
          content="Your calorie deficit for today. A positive number means you're burning more than you consume (weight loss)."
        >
          <Info className="w-3 h-3 text-muted-foreground" />
        </ClickableTooltip>
      </div>
      
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center space-x-2 pr-6">
          <DeficitIcon className={`w-6 h-6 ${color}`} />
          <h3 className="text-lg font-semibold text-warm-text">Today's Deficit</h3>
        </div>
        <div className={`text-3xl font-bold ${color}`}>
          {formattedValue}
        </div>
        <p className="text-xs text-muted-foreground">
          {deficit > 0 ? 'Calorie deficit (weight loss)' : 'Calorie surplus (weight gain)'}
        </p>
      </div>
    </Card>
  );
});

DeficitDisplay.displayName = 'DeficitDisplay';