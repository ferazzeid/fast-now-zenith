import React from 'react';
import { cn } from '@/lib/utils';

interface WeightGoalVisualProps {
  weight: number;
  unit: 'kg' | 'lbs' | 'stones';
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const WeightGoalVisual: React.FC<WeightGoalVisualProps> = ({ 
  weight, 
  unit, 
  className,
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'text-2xl px-4 py-2',
    md: 'text-4xl px-6 py-4', 
    lg: 'text-6xl px-8 py-6'
  };

  const unitLabels = {
    kg: 'kg',
    lbs: 'lbs',
    stones: 'st'
  };

  return (
    <div className={cn(
      "flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10 transition-all duration-300",
      sizeClasses[size],
      className
    )}>
      <div className="flex items-baseline gap-2">
        <span className="font-bold text-primary tabular-nums">
          {weight}
        </span>
        <span className="text-primary/70 font-semibold text-base">
          {unitLabels[unit]}
        </span>
      </div>
      <div className="text-xs text-muted-foreground mt-1 font-medium">
        Target Weight
      </div>
    </div>
  );
};