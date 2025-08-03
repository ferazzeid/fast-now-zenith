import { useState, useEffect } from 'react';
import { Play, Square, Pause, Clock, Activity, Zap, Timer, Gauge, Info, TrendingUp, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { WalkingMotivatorSlideshow } from './WalkingMotivatorSlideshow';
import { ClickableTooltip } from './ClickableTooltip';
import { useAnimationControl } from '@/components/AnimationController';

interface WalkingTimerProps {
  displayTime: string;
  isActive: boolean;
  isPaused?: boolean;
  onStart: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onStop: () => void;
  onCancel?: () => void;
  className?: string;
  showSlideshow?: boolean;
  realTimeStats?: {
    speed: number;
    distance: number;
    calories: number;
    steps?: number;
    startTime: string;
    pace?: number;
  };
  units?: 'metric' | 'imperial';
  selectedSpeed: number;
  onSpeedChange: (speed: number) => void;
}

export const WalkingTimer = ({ 
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

  // Static speed mappings - same as SpeedSelector
  const SPEED_MAPPINGS = {
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
  };

  // Convert storage speed to display speed using static mapping
  const storageSpeedToDisplaySpeed = (speedMph: number, units: 'metric' | 'imperial'): number => {
    const mapping = SPEED_MAPPINGS[units].find(option => 
      Math.abs(option.storageSpeed - speedMph) < 0.1
    );
    return mapping ? mapping.displaySpeed : SPEED_MAPPINGS[units][1].displaySpeed;
  };

  // Convert display speed to storage speed using static mapping
  const displaySpeedToStorageSpeed = (displaySpeed: number, units: 'metric' | 'imperial'): number => {
    const mapping = SPEED_MAPPINGS[units].find(option => option.displaySpeed === displaySpeed);
    return mapping ? mapping.storageSpeed : SPEED_MAPPINGS[units][1].storageSpeed;
  };

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
              className="text-5xl font-mono font-bold text-primary mb-2 tracking-wide"
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
            
          </div>

        </Card>

        {/* Control Buttons - positioned right after main timer card when active */}
        {isActive && (
          <div className="flex gap-2 w-full">
            <Button 
              onClick={isPaused ? onResume : onPause}
              variant={isPaused ? "default" : "outline"}
              className="flex-1 h-14 text-lg font-medium min-w-0"
              size="lg"
            >
              {isPaused ? (
                <Play className="w-6 h-6" />
              ) : (
                <Pause className="w-6 h-6" />
              )}
            </Button>
            {onCancel && (
              <Button 
                onClick={onCancel}
                variant="outline"
                className="h-14 px-4 min-w-0"
                size="lg"
              >
                <X className="w-6 h-6" />
              </Button>
            )}
            <Button 
              onClick={onStop}
              variant="secondary"
              className="flex-1 h-14 text-lg font-medium bg-muted hover:bg-muted/80 text-muted-foreground min-w-0"
              size="lg"
            >
              <Square className="w-6 h-6 mr-2" />
              Finish
            </Button>
          </div>
        )}

        {/* Metrics Stack */}
        {realTimeStats && (
          <div className="space-y-3">
            {/* Speed & Distance Row - Full width */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Zap className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-warm-text">Speed</span>
                    <ClickableTooltip content="Your current walking speed, used to calculate distance and calories">
                      <Info className="w-5 h-5 text-muted-foreground" />
                    </ClickableTooltip>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${isActive && !isPaused && !isAnimationsSuspended ? 'bg-blue-500 animate-pulse' : isActive && !isPaused ? 'bg-blue-500' : 'bg-muted'}`} />
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
                    <SelectTrigger className="h-8 w-16 text-sm bg-background border-muted">
                      <SelectValue placeholder="Set" />
                    </SelectTrigger>
                    <SelectContent className="z-50 bg-background border-border">
                      {getSpeedOptions(units).map((option) => (
                        <SelectItem key={option.value} value={option.value.toString()}>
                          <span className="font-medium">{option.label}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Activity className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-warm-text">Distance</span>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${isActive && !isPaused && !isAnimationsSuspended ? 'bg-green-500 animate-pulse' : isActive && !isPaused ? 'bg-green-500' : 'bg-muted'}`} />
                </div>
                <div className="text-xl font-bold text-primary">
                  {realTimeStats.distance}
                  <span className="text-sm font-normal text-muted-foreground ml-1">
                    {units === 'metric' ? 'km' : 'mi'}
                  </span>
                </div>
              </Card>
            </div>

            {/* Calories & Steps Row */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Activity className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-warm-text">Calories</span>
                    {realTimeStats.calories === 0 && (
                      <ClickableTooltip content="Calories calculation requires your weight, height, and age to be set in Settings">
                        <Info className="w-5 h-5 text-amber-500" />
                      </ClickableTooltip>
                    )}
                  </div>
                  <div className={`w-3 h-3 rounded-full ${isActive && !isPaused && !isAnimationsSuspended ? 'bg-orange-500 animate-pulse' : isActive && !isPaused ? 'bg-orange-500' : 'bg-muted'}`} />
                </div>
                <div className="text-xl font-bold text-primary">
                  {realTimeStats.calories}
                  <span className="text-sm font-normal text-muted-foreground ml-1">cal</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {realTimeStats.calories === 0 ? 'complete profile to calculate' : 'burned'}
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-warm-text">Steps</span>
                    <ClickableTooltip content="Estimated steps based on your height, speed, and stride length">
                      <Info className="w-5 h-5 text-muted-foreground" />
                    </ClickableTooltip>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${isActive && !isPaused && !isAnimationsSuspended ? 'bg-blue-500 animate-pulse' : isActive && !isPaused ? 'bg-blue-500' : 'bg-muted'}`} />
                </div>
                <div className="text-xl font-bold text-primary">
                  {realTimeStats.steps?.toLocaleString() || 0}
                  <span className="text-sm font-normal text-muted-foreground ml-1">steps</span>
                </div>
                <div className="text-xs text-muted-foreground">estimated</div>
              </Card>
            </div>

            {/* Session Info & Fat Burned Row */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-warm-text">Started</span>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${isActive && !isPaused && !isAnimationsSuspended ? 'bg-purple-500 animate-pulse' : isActive && !isPaused ? 'bg-purple-500' : 'bg-muted'}`} />
                </div>
                <div className="text-lg font-bold text-primary">
                  {new Date(realTimeStats.startTime).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
                <div className="text-xs text-muted-foreground">session start</div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-warm-text">Fat Burned</span>
                    <ClickableTooltip content="Estimated fat burned based on calories (1g fat = 9 calories)">
                      <Info className="w-5 h-5 text-muted-foreground" />
                    </ClickableTooltip>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${isActive && !isPaused && !isAnimationsSuspended ? 'bg-green-500 animate-pulse' : isActive && !isPaused ? 'bg-green-500' : 'bg-muted'}`} />
                </div>
                <div className="text-lg font-bold text-primary">
                  {(realTimeStats.calories / 9).toFixed(1)}
                  <span className="text-sm font-normal text-muted-foreground ml-1">g</span>
                </div>
                <div className="text-xs text-muted-foreground">estimated</div>
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
            className="w-full h-14 text-lg font-medium"
            size="lg"
          >
            <Play className="w-6 h-6 mr-2" />
            Start Walking
          </Button>
        </div>
      )}
    </div>
    </TooltipProvider>
  );
};