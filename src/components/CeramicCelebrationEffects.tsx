import { useEffect, useState } from 'react';

export type CeramicAnimationType = 'ring-pulse' | 'particle-burst' | 'color-wave' | 'fireworks';

interface CeramicCelebrationEffectsProps {
  isActive: boolean;
  animationType: CeramicAnimationType;
  onAnimationEnd: () => void;
}

export const CeramicCelebrationEffects = ({ isActive, animationType, onAnimationEnd }: CeramicCelebrationEffectsProps) => {
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
      case 'ring-pulse':
        return (
          <>
            <div 
              key={getAnimationKey()}
              className="absolute inset-0 rounded-full border-8 border-primary animate-pulse shadow-2xl shadow-primary/60" 
            />
            <div 
              className="absolute inset-4 rounded-full border-4 border-accent animate-pulse shadow-xl shadow-accent/40" 
              style={{ animationDelay: '0.5s' }} 
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-4xl font-bold text-white animate-pulse bg-ceramic-base/80 rounded-full px-6 py-3 border-2 border-white/30 backdrop-blur-sm">
                GOAL!
              </div>
            </div>
          </>
        );

      case 'particle-burst':
        return (
          <>
            <div 
              key={getAnimationKey()}
              className="absolute inset-0 rounded-full animate-bounce border-4 border-accent shadow-xl shadow-accent/50"
            />
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(8)].map((_, i) => (
                <div
                  key={`${getAnimationKey()}-particle-${i}`}
                  className="absolute w-2 h-2 bg-accent rounded-full animate-ping"
                  style={{
                    top: '50%',
                    left: '50%',
                    animationDelay: `${i * 0.1}s`,
                    transform: `rotate(${i * 45}deg) translateY(-120px)`,
                    animationDuration: '1.5s'
                  }}
                />
              ))}
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-5xl animate-bounce bg-ceramic-base/80 rounded-full px-4 py-2 border-2 border-white/30 backdrop-blur-sm">
                🎯
              </div>
            </div>
          </>
        );

      case 'color-wave':
        return (
          <>
            <div 
              key={getAnimationKey()}
              className="absolute inset-2 rounded-full bg-gradient-to-r from-primary via-accent to-secondary animate-spin border-4" 
              style={{ animationDuration: '2s' }} 
            />
            <div 
              className="absolute inset-6 rounded-full bg-gradient-to-r from-secondary via-primary to-accent animate-spin" 
              style={{ animationDuration: '1.5s', animationDirection: 'reverse' }} 
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-5xl animate-pulse bg-ceramic-base/80 rounded-full px-4 py-2 border-2 border-white/30 backdrop-blur-sm">
                ✨
              </div>
            </div>
          </>
        );

      case 'fireworks':
        return (
          <>
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(12)].map((_, i) => (
                <div
                  key={`${getAnimationKey()}-firework-${i}`}
                  className="absolute w-1 h-4 bg-gradient-to-t from-yellow-400 via-orange-500 to-red-500 rounded-full animate-pulse"
                  style={{
                    top: '50%',
                    left: '50%',
                    animationDelay: `${i * 0.1}s`,
                    transform: `rotate(${i * 30}deg) translateY(-140px)`,
                    transformOrigin: 'bottom',
                    animationDuration: '1s'
                  }}
                />
              ))}
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-5xl animate-spin bg-ceramic-base/80 rounded-full px-4 py-2 border-2 border-white/30 backdrop-blur-sm">
                🎆
              </div>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none">
      {renderAnimation()}
    </div>
  );
};