import { useEffect, useState } from 'react';

export type CeramicAnimationType = 'ring-pulse' | 'particle-burst' | 'color-wave' | 'fireworks';

interface CeramicCelebrationEffectsProps {
  isActive: boolean;
  animationType: CeramicAnimationType;
  onAnimationEnd: () => void;
}

export const CeramicCelebrationEffects = ({ isActive, animationType, onAnimationEnd }: CeramicCelebrationEffectsProps) => {
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (isActive) {
      setIsPlaying(true);
      const duration = animationType === 'fireworks' ? 3000 : animationType === 'particle-burst' ? 2500 : 2000;
      const timer = setTimeout(() => {
        setIsPlaying(false);
        onAnimationEnd();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isActive, animationType, onAnimationEnd]);

  if (!isPlaying) return null;

  const getParticleEffect = () => {
    if (animationType !== 'particle-burst') return null;
    
    return (
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-accent rounded-full animate-ping"
            style={{
              top: '50%',
              left: '50%',
              animationDelay: `${i * 0.1}s`,
              transform: `rotate(${i * 45}deg) translateY(-20px)`,
            }}
          />
        ))}
      </div>
    );
  };

  const getFireworksEffect = () => {
    if (animationType !== 'fireworks') return null;
    
    return (
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-4 bg-gradient-to-t from-primary to-accent rounded-full animate-pulse"
            style={{
              top: '50%',
              left: '50%',
              animationDelay: `${i * 0.05}s`,
              transform: `rotate(${i * 30}deg) translateY(-25px)`,
              transformOrigin: 'bottom',
            }}
          />
        ))}
      </div>
    );
  };

  const getColorWaveEffect = () => {
    if (animationType !== 'color-wave') return null;
    
    return (
      <div className="absolute inset-2 rounded-full bg-gradient-to-r from-primary via-accent to-secondary animate-spin" 
           style={{ animationDuration: '2s' }} />
    );
  };

  const getRingPulseEffect = () => {
    if (animationType !== 'ring-pulse') return null;
    
    return (
      <div className="absolute inset-0 rounded-full border-4 border-primary animate-pulse shadow-lg shadow-primary/50" />
    );
  };

  return (
    <div className="absolute inset-0 pointer-events-none">
      {getRingPulseEffect()}
      {getColorWaveEffect()}
      {getParticleEffect()}
      {getFireworksEffect()}
    </div>
  );
};