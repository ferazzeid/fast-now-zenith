import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { CircularMotivatorText } from './CircularMotivatorText';
import { UnifiedMotivatorRotation } from './UnifiedMotivatorRotation';
import { CeramicCelebrationEffects, CeramicAnimationType } from './CeramicCelebrationEffects';

interface CeramicTimerProps {
  /** Progress value from 0 to 100 */
  progress: number;
  /** Display time text */
  displayTime: string;
  /** Whether timer is active/running */
  isActive: boolean;
  /** Show motivator slideshow */
  showSlideshow?: boolean;
  /** Count direction for toggle */
  countDirection?: 'up' | 'down';
  /** Handler for count direction toggle */
  onToggleCountDirection?: () => void;
  /** Fast type for display */
  fastType?: 'longterm';
  /** Goal duration in hours */
  goalDuration?: number;
  /** Additional className */
  className?: string;
  /** Celebration animation configuration */
  celebrationAnimation?: {
    isActive: boolean;
    type: CeramicAnimationType;
    onAnimationEnd: () => void;
  };
}

export const CeramicTimer: React.FC<CeramicTimerProps> = ({
  progress,
  displayTime,
  isActive,
  showSlideshow = false,
  countDirection,
  onToggleCountDirection,
  fastType,
  goalDuration,
  className,
  celebrationAnimation
}) => {
  
  const [motivatorMode, setMotivatorMode] = useState<'timer-focused' | 'motivator-focused'>('timer-focused');
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
          {/* Unified motivator rotation (images + titles) */}
          {showSlideshow && (
            <div className="absolute inset-0 rounded-full overflow-hidden">
              <UnifiedMotivatorRotation 
                isActive={isActive}
                onModeChange={setMotivatorMode}
                className="rounded-full"
              />
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
                stroke="hsl(var(--accent))"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-1000 ease-out"
                style={{
                  filter: isActive ? `drop-shadow(0 0 6px hsl(var(--accent) / 0.4))` : 'none'
                }}
              />
            )}
          </svg>
          
          {/* Timer display */}
          <div 
            className={cn(
              "absolute inset-0 flex flex-col items-center justify-center transition-opacity duration-1000",
              motivatorMode === 'motivator-focused' ? 'opacity-0 pointer-events-none' : 'opacity-100'
            )}
            style={{ zIndex: 13 }} // Above progress ring but can fade
          >
            <div className="text-center space-y-1">
              {/* Fast Type - Above timer */}
              <div className={cn(
                "text-sm font-medium transition-colors duration-300",
                isActive ? 'text-foreground' : 'text-muted-foreground'
              )}>
                {isActive ? 'Fasting' : 'Ready to Fast'}
              </div>
              
              {/* Main Timer - Centered - Fixed font size for consistency */}
               <div 
                className={cn(
                  "font-mono font-bold tracking-wide transition-colors duration-300",
                  "text-4xl", // Fixed size to prevent overflow
                  isActive ? "text-warm-text" : "text-foreground"
                )}
                style={{ 
                  textShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  fontFeatureSettings: '"tnum" 1',
                  lineHeight: '1.1', // Tighter line height to prevent overflow
                  transform: 'translateY(-4px)' // Move zeros up for better centering
                }}
              >
                 {displayTime}
              </div>
              
               {/* Goal Display - Only show during longterm fasting */}
               {isActive && fastType === 'longterm' && goalDuration && (
                 <div className="text-xs text-muted-foreground font-medium">
                   {Math.round(goalDuration)}h goal
                 </div>
               )}
              
              {/* Progress Percentage - Show fasting progress during fast, eating progress during eating */}
              {isActive && progress > 0 && (
                <div className="text-xs text-muted-foreground font-medium">
                  {Math.max(1, Math.round(progress))}%
                </div>
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
        {isActive && countDirection && onToggleCountDirection && (
          <button
            onClick={onToggleCountDirection}
            className="absolute bottom-16 right-4 w-8 h-8 rounded-full bg-ceramic-base/80 hover:bg-ceramic-base border border-ceramic-rim flex items-center justify-center text-xs text-muted-foreground hover:text-warm-text transition-all duration-200 backdrop-blur-sm z-10"
            title={countDirection === 'up' ? 'Switch to Countdown' : 'Switch to Count Up'}
          >
            {countDirection === 'up' ? '⬇' : '⬆'}
          </button>
        )}

        {/* Celebration Effects */}
        {celebrationAnimation && (
          <CeramicCelebrationEffects
            isActive={celebrationAnimation.isActive}
            animationType={celebrationAnimation.type}
            onAnimationEnd={celebrationAnimation.onAnimationEnd}
          />
        )}
      </div>
    </div>
  );
};