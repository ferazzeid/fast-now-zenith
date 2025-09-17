import { useEffect, useState } from 'react';

export type SquareAnimationType = 'color-wave' | 'milestone-glow' | 'completion-burst';

interface SquareCelebrationEffectsProps {
  isActive: boolean;
  animationType: SquareAnimationType;
  onAnimationEnd: () => void;
}

export const SquareCelebrationEffects = ({ isActive, animationType, onAnimationEnd }: SquareCelebrationEffectsProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentRepeat, setCurrentRepeat] = useState(0);
  const totalRepeats = 3;

  useEffect(() => {
    if (isActive) {
      setIsPlaying(true);
      setCurrentRepeat(0);
      
      // Each animation cycle is 2 seconds, repeat 3 times
      const singleCycleDuration = 2000;
      const totalDuration = singleCycleDuration * totalRepeats;
      
      const timer = setTimeout(() => {
        setIsPlaying(false);
        setCurrentRepeat(0);
        onAnimationEnd();
      }, totalDuration);
      
      // Update repeat counter every cycle
      const repeatTimer = setInterval(() => {
        setCurrentRepeat(prev => prev + 1);
      }, singleCycleDuration);
      
      return () => {
        clearTimeout(timer);
        clearInterval(repeatTimer);
      };
    }
  }, [isActive, animationType, onAnimationEnd]);

  if (!isPlaying) return null;

  const getAnimationKey = () => `${animationType}-${currentRepeat}`;

  const renderAnimation = () => {
    switch (animationType) {
      case 'color-wave':
        return (
          <>
            {/* Border glow effect */}
            <div 
              key={getAnimationKey()}
              className="absolute inset-0 rounded-lg border-4 border-primary/50 animate-pulse" 
              style={{ animationDuration: '1s' }} 
            />
            {/* Background shimmer */}
            <div 
              className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary/20 via-accent/20 to-secondary/20 animate-pulse" 
              style={{ animationDuration: '2s' }} 
            />
            {/* Center sparkle */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-4xl animate-bounce bg-background/80 rounded-full px-3 py-2 border border-primary/30 backdrop-blur-sm">
                ✨
              </div>
            </div>
          </>
        );
      
      case 'milestone-glow':
        return (
          <>
            {/* Glowing border */}
            <div 
              key={getAnimationKey()}
              className="absolute inset-0 rounded-lg border-2 border-accent animate-pulse shadow-lg shadow-accent/50" 
              style={{ animationDuration: '1.5s' }} 
            />
            {/* Subtle background glow */}
            <div 
              className="absolute inset-0 rounded-lg bg-accent/10 animate-pulse" 
              style={{ animationDuration: '2s' }} 
            />
            {/* Achievement icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-3xl animate-bounce bg-background/90 rounded-lg px-4 py-2 border border-accent/50 backdrop-blur-sm">
                🎯
              </div>
            </div>
          </>
        );
      
      case 'completion-burst':
        return (
          <>
            {/* Multiple expanding rings */}
            <div 
              key={`${getAnimationKey()}-ring1`}
              className="absolute inset-2 rounded-lg border-4 border-secondary animate-ping" 
              style={{ animationDuration: '1s' }} 
            />
            <div 
              key={`${getAnimationKey()}-ring2`}
              className="absolute inset-4 rounded-lg border-4 border-primary animate-ping" 
              style={{ animationDuration: '1.5s', animationDelay: '0.2s' }} 
            />
            {/* Radial gradient burst */}
            <div 
              className="absolute inset-0 rounded-lg bg-gradient-radial from-primary/30 via-accent/20 to-transparent animate-pulse" 
              style={{ animationDuration: '1s' }} 
            />
            {/* Victory icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-5xl animate-bounce bg-background/90 rounded-xl px-4 py-3 border-2 border-primary/50 backdrop-blur-sm shadow-lg">
                🏆
              </div>
            </div>
          </>
        );
      
      default:
        return (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-4xl animate-pulse bg-background/80 rounded-full px-3 py-2 border-subtle backdrop-blur-sm">
              ⭐
            </div>
          </div>
        );
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none rounded-lg overflow-hidden">
      {renderAnimation()}
    </div>
  );
};