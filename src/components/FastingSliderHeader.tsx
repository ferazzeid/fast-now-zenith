import React from 'react';

interface FastingSliderHeaderProps {
  currentHour: number;
  className?: string;
  maxHour?: number; // default 72
}

export const FastingSliderHeader: React.FC<FastingSliderHeaderProps> = ({
  currentHour,
  className = '',
  maxHour = 72,
}) => {
  const clamp = (n: number) => Math.min(Math.max(n, 1), maxHour);
  const prev = clamp(currentHour - 1);
  const next = clamp(currentHour + 1);

  return (
    <div className={`w-full animate-fade-in ${className}`} aria-live="polite">
      {/* Labels */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Hour {prev}</span>
        <span className="font-medium text-primary">Hour {clamp(currentHour)}</span>
        <span className="text-muted-foreground">Hour {next}</span>
      </div>

      {/* Track + Dots */}
      <div className="relative mt-2 h-5">
        {/* Track */}
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-px bg-border" />
        {/* Minor dots (25% and 75%) */}
        <div className="absolute left-1/4 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-muted" aria-hidden="true" />
        <div className="absolute left-3/4 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-muted" aria-hidden="true" />
        {/* Current dot (center) */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-primary shadow-sm" aria-label={`Current fasting hour: ${clamp(currentHour)}`} />
      </div>
    </div>
  );
};

export default FastingSliderHeader;
