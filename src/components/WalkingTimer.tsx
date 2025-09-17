import { useState, useEffect, memo, useMemo, useCallback } from 'react';
import { Play, Square, Pause, Clock, Activity, Zap, Timer, Gauge, Info, TrendingUp, X, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { SpeedSelectionModal } from './SpeedSelectionModal';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { UnifiedMotivatorRotation } from './UnifiedMotivatorRotation';
import { ImprovedUnifiedMotivatorRotation } from './ImprovedUnifiedMotivatorRotation';
import { ClickableTooltip } from './ClickableTooltip';
import { AuthorTooltip } from './AuthorTooltip';

import { useToast } from '@/hooks/use-toast';
import { formatDistance } from '@/utils/unitConversions';


interface WalkingTimerProps {
  displayTime: string;
  isActive: boolean;
  isPaused?: boolean;
  onStart: () => void;
  onPause?: () => Promise<void>;
  onResume?: () => Promise<void>;
  onStop: () => void;
  onCancel?: () => void;
  className?: string;
  showSlideshow?: boolean;
  realTimeStats?: {
    speed: number;
    distance: number;
    calories: number;
    startTime: string;
    pace?: number;
  };
  units?: 'metric' | 'imperial';
  selectedSpeed: number;
  onSpeedChange: (speed: number) => void;
}

const WalkingTimerComponent = ({ 
  displayTime, 
  isActive, 
  isPaused = false,
  onStart, 
  onPause,
  onResume,
  onStop, 
  onCancel,
  className = "",
  showSlideshow = false,
  realTimeStats,
  units = 'imperial',
  selectedSpeed,
  onSpeedChange
}: WalkingTimerProps) => {
  
  const [motivatorMode, setMotivatorMode] = useState<'timer-focused' | 'motivator-focused'>('timer-focused');
  const isAnimationsSuspended = false;
  const { toast } = useToast();

  // Simplified speed display logic without console spam
  const getCurrentSpeedDisplay = useCallback(() => {
    const normalSpeed = 3.1;
    const fastSpeed = 4.3;
    
    if (Math.abs(selectedSpeed - fastSpeed) < 0.3) {
      return { label: 'Fast', description: 'Intense pace, higher calorie burn' };
    } else {
      return { label: 'Normal', description: 'Sustainable pace, light-moderate cardio' };
    }
  }, [selectedSpeed]);

  const currentSpeedDisplay = getCurrentSpeedDisplay();


  return (
    <TooltipProvider>
      <div className={`relative ${className}`}>
      {/* Full width layout to match buttons */}
      <div className="w-full space-y-4">
        
        {/* Main Timer Card */}
        <Card className="p-4 text-center relative overflow-hidden min-h-[180px]">
          {/* Unified motivator rotation (images + titles) */}
          {showSlideshow && isActive && !isPaused && (
            <div className="absolute inset-0 rounded-lg overflow-hidden">
              <ImprovedUnifiedMotivatorRotation 
                isActive={showSlideshow && isActive && !isPaused} 
                onModeChange={setMotivatorMode}
                className="rounded-lg"
                quotesType="walking"
                contentDurationMs={6000}
                timerFocusDurationMs={4000}
              />
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
              isActive && !isPaused ? 'text-foreground' : 
              isPaused ? 'text-muted-foreground' : 'text-muted-foreground'
            )}>
              {isPaused ? 'Paused' : isActive ? 'Walking' : 'Ready to Walk'}
            </div>
            
            {/* Start Time - only show when active */}
            {isActive && realTimeStats && (
              <div className="flex items-center justify-center gap-2 mt-3 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>Started {new Date(realTimeStats.startTime).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}</span>
              </div>
            )}
            
          </div>

        </Card>

        {/* Control Buttons - all on same line when active */}
        {isActive && (
          <div className="flex gap-3 w-full">
            {/* Left half: Pause and Cancel buttons */}
            <div className="flex gap-2 flex-1">
              {/* Pause Button */}
              <Tooltip>
                <TooltipTrigger asChild>
                   <Button 
                     onClick={async (e) => {
                       e.preventDefault();
                       e.stopPropagation();
                       try {
                        if (isPaused && onResume) {
                          await onResume();
                        } else if (!isPaused && onPause) {
                          await onPause();
                        }
                      } catch (error) {
                        console.error('Failed to pause/resume walking session:', error);
                        // Error handling is done in parent component
                      }
                    }}
                     variant="secondary"
                     size="action-secondary"
                   className="flex-1 border border-subtle"
                  >
                    {isPaused ? (
                      <Play className="w-6 h-6" />
                    ) : (
                      <Pause className="w-6 h-6" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent collisionPadding={16}>
                  <p>{isPaused ? 'Resume' : 'Pause'}</p>
                </TooltipContent>
              </Tooltip>
              
              {/* Cancel Button */}
              {onCancel && (
                <Tooltip>
                  <TooltipTrigger asChild>
                     <Button 
                     onClick={async (e) => {
                       e.preventDefault();
                       e.stopPropagation();
                       try {
                          if (onCancel) {
                            await onCancel();
                          }
                        } catch (error) {
                          console.error('Failed to cancel walking session:', error);
                          // Error handling is done in parent component
                        }
                      }}
                      variant="secondary"
                      size="action-secondary"
                      className="flex-1 border border-subtle"
                    >
                      <X className="w-6 h-6" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent collisionPadding={16}>
                    <p>Cancel</p>
                  </TooltipContent>
                </Tooltip>
              )}
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
                  <p>Complete</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        )}

        {/* Metrics Stack */}
        {realTimeStats && (
          <div className="space-y-3">
            {/* Speed & Distance Row - Full width */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="p-3 relative">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-2">
                    <Zap className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-warm-text">Speed</span>
                    <ClickableTooltip content="Normal walking: Comfortable sustainable pace - Default. Fast walking: More intense pace for higher calorie burn. Adjust during your walk if needed.">
                      <Info className="w-4 h-4 text-muted-foreground" />
                    </ClickableTooltip>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${isActive && !isPaused && !isAnimationsSuspended ? 'bg-accent animate-pulse' : isActive && !isPaused ? 'bg-accent' : 'bg-muted'}`} />
                </div>
                <div className="flex items-center justify-between">
                  {/* Left side: Current speed display */}
                  <div className="flex-1">
                    <div className="text-lg font-bold text-foreground">
                      {currentSpeedDisplay.label}
                    </div>
                  </div>
                  
                  {/* Right side: Set button */}
                  <SpeedSelectionModal
                    selectedSpeed={selectedSpeed}
                    onSpeedChange={onSpeedChange}
                  >
                    <Button 
                      variant="secondary" 
                      size="sm"
                      className="ml-2 h-8 w-16 text-xs border border-subtle"
                    >
                      Set
                    </Button>
                  </SpeedSelectionModal>
                </div>
              </Card>

              <Card className="p-3 relative">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-2">
                    <Activity className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-warm-text">Distance</span>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${isActive && !isPaused && !isAnimationsSuspended ? 'bg-accent animate-pulse' : isActive && !isPaused ? 'bg-accent' : 'bg-muted'}`} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-xl font-bold text-foreground">
                    {formatDistance(realTimeStats.distance, units)}
                  </div>
                  <ClickableTooltip content="Distance is estimated based on your walking speed and elapsed time.">
                    <Info className="w-4 h-4 text-muted-foreground" />
                  </ClickableTooltip>
                </div>
              </Card>
            </div>

            {/* Calories & Fat Row */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="p-3 relative">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-2">
                    <Activity className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-warm-text">Calories</span>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${isActive && !isPaused && !isAnimationsSuspended ? 'bg-accent animate-pulse' : isActive && !isPaused ? 'bg-accent' : 'bg-muted'}`} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-xl font-bold text-foreground">
                    {realTimeStats.calories}
                    <span className="text-sm font-normal text-muted-foreground ml-1">cal</span>
                  </div>
                  <ClickableTooltip content="Calories are estimated based on your profile data (weight, age, etc.) and walking intensity.">
                    <Info className="w-4 h-4 text-muted-foreground" />
                  </ClickableTooltip>
                </div>
              </Card>

              <Card className="p-3 relative">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-warm-text">Fat</span>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${isActive && !isPaused && !isAnimationsSuspended ? 'bg-accent animate-pulse' : isActive && !isPaused ? 'bg-accent' : 'bg-muted'}`} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-xl font-bold text-foreground">
                    {(realTimeStats.calories / 9).toFixed(1)}
                    <span className="text-sm font-normal text-muted-foreground ml-1">g</span>
                  </div>
                  <ClickableTooltip content="Fat burned is estimated based on calories (1g fat = 9 calories).">
                    <Info className="w-4 h-4 text-muted-foreground" />
                  </ClickableTooltip>
                </div>
              </Card>
            </div>
            
          </div>
        )}

        {/* Remove Progress Indicators for Goals section entirely */}
      </div>

      {/* Start Button - only shown when not active */}
      {!isActive && (
        <div className="mt-8">
           <Button 
             onClick={(e) => {
               console.log('🚶 Walking start button clicked');
               e.preventDefault();
               e.stopPropagation();
               onStart();
             }}
             onTouchStart={(e) => {
               console.log('🚶 Walking start button touch start');
               // Prevent double-tap zoom on iOS
               e.preventDefault();
             }}
             variant="action-primary"
             size="start-button"
             className="w-full touch-manipulation"
           >
            <Play className="w-8 h-8 mr-3" />
            Start Walking
          </Button>
        </div>
      )}
    </div>
    </TooltipProvider>
  );
};

// PERFORMANCE: Memoized export to prevent unnecessary re-renders
export const WalkingTimer = memo(WalkingTimerComponent);