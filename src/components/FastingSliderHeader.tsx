import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface FastingSliderHeaderProps {
  currentHour: number;
  className?: string;
  maxHour?: number; // default 72
  onHourChange?: (hour: number) => void;
}

export const FastingSliderHeader: React.FC<FastingSliderHeaderProps> = ({
  currentHour,
  className = '',
  maxHour = 72,
  onHourChange,
}) => {
  const clamp = (n: number) => Math.min(Math.max(n, 0), maxHour);
  const prev = Math.max(currentHour - 1, 0);
  const next = Math.min(currentHour + 1, maxHour);
  
  const canGoBack = currentHour > 0;
  const canGoForward = currentHour < maxHour;

  return (
    <div className={`w-full animate-fade-in ${className}`} aria-live="polite">
      {/* Navigation with arrows */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className={`transition-colors ${
              canGoBack 
                ? 'text-muted-foreground hover:text-foreground' 
                : 'text-muted-foreground/30 cursor-not-allowed'
            }`}
            onClick={() => canGoBack && onHourChange?.(prev)}
            disabled={!canGoBack}
            aria-label={`Go to previous hour ${prev}`}
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            className={`transition-colors ${
              canGoBack 
                ? 'text-muted-foreground hover:text-foreground' 
                : 'text-muted-foreground/50 cursor-not-allowed'
            }`}
            onClick={() => canGoBack && onHourChange?.(prev)}
            disabled={!canGoBack}
            aria-label={`Go to hour ${prev}`}
          >
            Hour {prev}
          </button>
        </div>
        
        <span className="font-medium text-foreground">Hour {clamp(currentHour)}</span>
        
        <div className="flex items-center gap-2">
          <button
            type="button"
            className={`transition-colors ${
              canGoForward 
                ? 'text-muted-foreground hover:text-foreground' 
                : 'text-muted-foreground/50 cursor-not-allowed'
            }`}
            onClick={() => canGoForward && onHourChange?.(next)}
            disabled={!canGoForward}
            aria-label={`Go to hour ${next}`}
          >
            Hour {next}
          </button>
          <button
            type="button"
            className={`transition-colors ${
              canGoForward 
                ? 'text-muted-foreground hover:text-foreground' 
                : 'text-muted-foreground/30 cursor-not-allowed'
            }`}
            onClick={() => canGoForward && onHourChange?.(next)}
            disabled={!canGoForward}
            aria-label={`Go to next hour ${next}`}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Track + Dot */}
      <div className="relative mt-2 h-5">
        {/* Track */}
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-px bg-border" />
        {/* Current dot (center) */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-muted-foreground shadow-sm" aria-label={`Current fasting hour: ${clamp(currentHour)}`} />
      </div>
    </div>
  );
};

export default FastingSliderHeader;
