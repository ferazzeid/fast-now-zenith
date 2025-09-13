import React from 'react';
import { cn } from '@/lib/utils';

interface MetaverseTimerProps {
  /** Progress value from 0 to 100 */
  progress?: number;
  /** Display time text */
  displayTime?: string;
  /** Whether timer is active/running */
  isActive?: boolean;
  /** Optional background content */
  children?: React.ReactNode;
  /** Additional className */
  className?: string;
  /** Total duration in minutes for calculating segments */
  totalMinutes?: number;
  /** Elapsed time in seconds */
  elapsedSeconds?: number;
  /** Count direction for progress calculation */
  countDirection?: 'up' | 'down';
  /** Fast type (unused but kept for compatibility) */
  fastType?: string;
  /** Goal duration in hours */
  goalDuration?: number;
  /** Show slideshow content */
  showSlideshow?: boolean;
  /** Toggle count direction callback */
  onToggleCountDirection?: () => void;
  /** Celebration animation */
  celebrationAnimation?: {
    isActive: boolean;
    type: string;
    onAnimationEnd: () => void;
  };
}

export const MetaverseTimer: React.FC<MetaverseTimerProps> = ({
  progress = 0,
  displayTime = '00:00',
  isActive = false,
  children,
  className,
  totalMinutes = 25,
  elapsedSeconds = 0
}) => {
  // Calculate which minute segment should be active
  const currentMinute = Math.floor(elapsedSeconds / 60);
  const currentSecond = elapsedSeconds % 60;
  
  // Generate minute segments (60 total)
  const segments = Array.from({ length: 60 }, (_, i) => {
    const angle = (i * 6) - 90; // 6 degrees per minute, start from top
    const isCompleted = i < currentMinute;
    const isCurrent = i === currentMinute;
    const isActive = isCompleted || isCurrent;
    
    // Calculate segment path
    const startAngle = (angle * Math.PI) / 180;
    const endAngle = ((angle + 6) * Math.PI) / 180;
    const outerRadius = 45;
    const innerRadius = 40;
    
    const x1 = 50 + outerRadius * Math.cos(startAngle);
    const y1 = 50 + outerRadius * Math.sin(startAngle);
    const x2 = 50 + outerRadius * Math.cos(endAngle);
    const y2 = 50 + outerRadius * Math.sin(endAngle);
    const x3 = 50 + innerRadius * Math.cos(endAngle);
    const y3 = 50 + innerRadius * Math.sin(endAngle);
    const x4 = 50 + innerRadius * Math.cos(startAngle);
    const y4 = 50 + innerRadius * Math.sin(startAngle);
    
    const pathData = `M ${x1} ${y1} A ${outerRadius} ${outerRadius} 0 0 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 0 0 ${x4} ${y4} Z`;
    
    return {
      path: pathData,
      isCompleted,
      isCurrent,
      isActive,
      minute: i
    };
  });

  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      {/* Main transparent plate */}
      <div className="relative w-80 h-80 rounded-full border border-metaverse-border bg-metaverse-bg backdrop-blur-sm">
        
        {/* Middle ring */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 rounded-full border border-metaverse-border bg-metaverse-bg">
          
          {/* Inner content area */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full border border-metaverse-border bg-metaverse-bg flex items-center justify-center">
            
            {/* Background content area */}
            {children && (
              <div className="absolute inset-0 rounded-full overflow-hidden">
                {children}
              </div>
            )}
            
            {/* Timer display */}
            <div className="relative z-10 text-center">
              <div className={cn(
                "text-4xl font-bold tabular-nums transition-colors duration-300",
                isActive ? "text-foreground" : "text-muted-foreground"
              )}>
                {displayTime}
              </div>
              {isActive && (
                <div className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">
                  Active
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Minute segments on outer ring */}
        <svg 
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 100 100"
        >
          {segments.map((segment, index) => (
            <path
              key={index}
              d={segment.path}
              fill={
                segment.isCompleted 
                  ? "hsl(var(--metaverse-magenta))"
                  : segment.isCurrent && isActive
                  ? "hsl(var(--metaverse-green))"
                  : "transparent"
              }
              stroke="hsl(var(--metaverse-border))"
              strokeWidth="0.5"
              className={cn(
                "transition-all duration-300",
                segment.isCurrent && isActive && "animate-pulse"
              )}
              style={{
                filter: segment.isCurrent && isActive 
                  ? 'drop-shadow(0 0 4px hsl(var(--metaverse-green) / 0.6))' 
                  : segment.isCompleted 
                  ? 'drop-shadow(0 0 2px hsl(var(--metaverse-magenta) / 0.4))'
                  : 'none'
              }}
            />
          ))}
          
          {/* Hour markers */}
          {Array.from({ length: 12 }, (_, i) => {
            const angle = (i * 30) - 90; // 30 degrees per hour marker
            const radian = (angle * Math.PI) / 180;
            const x1 = 50 + 47 * Math.cos(radian);
            const y1 = 50 + 47 * Math.sin(radian);
            const x2 = 50 + 43 * Math.cos(radian);
            const y2 = 50 + 43 * Math.sin(radian);
            
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="hsl(var(--metaverse-border))"
                strokeWidth="1"
                opacity="0.7"
              />
            );
          })}
        </svg>
        
        {/* Subtle metaverse glow */}
        {isActive && (
          <div 
            className="absolute inset-0 rounded-full pointer-events-none animate-pulse"
            style={{
              background: `conic-gradient(from 0deg, 
                hsl(var(--metaverse-magenta) / 0.1) 0deg,
                hsl(var(--metaverse-green) / 0.1) 120deg,
                hsl(var(--metaverse-magenta) / 0.1) 240deg,
                hsl(var(--metaverse-magenta) / 0.1) 360deg)`,
              animation: 'pulse 2s ease-in-out infinite'
            }}
          />
        )}
      </div>
    </div>
  );
};