import { useState, useEffect, memo, useMemo, useCallback } from 'react';
import { Play, Square, Pause, Clock, Activity, Zap, Timer, Gauge, Info, TrendingUp, X, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { UnifiedMotivatorRotation } from './UnifiedMotivatorRotation';
import { ClickableTooltip } from './ClickableTooltip';
import { AuthorTooltip } from './AuthorTooltip';
import { useAnimationControl } from '@/components/AnimationController';
import { useToast } from '@/hooks/use-toast';


interface WalkingTimerProps {
  displayTime: string;
  isActive: boolean;
  isPaused?: boolean;
  onStart: () => void;
  onPause?: () => Promise<{ error?: { message: string } } | void>;
  onResume?: () => Promise<{ error?: { message: string } } | void>;
  onStop: () => Promise<{ error?: { message: string } } | void>;
  onCancel?: () => Promise<{ error?: { message: string } } | void>;
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
  const { isAnimationsSuspended } = useAnimationControl();
  const { toast } = useToast();

  // Simplified speed mappings - just Normal and Fast options (no units needed)
  const SPEED_OPTIONS = useMemo(() => [
    { displaySpeed: 'normal', storageSpeed: 3.1, label: 'Normal', description: 'Sustainable pace, light-moderate cardio' },
    { displaySpeed: 'fast', storageSpeed: 4.3, label: 'Fast', description: 'Intense pace, higher calorie burn' }
  ], []);

  // Find current speed option with improved matching
  const getCurrentSpeedOption = useCallback((speedMph: number) => {
    const match = SPEED_OPTIONS.find(option => 
      Math.abs(option.storageSpeed - speedMph) < 0.3
    );
    console.log('Speed matching:', { speedMph, match: match?.displaySpeed, options: SPEED_OPTIONS.map(o => ({ speed: o.storageSpeed, display: o.displaySpeed })) });
    return match || SPEED_OPTIONS[0]; // Default to normal if no match
  }, [SPEED_OPTIONS]);

  const handleSpeedChange = useCallback((value: string) => {
    console.log('Speed change requested:', value);
    const option = SPEED_OPTIONS.find(opt => opt.displaySpeed === value);
    if (option) {
      console.log('Changing speed to:', option.storageSpeed);
      onSpeedChange(option.storageSpeed);
    }
  }, [SPEED_OPTIONS, onSpeedChange]);

  const currentSpeedOption = getCurrentSpeedOption(selectedSpeed);
  
  // Use the selected speed to determine the current display value more reliably
  const currentDisplayValue = currentSpeedOption.displaySpeed;


  return (
    <TooltipProvider>
      <div className={`relative ${className}`}>
      {/* Full width layout to match buttons */}
      <div className="w-full space-y-4">
        
        {/* Main Timer Card */}
        <Card className="p-6 text-center relative overflow-hidden">
          {/* Unified motivator rotation (images + titles) */}
          {showSlideshow && isActive && !isPaused && (
            <div className="absolute inset-0 rounded-lg overflow-hidden">
              <UnifiedMotivatorRotation 
                isActive={showSlideshow && isActive && !isPaused} 
                onModeChange={setMotivatorMode}
                className="rounded-lg"
              />
            </div>
          )}
          
          
          {/* Main time display */}
          <div 
            className={cn(
              "mb-4 transition-opacity duration-1000 relative flex flex-col justify-center items-center",
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
                    onClick={async () => {
                       try {
                        const result = isPaused ? await onResume?.() : await onPause?.();
                        if (result && 'error' in result && result.error) {
                          toast({
                            title: "Error",
                            description: result.error.message || `Failed to ${isPaused ? 'resume' : 'pause'} session`,
                            variant: "destructive"
                          });
                        }
                      } catch (error) {
                        toast({
                          title: "Error",
                          description: "Network error. Please try again.",
                          variant: "destructive"
                        });
                      }
                    }}
                    variant="action-primary"
                    size="action-secondary"
                    className="flex-1"
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
                      onClick={async () => {
                         try {
                          const result = await onCancel?.();
                          if (result && 'error' in result && result.error) {
                            toast({
                              title: "Error",
                              description: result.error.message || "Failed to cancel session",
                              variant: "destructive"
                            });
                          }
                        } catch (error) {
                          toast({
                            title: "Error",
                            description: "Network error. Please try again.",
                            variant: "destructive"
                          });
                        }
                      }}
                      variant="action-primary"
                      size="action-secondary"
                      className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
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
                    onClick={async () => {
                       try {
                        const result = await onStop();
                        if (result && 'error' in result && result.error) {
                          toast({
                            title: "Error",
                            description: result.error.message || "Failed to stop session",
                            variant: "destructive"
                          });
                        }
                      } catch (error) {
                        toast({
                          title: "Error",
                          description: "Network error. Please try again.",
                          variant: "destructive"
                        });
                      }
                    }}
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
                <div className="flex items-center justify-start">
                  <Select 
                    value={currentDisplayValue}
                    onValueChange={handleSpeedChange}
                  >
                    <SelectTrigger className="h-7 w-24 text-sm bg-ceramic-base border-ceramic-rim">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="z-50 bg-ceramic-plate border-ceramic-rim backdrop-blur-sm">
                      {SPEED_OPTIONS.map((option) => (
                        <SelectItem 
                          key={option.displaySpeed} 
                          value={option.displaySpeed}
                          className="text-xs hover:bg-ceramic-base focus:bg-ceramic-base"
                        >
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                    {realTimeStats.distance}
                    <span className="text-sm font-normal text-muted-foreground ml-1">
                      {units === 'metric' ? 'km' : 'mi'}
                    </span>
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
            
            {/* Author Tooltip - positioned under the metrics */}
            <div className="flex justify-start mt-3">
              <AuthorTooltip 
                contentKey="walking_timer_health"
                content="Walking regularly helps improve cardiovascular health, builds stronger bones, and can boost your mood through the release of endorphins. Even short walks make a meaningful difference!"
                size="sm"
              />
            </div>
          </div>
        )}

        {/* Remove Progress Indicators for Goals section entirely */}
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