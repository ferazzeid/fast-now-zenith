import { memo } from 'react';
import { cn } from '@/lib/utils';

interface InlineTimerProps {
  displayTime: string;
  isVisible: boolean;
  className?: string;
}

const InlineTimerComponent = ({ 
  displayTime, 
  isVisible, 
  className = "" 
}: InlineTimerProps) => {
  if (!isVisible) return null;

  return (
    <div 
      className={cn(
        "absolute bottom-2 left-2 z-30 bg-background/80 backdrop-blur-sm rounded-md px-2 py-1 border border-border/20",
        className
      )}
    >
      <div 
        className="text-sm font-mono font-semibold text-foreground tracking-tight"
        style={{ 
          fontFeatureSettings: '"tnum" 1'
        }}
      >
        {displayTime}
      </div>
    </div>
  );
};

export const InlineTimer = memo(InlineTimerComponent);