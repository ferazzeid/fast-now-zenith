import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { CircularMotivatorText } from './CircularMotivatorText';
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
  /** Count direction for toggle */
  countDirection?: 'up' | 'down';
  /** Handler for count direction toggle */
  onToggleCountDirection?: () => void;
  /** Fast type for display */
  fastType?: 'intermittent' | 'longterm';
  /** Goal duration in hours */
  goalDuration?: number;
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
  countDirection,
  onToggleCountDirection,
  fastType,
  goalDuration,
  className
}) => {
  const [motivatorMode, setMotivatorMode] = useState<'timer-focused' | 'motivator-focused'>('timer-focused');
  // Calculate stroke-dashoffset for progress ring
  const circumference = 2 * Math.PI * 45; // radius of 45px
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      {/* Circular Title Text - MOVED OUTSIDE ceramic plate structure */}
      {showSlideshow && isActive && (
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 25 }}>
          <CircularMotivatorText isActive={showSlideshow && isActive} onModeChange={setMotivatorMode} />
        </div>
      )}
      
      
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
          {/* Image Background - MOVED INSIDE center well where it belongs */}
          {showSlideshow && isActive && (
            <div className="absolute inset-0 rounded-full overflow-hidden">
              <MotivatorSlideshow isActive={showSlideshow && isActive} onModeChange={setMotivatorMode} />
            </div>
          )}
          
          {/* Progress ring - Always visible for structure */}
          <svg 
            className="absolute inset-0 w-full h-full transform -rotate-90"
            viewBox="0 0 100 100"
            style={{ zIndex: 12 }} // Higher than motivator images to stay visible
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
                className="transition-all duration-1000 ease-out"
                style={{
                  filter: isActive ? `drop-shadow(0 0 6px ${
                    isEatingWindow ? 'rgba(212, 168, 85, 0.4)' : 'hsl(var(--primary) / 0.4)'
                  })` : 'none'
                }}
              />
            )}
          </svg>
          
          {/* Timer display */}
          <div 
            className={cn(
              "absolute inset-0 flex flex-col items-center justify-center transition-opacity duration-1000",
              motivatorMode === 'motivator-focused' ? 'opacity-5' : 'opacity-100'
            )}
            style={{ zIndex: 13 }} // Above progress ring but can fade
          >
            <div className="text-center space-y-1">
              {/* Fast Type - Above timer */}
              <div className={cn(
                "text-sm font-medium transition-colors duration-300",
                isEatingWindow ? 'text-amber-600' : isActive ? 'text-primary' : 'text-muted-foreground'
              )}>
                {isEatingWindow ? 'Eating Window' : 
                 isActive && fastType ? 
                   (fastType === 'intermittent' ? 
                     `${Math.round((goalDuration || 0))}h fast / ${Math.round(24 - (goalDuration || 0))}h eat` : 
                     `${Math.round((goalDuration || 0))}h goal`) : 
                   isActive ? 'Fasting' : 'Ready to Fast'}
              </div>
              
              {/* Main Timer - Centered */}
              <div 
                className={cn(
                  "font-mono font-bold tracking-wide transition-colors duration-300",
                  isActive ? "text-4xl text-primary" : "text-3xl text-muted-foreground"
                )}
                style={{ 
                  textShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  fontFeatureSettings: '"tnum" 1'
                }}
              >
                {displayTime}
              </div>
              
              {/* Goal Display - Always show during intermittent fasting */}
              {isActive && fastType === 'intermittent' && goalDuration && (
                <div className="text-xs text-muted-foreground font-medium">
                  {Math.round(goalDuration)}h fast / {Math.round(24 - goalDuration)}h eat
                </div>
              )}
              
              {/* Progress Percentage - Show fasting progress during fast, eating progress during eating */}
              {isActive && progress > 0 && (
                <div className="text-xs text-primary/70 font-medium">
                  {Math.max(1, Math.round(progress))}% {isEatingWindow ? 'eaten' : 'fasted'}
                </div>
              )}
              
              {isActive && (
                <div className="w-2 h-2 bg-primary rounded-full mx-auto mt-2" />
              )}
            </div>
          </div>
        </div>
        
        {/* Subtle highlight on rim edge */}
        <div 
          className="absolute inset-1 rounded-full pointer-events-none"
          style={{
            zIndex: 5,
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
            zIndex: 5,
            background: 'radial-gradient(circle, transparent 60%, hsl(var(--ceramic-shadow) / 0.2) 65%, transparent 70%)',
          }}
        />
        
        {/* FIXED: Count Direction Toggle - Bottom-right corner, above SOS button, only during fasting */}
        {isActive && countDirection && onToggleCountDirection && !isEatingWindow && (
          <button
            onClick={onToggleCountDirection}
            className="absolute bottom-16 right-4 w-8 h-8 rounded-full bg-ceramic-base/80 hover:bg-ceramic-base border border-ceramic-rim flex items-center justify-center text-xs text-muted-foreground hover:text-warm-text transition-all duration-200 backdrop-blur-sm z-10"
            title={countDirection === 'up' ? 'Switch to Countdown' : 'Switch to Count Up'}
          >
            {countDirection === 'up' ? '⬇' : '⬆'}
          </button>
        )}
      </div>
    </div>
  );
};