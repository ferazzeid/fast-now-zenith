import { useState, useEffect } from 'react';
import { Play, Square, Pause, FootprintsIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WalkingTimerProps {
  displayTime: string;
  isActive: boolean;
  isPaused?: boolean;
  onStart: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onStop: () => void;
  className?: string;
}

export const WalkingTimer = ({ 
  displayTime, 
  isActive, 
  isPaused = false,
  onStart, 
  onPause,
  onResume,
  onStop, 
  className = "" 
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

  return (
    <div className={`relative ${className}`}>
      {/* Walking Timer Background */}
      <div className="relative w-80 h-80 mx-auto">
        {/* Outer Ring */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-accent/20 to-accent/40 shadow-lg">
          {/* Inner Walking Track */}
          <div className="absolute inset-4 rounded-full bg-gradient-to-br from-background to-muted/30 shadow-inner">
            {/* Center Circle */}
            <div className="absolute inset-8 rounded-full bg-gradient-to-br from-card to-card/80 shadow-md border border-border/50">
              
              {/* Animated Footsteps */}
              <div className="absolute inset-0 rounded-full overflow-hidden">
                {[...Array(8)].map((_, i) => (
                  <FootprintsIcon 
                    key={i}
                    className={`absolute w-4 h-4 text-accent/60 transition-all duration-800 ${
                      isActive && !isPaused && stepAnimation ? 'opacity-100 scale-110' : 'opacity-40 scale-100'
                    }`}
                    style={{
                      top: `${50 + 30 * Math.sin((i * Math.PI * 2) / 8)}%`,
                      left: `${50 + 30 * Math.cos((i * Math.PI * 2) / 8)}%`,
                      transform: `translate(-50%, -50%) rotate(${(i * 45)}deg)`,
                      transitionDelay: `${i * 100}ms`
                    }}
                  />
                ))}
              </div>

              {/* Center Content */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                {/* Main Timer Display */}
                <div className="text-center mb-2">
                  <div className="text-4xl font-mono font-bold text-foreground mb-1">
                    {displayTime}
                  </div>
                  <div className={`text-lg font-medium transition-colors duration-300 ${
                    isActive && !isPaused ? 'text-accent animate-pulse' : 
                    isPaused ? 'text-yellow-500' : 'text-muted-foreground'
                  }`}>
                    {isPaused ? 'Paused' : isActive ? 'Walking' : 'Ready to Walk'}
                  </div>
                </div>

                {/* Large Walking Icon */}
                <FootprintsIcon className={`w-8 h-8 transition-all duration-500 ${
                  isActive && !isPaused ? 'text-accent animate-bounce' : 
                  isPaused ? 'text-yellow-500' : 'text-muted-foreground'
                }`} />
              </div>
            </div>
          </div>
        </div>

        {/* Active Border Animation */}
        {isActive && !isPaused && (
          <div className="absolute inset-0 rounded-full border-2 border-accent/50 animate-pulse" />
        )}
        {/* Paused Border Animation */}
        {isPaused && (
          <div className="absolute inset-0 rounded-full border-2 border-yellow-500/50 animate-pulse" />
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