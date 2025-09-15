import { useState, memo, useCallback } from 'react';
import { Play, Clock, Activity, TrendingUp, ChevronUp, ChevronDown, CheckCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { UnifiedMotivatorRotation } from './UnifiedMotivatorRotation';
import { ClickableTooltip } from './ClickableTooltip';
import { SquareCelebrationEffects } from './SquareCelebrationEffects';

import { useToast } from '@/hooks/use-toast';

interface SquareTimerProps {
  displayTime: string;
  isActive: boolean;
  progress: number;
  onStart: () => void;
  onStop: () => void;
  onCancel: () => void;
  countDirection: 'up' | 'down';
  onToggleCountDirection: () => void;
  fastType?: 'longterm';
  goalDuration?: number;
  showSlideshow?: boolean;
  celebrationAnimation?: {
    isActive: boolean;
    type: string;
    onAnimationEnd: () => void;
  };
  className?: string;
  startTime?: string;
}

const SquareTimerComponent = ({ 
  displayTime, 
  isActive, 
  progress,
  onStart, 
  onStop, 
  onCancel,
  countDirection,
  onToggleCountDirection,
  fastType,
  goalDuration,
  showSlideshow = false,
  celebrationAnimation,
  className = "",
  startTime
}: SquareTimerProps) => {
  
  const [motivatorMode, setMotivatorMode] = useState<'timer-focused' | 'motivator-focused'>('timer-focused');
  const isAnimationsSuspended = false;
  const { toast } = useToast();

  const formatTimeFasting = useCallback((seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const getProgressStats = () => {
    if (!goalDuration || !isActive) return null;
    
    const progressPercent = Math.min(progress, 100);
    const elapsedSeconds = (goalDuration * progressPercent) / 100;
    const remainingSeconds = Math.max(0, goalDuration - elapsedSeconds);
    
    return {
      progressPercent: progressPercent.toFixed(1),
      elapsedHours: Math.floor(elapsedSeconds / 3600),
      remainingHours: Math.floor(remainingSeconds / 3600),
      nextMilestone: Math.ceil(elapsedSeconds / 3600) + 1
    };
  };

  const progressStats = getProgressStats();

  return (
    <TooltipProvider>
      <div className={`relative ${className}`}>
        {/* Full width layout to match buttons */}
        <div className="w-full space-y-4">
          
          {/* Main Timer Card with celebration effects contained within */}
          <Card className="p-4 text-center relative overflow-hidden min-h-[180px]">
            {/* Celebration Effects - constrained to timer card only */}
            {celebrationAnimation && (
              <div className="absolute inset-0 z-50 pointer-events-none rounded-lg overflow-hidden">
                <SquareCelebrationEffects
                  isActive={celebrationAnimation.isActive}
                  animationType={celebrationAnimation.type as any}
                  onAnimationEnd={celebrationAnimation.onAnimationEnd}
                />
              </div>
            )}
            {/* Unified motivator rotation (images + titles) */}
            {showSlideshow && isActive && (
              <div className="absolute inset-0 rounded-lg overflow-hidden">
                <UnifiedMotivatorRotation 
                  isActive={showSlideshow && isActive} 
                  onModeChange={setMotivatorMode}
                  className="rounded-lg"
                />
              </div>
            )}
            
            {/* Count Direction Toggle Button - only show when active */}
            {isActive && (
              <div className="absolute top-4 right-4 z-20">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={onToggleCountDirection}
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 bg-background/80 backdrop-blur-sm border border-border/50 hover:bg-background/90"
                    >
                      {countDirection === 'up' ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{countDirection === 'up' ? 'Switch to countdown' : 'Switch to count-up'}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            )}
            
            {/* Main time display */}
            <div 
              className={cn(
                "mb-2 transition-opacity duration-1000 relative flex flex-col justify-center items-center",
                motivatorMode === 'motivator-focused' ? 'opacity-0 pointer-events-none' : 'opacity-100'
              )}
              style={{ zIndex: 13 }}
            >
              <div 
                className="text-5xl font-mono font-bold text-warm-text mb-2 tracking-wide"
                style={{ 
                  fontFeatureSettings: '"tnum" 1',
                  textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                }}
              >
                {displayTime}
              </div>
              <div className={cn(
                "text-lg font-medium transition-colors duration-300",
                isActive ? 'text-foreground' : 'text-muted-foreground'
              )}>
                {isActive ? 'Fasting' : 'Ready to Fast'}
              </div>
              
              {/* Start Time - only show when active */}
              {isActive && startTime && (
                <div className="flex items-center justify-center gap-2 mt-3 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>Started {new Date(startTime).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}</span>
                </div>
              )}
              
              {/* Progress indicator for active fasts */}
              {isActive && progressStats && (
                <div className="flex items-center justify-center gap-2 mt-2 text-sm text-muted-foreground">
                  <span>{progressStats.progressPercent}% complete</span>
                </div>
              )}
            </div>
          </Card>

          {/* Control Buttons - all on same line when active */}
          {isActive && (
            <div className="flex gap-3 w-full">
              {/* Left half: Cancel button */}
              <div className="flex gap-2 flex-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      onClick={onCancel}
                      variant="secondary"
                      size="action-secondary"
                      className="flex-1 border border-muted-foreground/10"
                    >
                      <X className="w-6 h-6" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent collisionPadding={16}>
                    <p>Cancel Fast</p>
                  </TooltipContent>
                </Tooltip>
              </div>

              {/* Right half: Finish button */}
              <div className="flex-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      onClick={onStop}
                      variant="action-primary"
                      size="action-main"
                      className="w-full"
                    >
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Finish
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent collisionPadding={16}>
                    <p>Complete Fast</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          )}

        </div>

        {/* Start Button - only shown when not active */}
        {!isActive && (
          <div className="mt-8">
            <Button 
              onClick={onStart}
              variant="action-primary"
              size="start-button"
              className="w-full"
            >
              <Play className="w-8 h-8 mr-3" />
              Start Fast
            </Button>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};

// PERFORMANCE: Memoized export to prevent unnecessary re-renders
export const SquareTimer = memo(SquareTimerComponent);