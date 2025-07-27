import { useState, useEffect } from 'react';
import { Play, Square, Pause, FootprintsIcon, Clock, Activity, Zap, Timer, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface WalkingTimerProps {
  displayTime: string;
  isActive: boolean;
  isPaused?: boolean;
  onStart: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onStop: () => void;
  className?: string;
  realTimeStats?: {
    speed: number;
    distance: number;
    calories: number;
    startTime: string;
    pace?: number;
  };
  units?: 'metric' | 'imperial';
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
  realTimeStats,
  units = 'imperial'
}: WalkingTimerProps) => {
  const [stepAnimation, setStepAnimation] = useState(false);

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

  return (
    <div className={`relative ${className}`}>
      {/* Vertical Stack Layout */}
      <div className="max-w-sm mx-auto space-y-4">
        
        {/* Main Timer Card */}
        <Card className="p-6 bg-ceramic-base border-ceramic-rim text-center relative overflow-hidden">
          {/* Small circular progress indicator in corner */}
          <div className="absolute top-4 right-4">
            <div className={`w-12 h-12 rounded-full border-4 transition-colors duration-300 ${
              isActive && !isPaused ? 'border-accent border-t-accent/30 animate-spin' : 
              isPaused ? 'border-yellow-500 border-t-yellow-500/30' : 'border-muted'
            }`} style={{ animationDuration: '3s' }} />
          </div>
          
          {/* Main time display */}
          <div className="mb-4">
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
          <div className="flex justify-center items-center space-x-1 mb-4">
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
            {/* Speed & Distance Row */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="p-4 bg-ceramic-base border-ceramic-rim">
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

              <Card className="p-4 bg-ceramic-base border-ceramic-rim">
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
              <Card className="p-4 bg-ceramic-base border-ceramic-rim">
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

              <Card className="p-4 bg-ceramic-base border-ceramic-rim">
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

        {/* Progress Indicators for Goals (if not in session) */}
        {!isActive && (
          <Card className="p-4 bg-ceramic-base border-ceramic-rim">
            <div className="text-center space-y-3">
              <div className="flex items-center justify-center space-x-2">
                <Target className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-warm-text">Today's Goal</span>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Aim for 30 minutes of walking</div>
                <div className="w-full bg-muted/30 rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full transition-all duration-300" style={{ width: '0%' }} />
                </div>
              </div>
            </div>
          </Card>
        )}
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
              variant="destructive"
              className="flex-1 h-14 text-lg font-medium"
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