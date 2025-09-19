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
    sm: 'text-3xl px-4 py-3',
    md: 'text-5xl px-6 py-4', 
    lg: 'text-7xl px-8 py-6'
  };

  return (
    <div className={cn(
      "flex items-center justify-center bg-accent text-accent-foreground font-bold transition-all duration-300 rounded-t-xl",
      sizeClasses[size],
      className
    )}>
      <div className="flex items-baseline gap-1">
        <span className="tabular-nums">
          {weight}
        </span>
        <span className="text-[0.6em] font-semibold">
          {unit}
        </span>
      </div>
    </div>
  );
};