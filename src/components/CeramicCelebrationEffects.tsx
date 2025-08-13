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
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute w-3 h-3 bg-accent rounded-full animate-ping"
            style={{
              top: '50%',
              left: '50%',
              animationDelay: `${i * 0.1}s`,
              transform: `rotate(${i * 30}deg) translateY(-80px)`,
              animationDuration: '1.5s'
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
        {[...Array(16)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-12 bg-gradient-to-t from-yellow-400 via-orange-500 to-red-500 rounded-full animate-bounce"
            style={{
              top: '50%',
              left: '50%',
              animationDelay: `${i * 0.1}s`,
              transform: `rotate(${i * 22.5}deg) translateY(-100px)`,
              transformOrigin: 'bottom',
              animationDuration: '1s'
            }}
          />
        ))}
      </div>
    );
  };

  const getColorWaveEffect = () => {
    if (animationType !== 'color-wave') return null;
    
    return (
      <>
        <div className="absolute inset-4 rounded-full bg-gradient-to-r from-primary via-accent to-secondary animate-spin" 
             style={{ animationDuration: '2s' }} />
        <div className="absolute inset-8 rounded-full bg-gradient-to-r from-secondary via-primary to-accent animate-spin" 
             style={{ animationDuration: '1.5s', animationDirection: 'reverse' }} />
      </>
    );
  };

  const getRingPulseEffect = () => {
    if (animationType !== 'ring-pulse') return null;
    
    return (
      <>
        <div className="absolute inset-0 rounded-full border-8 border-primary animate-pulse shadow-2xl shadow-primary/60" />
        <div className="absolute inset-4 rounded-full border-4 border-primary-glow animate-pulse shadow-xl shadow-primary-glow/40" 
             style={{ animationDelay: '0.5s' }} />
      </>
    );
  };

  const getCenterContent = () => {
    if (!isPlaying) return null;
    
    const centerClasses = "absolute inset-16 rounded-full bg-ceramic-base/90 border-4 border-white/30 flex items-center justify-center text-2xl font-bold text-white backdrop-blur-sm";
    
    switch (animationType) {
      case 'ring-pulse':
        return <div className={`${centerClasses} animate-pulse`}>GOAL!</div>;
      case 'particle-burst':
        return <div className={`${centerClasses} animate-bounce text-3xl`}>🎯</div>;
      case 'color-wave':
        return <div className={`${centerClasses} animate-pulse text-3xl`}>✨</div>;
      case 'fireworks':
        return <div className={`${centerClasses} animate-spin text-3xl`}>🎆</div>;
      default:
        return null;
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none">
      {getRingPulseEffect()}
      {getColorWaveEffect()}
      {getParticleEffect()}
      {getFireworksEffect()}
      {getCenterContent()}
    </div>
  );
};