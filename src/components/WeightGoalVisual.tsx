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
    sm: 'text-7xl px-4 py-3',
    md: 'text-9xl px-6 py-4', 
    lg: 'text-[10rem] px-8 py-6'
  };

  return (
    <div className={cn(
      "flex items-center justify-center bg-accent text-white font-bold transition-all duration-300 rounded-t-xl",
      sizeClasses[size],
      className
    )}>
      <div className="flex items-baseline gap-1">
        <span className="tabular-nums">
          {weight}
        </span>
        <span className="text-[0.4em] font-semibold">
          {unit}
        </span>
      </div>
    </div>
  );
};