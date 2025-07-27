import { useState, useEffect } from 'react';
import { Play, Square, Pause, FootprintsIcon, Clock, Activity, Zap, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

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
      {/* Dashboard Layout */}
      <div className="relative max-w-md mx-auto">
        {/* Central Timer with subtle circular design */}
        <div className="relative mb-6">
          <div className="w-48 h-48 mx-auto relative">
            {/* Subtle circular background */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-accent/10 to-accent/20 border border-accent/20">
              {/* Animated border for active state */}
              {isActive && !isPaused && (
                <div className="absolute inset-0 rounded-full border-2 border-accent/50 animate-pulse" />
              )}
              {isPaused && (
                <div className="absolute inset-0 rounded-full border-2 border-yellow-500/50 animate-pulse" />
              )}
            </div>
            
            {/* Central time display */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-center">
                <div className="text-3xl font-mono font-bold text-foreground mb-1">
                  {displayTime}
                </div>
                <div className={`text-sm font-medium transition-colors duration-300 ${
                  isActive && !isPaused ? 'text-accent' : 
                  isPaused ? 'text-yellow-500' : 'text-muted-foreground'
                }`}>
                  {isPaused ? 'Paused' : isActive ? 'Walking' : 'Ready to Walk'}
                </div>
              </div>
              
              {/* Central walking icon */}
              <FootprintsIcon className={`w-6 h-6 mt-2 transition-all duration-500 ${
                isActive && !isPaused ? 'text-accent animate-bounce' : 
                isPaused ? 'text-yellow-500' : 'text-muted-foreground'
              }`} />
            </div>
          </div>
        </div>

        {/* Metric Tiles surrounding the timer */}
        {realTimeStats && (
          <div className="grid grid-cols-2 gap-3 mb-6">
            {/* Speed Tile */}
            <Card className="p-3 bg-ceramic-base border-ceramic-rim">
              <div className="flex items-center space-x-2 mb-1">
                <Zap className="w-4 h-4 text-blue-500" />
                <span className="text-xs font-medium text-warm-text">Speed</span>
              </div>
              <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                {realTimeStats.speed} {units === 'metric' ? 'km/h' : 'mph'}
              </div>
              <div className="text-xs text-muted-foreground">
                {formatPace(realTimeStats.speed)}
              </div>
            </Card>

            {/* Distance Tile */}
            <Card className="p-3 bg-ceramic-base border-ceramic-rim">
              <div className="flex items-center space-x-2 mb-1">
                <Activity className="w-4 h-4 text-green-500" />
                <span className="text-xs font-medium text-warm-text">Distance</span>
              </div>
              <div className="text-lg font-bold text-green-600 dark:text-green-400">
                {realTimeStats.distance} {units === 'metric' ? 'km' : 'mi'}
              </div>
            </Card>

            {/* Calories Tile */}
            <Card className="p-3 bg-ceramic-base border-ceramic-rim">
              <div className="flex items-center space-x-2 mb-1">
                <Activity className="w-4 h-4 text-orange-500" />
                <span className="text-xs font-medium text-warm-text">Calories</span>
              </div>
              <div className="text-lg font-bold text-orange-600 dark:text-orange-400">
                {realTimeStats.calories}
              </div>
              <div className="text-xs text-muted-foreground">burned</div>
            </Card>

            {/* Start Time Tile */}
            <Card className="p-3 bg-ceramic-base border-ceramic-rim">
              <div className="flex items-center space-x-2 mb-1">
                <Clock className="w-4 h-4 text-purple-500" />
                <span className="text-xs font-medium text-warm-text">Started</span>
              </div>
              <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                {new Date(realTimeStats.startTime).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
            </Card>
          </div>
        )}

        {/* Animated footsteps between tiles when active */}
        {isActive && !isPaused && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(4)].map((_, i) => (
              <FootprintsIcon 
                key={i}
                className={`absolute w-3 h-3 text-accent/40 transition-all duration-1000 ${
                  stepAnimation ? 'opacity-100 scale-110' : 'opacity-20 scale-100'
                }`}
                style={{
                  top: `${20 + i * 15}%`,
                  left: `${30 + (i % 2) * 40}%`,
                  transitionDelay: `${i * 200}ms`
                }}
              />
            ))}
          </div>
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