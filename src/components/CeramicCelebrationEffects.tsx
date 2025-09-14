import { useEffect, useState } from 'react';

export type CeramicAnimationType = 'color-wave';

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
    // Only color-wave animation is used
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
  };

  return (
    <div className="absolute inset-0 pointer-events-none">
      {renderAnimation()}
    </div>
  );
};