import React, { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { ClickableTooltip } from '@/components/ClickableTooltip';
import { TrendingDown, TrendingUp, Info, Flame, Calendar } from 'lucide-react';

// Optimized stat display component with React.memo
interface StatDisplayProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtitle?: string;
  tooltip?: string;
  className?: string;
}

export const StatDisplay = ({ 
  icon, 
  label, 
  value, 
  subtitle, 
  tooltip,
  className = '' 
}: StatDisplayProps) => {
  return (
    <Card className={`p-3 bg-card relative ${className}`}>
      {/* Tooltip icon positioned in top-right corner - only show if tooltip provided */}
      {tooltip && (
        <div className="absolute top-2 right-2">
          <ClickableTooltip content={tooltip}>
            <Info className="w-5 h-5 text-muted-foreground" />
          </ClickableTooltip>
        </div>
      )}
      
      <div className={`flex items-center space-x-2 mb-1 ${tooltip ? 'pr-6' : ''}`}>
        {icon}
        <span className="text-xs font-medium text-warm-text">{label}</span>
      </div>
      <div className="text-lg font-bold text-foreground">
        {typeof value === 'number' ? Math.round(value).toLocaleString() : value} cal
      </div>
      {subtitle && (
        <div className="text-xs text-muted-foreground mt-1">
          {subtitle}
        </div>
      )}
    </Card>
  );
};

// Optimized deficit display with memo
interface DeficitDisplayProps {
  deficit: number;
  loading: boolean;
  tdee: number;
  fatInGrams?: number;
  thirtyDayProjection?: number;
  userUnits?: 'metric' | 'imperial';
}

export const DeficitDisplay = ({ deficit, loading, tdee, fatInGrams, thirtyDayProjection, userUnits = 'metric' }: DeficitDisplayProps) => {
  const { color, icon: DeficitIcon } = useMemo(() => {
    const color = deficit > 0 ? 'text-accent' : 
                  deficit < 0 ? 'text-destructive' : 
                  'text-muted-foreground';
    const icon = deficit > 0 ? TrendingDown : TrendingUp;
    return { color, icon };
  }, [deficit]);

  const formattedValue = useMemo(() => {
    if (loading && deficit === 0 && tdee === 0) return '...';
    return `${Math.round(Math.abs(deficit)).toLocaleString()} cal`;
  }, [deficit, loading, tdee]);

  return (
    <Card className="p-4 bg-card">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center space-x-2">
          <DeficitIcon className={`w-6 h-6 ${color}`} />
          <h3 className="text-lg font-semibold text-warm-text">Today's Deficit</h3>
        </div>
        <div className={`text-3xl font-bold ${color}`}>
          {formattedValue}
        </div>
        <p className="text-xs text-muted-foreground">
          {deficit > 0 ? 'Calorie deficit (weight loss)' : 'Calorie surplus (weight gain)'}
        </p>
        
        {/* Additional metrics if available */}
        {fatInGrams !== undefined && thirtyDayProjection !== undefined && deficit > 0 && (
          <div className="grid grid-cols-2 gap-3 mt-3 pt-2 border-t border-subtle">
              <div className="text-center">
                <div className="flex items-center justify-center space-x-1 mb-1">
                  <Flame className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Today's Fat Loss</span>
                  <ClickableTooltip content="Fat burned today based on your current calorie deficit">
                    <Info className="w-3 h-3 text-muted-foreground" />
                  </ClickableTooltip>
                </div>
                <div className="text-sm font-semibold text-foreground">
                  {Math.round(fatInGrams)}g
                </div>
              </div>
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1 mb-1">
                <Calendar className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">30d Projection</span>
                <ClickableTooltip content="Projected weight loss if you maintain today's deficit for 30 days">
                  <Info className="w-3 h-3 text-muted-foreground" />
                </ClickableTooltip>
              </div>
              <div className="text-sm font-semibold text-foreground">
                {userUnits === 'metric' 
                  ? `${Math.round(thirtyDayProjection / 1000)}kg`
                  : `${Math.round(thirtyDayProjection / 453.592)}lbs`
                }
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};