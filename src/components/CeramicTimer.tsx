import React from 'react';
import { cn } from '@/lib/utils';
import { MotivatorSlideshow } from './MotivatorSlideshow';

interface CeramicTimerProps {
  /** Progress value from 0 to 100 */
  progress: number;
  /** Display time text */
  displayTime: string;
  /** Whether timer is active/running */
  isActive: boolean;
  /** Whether in eating window */
  isEatingWindow?: boolean;
  /** Show motivator slideshow */
  showSlideshow?: boolean;
  /** Eating window time remaining (only shown during eating window) */
  eatingWindowTimeRemaining?: string | null;
  /** Additional className */
  className?: string;
}

export const CeramicTimer: React.FC<CeramicTimerProps> = ({
  progress,
  displayTime,
  isActive,
  isEatingWindow = false,
  showSlideshow = false,
  eatingWindowTimeRemaining = null,
  className
}) => {
  // Calculate stroke-dashoffset for progress ring
  const circumference = 2 * Math.PI * 45; // radius of 45px
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      {/* Main ceramic plate */}
      <div 
        className="relative w-80 h-80 rounded-full"
        style={{
          background: 'var(--gradient-ceramic)',
          boxShadow: 'var(--shadow-plate)',
        }}
      >
        {/* Outer rim */}
        <div 
          className="absolute inset-0 rounded-full"
          style={{
            background: 'var(--gradient-rim)',
            boxShadow: 'var(--shadow-rim)',
          }}
        />
        
        {/* Center well */}
        <div 
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-52 h-52 rounded-full flex items-center justify-center"
          style={{
            background: 'var(--gradient-well)',
            boxShadow: 'var(--shadow-well)',
          }}
        >
          {/* Motivator Slideshow - Behind everything */}
          {showSlideshow && isActive && (
            <div className="absolute inset-0 rounded-full overflow-hidden" style={{ zIndex: 1 }}>
              <MotivatorSlideshow isActive={showSlideshow && isActive} />
            </div>
          )}
          
          {/* Progress ring */}
          <svg 
            className="absolute inset-0 w-full h-full transform -rotate-90"
            viewBox="0 0 100 100"
            style={{ zIndex: 5 }}
          >
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="hsl(var(--ceramic-deep))"
              strokeWidth="2"
              opacity="0.3"
            />
            {/* Progress circle */}
            {progress > 0 && (
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke={isEatingWindow ? "#D4A855" : "hsl(var(--primary))"}
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className={cn(
                  "transition-all duration-1000 ease-out",
                  isActive && "animate-pulse"
                )}
                style={{
                  filter: isActive ? `drop-shadow(0 0 6px ${
                    isEatingWindow ? 'rgba(212, 168, 85, 0.4)' : 'hsl(var(--primary) / 0.4)'
                  })` : 'none'
                }}
              />
            )}
          </svg>
          
          {/* Timer display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ zIndex: 10 }}>
            <div className="text-center space-y-2">
              <div 
                className={cn(
                  "text-4xl font-mono font-bold tracking-wider transition-colors duration-300",
                  isActive ? "text-foreground" : "text-muted-foreground"
                )}
                style={{ 
                  textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                }}
              >
                {displayTime}
              </div>
              
              <div className={`text-lg font-medium transition-colors duration-300 ${
                isEatingWindow ? 'text-orange-600' : isActive ? 'text-accent' : 'text-muted-foreground'
              }`}>
                {isEatingWindow ? 'Eating' : isActive ? 'Fasting' : 'Ready to Fast'}
              </div>
              
              {/* Separate eating window countdown */}
              {isEatingWindow && eatingWindowTimeRemaining && (
                <div className="text-xs text-orange-600 font-medium">
                  Time left: {eatingWindowTimeRemaining}
                </div>
              )}
              
              {isActive && (
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse mx-auto" />
              )}
            </div>
          </div>
        </div>
        
        {/* Subtle highlight on rim edge */}
        <div 
          className="absolute inset-1 rounded-full pointer-events-none"
          style={{
            background: 'conic-gradient(from 45deg, transparent 0deg, hsl(0 0% 100% / 0.1) 90deg, transparent 180deg, hsl(0 0% 100% / 0.05) 270deg, transparent 360deg)',
          }}
        />
        
        {/* Inner rim detail */}
        <div 
          className="absolute rounded-full pointer-events-none"
          style={{
            top: '12%',
            left: '12%',
            right: '12%',
            bottom: '12%',
            background: 'radial-gradient(circle, transparent 60%, hsl(var(--ceramic-shadow) / 0.2) 65%, transparent 70%)',
          }}
        />
      </div>
    </div>
  );
};