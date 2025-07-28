import { useState, useEffect } from 'react';
import { Play, Square, Pause, FootprintsIcon, Clock, Activity, Zap, Timer, Gauge } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { WalkingMotivatorSlideshow } from './WalkingMotivatorSlideshow';

interface WalkingTimerProps {
  displayTime: string;
  isActive: boolean;
  isPaused?: boolean;
  onStart: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onStop: () => void;
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

export const WalkingTimer = ({ 
  displayTime, 
  isActive, 
  isPaused = false,
  onStart, 
  onPause,
  onResume,
  onStop, 
  className = "",
  showSlideshow = false,
  realTimeStats,
  units = 'imperial',
  selectedSpeed,
  onSpeedChange
}: WalkingTimerProps) => {
  const [stepAnimation, setStepAnimation] = useState(false);
  const [motivatorMode, setMotivatorMode] = useState<'timer-focused' | 'motivator-focused'>('timer-focused');

  useEffect(() => {
    if (isActive && !isPaused) {
      const interval = setInterval(() => {
        setStepAnimation(prev => !prev);
      }, 800);
      return () => clearInterval(interval);
    }
  }, [isActive, isPaused]);

  const formatPace = (speed: number) => {
    if (units === 'metric') {
      const paceMinPerKm = 60 / speed;
      const minutes = Math.floor(paceMinPerKm);
      const seconds = Math.round((paceMinPerKm - minutes) * 60);
      return `${minutes}:${seconds.toString().padStart(2, '0')}/km`;
    } else {
      const paceMinPerMile = 60 / speed;
      const minutes = Math.floor(paceMinPerMile);
      const seconds = Math.round((paceMinPerMile - minutes) * 60);
      return `${minutes}:${seconds.toString().padStart(2, '0')}/mi`;
    }
  };

  const getSpeedOptions = (units: 'metric' | 'imperial') => {
    if (units === 'metric') {
      return [
        { value: 3, label: 'Slow (3 km/h)' },
        { value: 5, label: 'Average (5 km/h)' },
        { value: 6, label: 'Brisk (6 km/h)' },
        { value: 8, label: 'Fast (8 km/h)' }
      ];
    }
    return [
      { value: 2, label: 'Slow (2 mph)' },
      { value: 3, label: 'Average (3 mph)' },
      { value: 4, label: 'Brisk (4 mph)' },
      { value: 5, label: 'Fast (5 mph)' }
    ];
  };

  return (
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
          
          {/* Speed Selector (compact, integrated) */}
          {!isActive && (
            <div className="absolute top-4 left-4" style={{ zIndex: 12 }}>
              <Select
                value={selectedSpeed.toString()}
                onValueChange={(value) => onSpeedChange(Number(value))}
              >
                <SelectTrigger className="w-32 h-8 text-xs border-muted/40 bg-background/80 backdrop-blur-sm">
                  <div className="flex items-center gap-1">
                    <Gauge className="w-3 h-3" />
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {getSpeedOptions(units).map((option) => (
                    <SelectItem key={option.value} value={option.value.toString()}>
                      <span className="text-xs">{option.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Small circular progress indicator in corner */}
          <div className="absolute top-4 right-4" style={{ zIndex: 12 }}>
            <div className={`w-12 h-12 rounded-full border-4 transition-colors duration-300 ${
              isActive && !isPaused ? 'border-accent border-t-accent/30 animate-spin' : 
              isPaused ? 'border-yellow-500 border-t-yellow-500/30' : 'border-muted'
            }`} style={{ animationDuration: '3s' }} />
          </div>
          
          {/* Main time display */}
          <div 
            className={cn(
              "mb-4 transition-opacity duration-1000 relative",
              motivatorMode === 'motivator-focused' ? 'opacity-5' : 'opacity-100'
            )}
            style={{ zIndex: 13 }}
          >
            <div 
              className="text-4xl font-mono font-semibold text-primary mb-2 tracking-wide"
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

          {/* Walking path visualization */}
          <div 
            className={cn(
              "flex justify-center items-center space-x-1 mb-4 transition-opacity duration-1000",
              motivatorMode === 'motivator-focused' ? 'opacity-10' : 'opacity-100'
            )}
            style={{ zIndex: 13 }}
          >
            {[...Array(7)].map((_, i) => (
              <FootprintsIcon 
                key={i}
                className={`w-4 h-4 transition-all duration-500 ${
                  isActive && !isPaused ? 
                    (stepAnimation && i % 2 === 0 ? 'text-accent scale-110' : 'text-accent/60') :
                    'text-muted-foreground/30'
                }`}
                style={{ 
                  transitionDelay: `${i * 100}ms`,
                  transform: i % 2 === 0 ? 'scaleY(-1)' : 'scaleY(1)'
                }}
              />
            ))}
          </div>
        </Card>

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
                  </div>
                  <div className={`w-3 h-3 rounded-full ${isActive && !isPaused ? 'bg-blue-500 animate-pulse' : 'bg-muted'}`} />
                </div>
                <div className="text-xl font-bold text-primary">
                  {realTimeStats.speed}
                  <span className="text-sm font-normal text-muted-foreground ml-1">
                    {units === 'metric' ? 'km/h' : 'mph'}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatPace(realTimeStats.speed)}
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Activity className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-warm-text">Distance</span>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${isActive && !isPaused ? 'bg-green-500 animate-pulse' : 'bg-muted'}`} />
                </div>
                <div className="text-xl font-bold text-primary">
                  {realTimeStats.distance}
                  <span className="text-sm font-normal text-muted-foreground ml-1">
                    {units === 'metric' ? 'km' : 'mi'}
                  </span>
                </div>
              </Card>
            </div>

            {/* Calories & Session Info */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Activity className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-warm-text">Calories</span>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${isActive && !isPaused ? 'bg-orange-500 animate-pulse' : 'bg-muted'}`} />
                </div>
                <div className="text-xl font-bold text-primary">
                  {realTimeStats.calories}
                  <span className="text-sm font-normal text-muted-foreground ml-1">cal</span>
                </div>
                <div className="text-xs text-muted-foreground">burned</div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-warm-text">Started</span>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${isActive && !isPaused ? 'bg-purple-500 animate-pulse' : 'bg-muted'}`} />
                </div>
                <div className="text-lg font-bold text-primary">
                  {new Date(realTimeStats.startTime).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
                <div className="text-xs text-muted-foreground">session start</div>
              </Card>
            </div>
          </div>
        )}

        {/* Remove Progress Indicators for Goals section entirely */}
      </div>

      {/* Control Buttons */}
      <div className="mt-8 space-y-3">
        {!isActive ? (
          <Button 
            onClick={onStart}
            className="w-full h-14 text-lg font-medium"
            size="lg"
          >
            <Play className="w-6 h-6 mr-2" />
            Start Walking
          </Button>
        ) : (
          <div className="flex gap-3">
            <Button 
              onClick={isPaused ? onResume : onPause}
              variant={isPaused ? "default" : "outline"}
              className="flex-1 h-14 text-lg font-medium"
              size="lg"
            >
              {isPaused ? (
                <>
                  <Play className="w-6 h-6 mr-2" />
                  Resume
                </>
              ) : (
                <>
                  <Pause className="w-6 h-6 mr-2" />
                  Pause
                </>
              )}
            </Button>
            <Button 
              onClick={onStop}
              variant="secondary"
              className="flex-1 h-14 text-lg font-medium bg-muted hover:bg-muted/80 text-muted-foreground"
              size="lg"
            >
              <Square className="w-6 h-6 mr-2" />
              Stop
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};