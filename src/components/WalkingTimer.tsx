import { useState, useEffect, memo, useMemo, useCallback } from 'react';
import { Play, Square, Pause, Clock, Activity, Zap, Timer, Gauge, Info, TrendingUp, X, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { WalkingMotivatorSlideshow } from './WalkingMotivatorSlideshow';
import { ClickableTooltip } from './ClickableTooltip';
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

  // PERFORMANCE: Memoize static speed mappings to prevent recreation
  const SPEED_MAPPINGS = useMemo(() => ({
    metric: [
      { displaySpeed: 3, storageSpeed: 1.9 },
      { displaySpeed: 5, storageSpeed: 3.1 },
      { displaySpeed: 6, storageSpeed: 3.7 },
      { displaySpeed: 8, storageSpeed: 5.0 }
    ],
    imperial: [
      { displaySpeed: 2, storageSpeed: 2.0 },
      { displaySpeed: 3, storageSpeed: 3.0 },
      { displaySpeed: 4, storageSpeed: 4.0 },
      { displaySpeed: 5, storageSpeed: 5.0 }
    ]
  }), []);

  // PERFORMANCE: Memoize speed conversion functions
  const storageSpeedToDisplaySpeed = useCallback((speedMph: number, units: 'metric' | 'imperial'): number => {
    const mapping = SPEED_MAPPINGS[units].find(option => 
      Math.abs(option.storageSpeed - speedMph) < 0.1
    );
    return mapping ? mapping.displaySpeed : SPEED_MAPPINGS[units][1].displaySpeed;
  }, [SPEED_MAPPINGS]);

  const displaySpeedToStorageSpeed = useCallback((displaySpeed: number, units: 'metric' | 'imperial'): number => {
    const mapping = SPEED_MAPPINGS[units].find(option => option.displaySpeed === displaySpeed);
    return mapping ? mapping.storageSpeed : SPEED_MAPPINGS[units][1].storageSpeed;
  }, [SPEED_MAPPINGS]);

  const formatPace = (speedMph: number) => {
    // Convert stored speed (MPH) to display speed for calculations
    const displaySpeed = storageSpeedToDisplaySpeed(speedMph, units);
    
    if (units === 'metric') {
      const paceMinPerKm = 60 / displaySpeed;
      const minutes = Math.floor(paceMinPerKm);
      const seconds = Math.round((paceMinPerKm - minutes) * 60);
      return `${minutes}:${seconds.toString().padStart(2, '0')}/km`;
    } else {
      const paceMinPerMile = 60 / displaySpeed;
      const minutes = Math.floor(paceMinPerMile);
      const seconds = Math.round((paceMinPerMile - minutes) * 60);
      return `${minutes}:${seconds.toString().padStart(2, '0')}/mi`;
    }
  };

  const getSpeedOptions = (units: 'metric' | 'imperial') => {
    return SPEED_MAPPINGS[units].map(option => ({
      value: option.displaySpeed,
      label: units === 'metric' ? `${option.displaySpeed} km/h` : `${option.displaySpeed} mph`
    }));
  };

  // Convert stored speed (MPH) to display speed for the select component
  const displaySpeed = storageSpeedToDisplaySpeed(selectedSpeed, units);

  return (
    <TooltipProvider>
      <div className={`relative ${className}`}>
      {/* Full width layout to match buttons */}
      <div className="w-full space-y-4">
        
        {/* Main Timer Card */}
        <Card className="p-6 text-center relative overflow-hidden">
          {/* Walking Motivator Slideshow Background */}
          {showSlideshow && isActive && !isPaused && (
            <div className="absolute inset-0 rounded-lg overflow-hidden">
              <WalkingMotivatorSlideshow 
                isActive={showSlideshow && isActive && !isPaused} 
                onModeChange={setMotivatorMode}
              />
            </div>
          )}
          
          
          {/* Main time display */}
          <div 
            className={cn(
              "mb-4 transition-opacity duration-1000 relative",
              motivatorMode === 'motivator-focused' ? 'opacity-5' : 'opacity-100'
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
              isActive && !isPaused ? 'text-primary' : 
              isPaused ? 'text-primary/70' : 'text-muted-foreground'
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

        {/* Control Buttons - positioned right after main timer card when active */}
        {isActive && (
          <div className="flex gap-2 w-full">
            {/* Pause Button - takes 1/3 width */}
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
              <TooltipContent>
                <p>{isPaused ? 'Resume walking session' : 'Pause walking session'}</p>
              </TooltipContent>
            </Tooltip>
            
            {/* Cancel Button - takes 1/3 width with blue styling */}
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
                <TooltipContent>
                  <p>Cancel walking session</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        )}

        {/* Finish Button - separate row, full width to match distance box */}
        {isActive && (
          <div className="w-full">
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
              <TooltipContent>
                <p>Complete walking session</p>
              </TooltipContent>
            </Tooltip>
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
                    <Zap className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-warm-text">Speed</span>
                    <ClickableTooltip content="Speed is estimated based on average human walking pace. You can override this in your profile settings.">
                      <Info className="w-4 h-4 text-muted-foreground" />
                    </ClickableTooltip>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${isActive && !isPaused && !isAnimationsSuspended ? 'bg-accent animate-pulse' : isActive && !isPaused ? 'bg-accent' : 'bg-muted'}`} />
                </div>
                <div className="flex items-center justify-between">
                <div className="text-xl font-bold text-primary">
                  {storageSpeedToDisplaySpeed(realTimeStats.speed, units)} <span className="text-sm font-normal text-muted-foreground">{units === 'metric' ? 'km/h' : 'mph'}</span>
                </div>
                  <Select 
                    onValueChange={(value) => {
                      const newDisplaySpeed = parseInt(value);
                      const newStorageSpeed = displaySpeedToStorageSpeed(newDisplaySpeed, units);
                      onSpeedChange(newStorageSpeed);
                    }}
                  >
                    <SelectTrigger className="h-6 w-14 text-xs bg-background border-muted">
                      <SelectValue placeholder="Set" />
                    </SelectTrigger>
                    <SelectContent className="z-50 bg-background border-border">
                      {getSpeedOptions(units).map((option) => (
                        <SelectItem 
                          key={option.value} 
                          value={option.value.toString()}
                          className="focus:bg-muted focus:text-muted-foreground hover:bg-muted hover:text-muted-foreground"
                        >
                          <span className="font-medium">{option.label}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </Card>

              <Card className="p-3 relative">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-2">
                    <Activity className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-warm-text">Distance</span>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${isActive && !isPaused && !isAnimationsSuspended ? 'bg-accent animate-pulse' : isActive && !isPaused ? 'bg-accent' : 'bg-muted'}`} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-xl font-bold text-primary">
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
                    <Activity className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-warm-text">Calories</span>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${isActive && !isPaused && !isAnimationsSuspended ? 'bg-accent animate-pulse' : isActive && !isPaused ? 'bg-accent' : 'bg-muted'}`} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-xl font-bold text-primary">
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
                    <TrendingUp className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-warm-text">Fat</span>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${isActive && !isPaused && !isAnimationsSuspended ? 'bg-accent animate-pulse' : isActive && !isPaused ? 'bg-accent' : 'bg-muted'}`} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-xl font-bold text-primary">
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