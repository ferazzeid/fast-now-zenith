import React, { useState, useEffect, useRef } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  maxLife: number;
  size: number;
  type: 'confetti' | 'star' | 'circle' | 'sparkle' | 'heart' | 'crown' | 'fire';
  rotation: number;
  rotationSpeed: number;
}

interface SpectacularCelebrationSystemProps {
  isVisible: boolean;
  type: 'hourly' | 'completion';
  hours: number;
  message: string;
  onClose?: () => void;
  intensity?: number;
  enableScreenFlash?: boolean;
  enableConfetti?: boolean;
  enableFireworks?: boolean;
  enableScreenShake?: boolean;
}

export const SpectacularCelebrationSystem: React.FC<SpectacularCelebrationSystemProps> = ({
  isVisible,
  type,
  hours,
  message,
  onClose,
  intensity = 8,
  enableScreenFlash = true,
  enableConfetti = true,
  enableFireworks = true,
  enableScreenShake = true
}) => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [animationPhase, setAnimationPhase] = useState<'enter' | 'celebrate' | 'exit'>('enter');
  const [screenFlash, setScreenFlash] = useState(false);
  const [screenShake, setScreenShake] = useState(false);
  const animationRef = useRef<number>();
  const containerRef = useRef<HTMLDivElement>(null);

  const getCelebrationTier = (type: 'hourly' | 'completion', hours: number): 'minor' | 'moderate' | 'major' | 'epic' => {
    if (type === 'completion') {
      if (hours >= 168) return 'epic'; // 1 week+
      if (hours >= 72) return 'epic';  // 3+ days
      if (hours >= 48) return 'major'; // 2+ days
      if (hours >= 24) return 'major'; // 1+ day
      return 'moderate';
    }
    
    // Hourly milestones
    if (hours >= 96) return 'epic';    // 4+ days
    if (hours >= 48) return 'major';   // 2+ days
    if (hours >= 24) return 'major';   // 1+ day
    if (hours >= 12) return 'moderate'; // 12+ hours
    return 'minor';
  };

  const getCelebrationConfig = (tier: 'minor' | 'moderate' | 'major' | 'epic', intensity: number) => {
    const configs = {
      minor: { particles: 50, duration: 4000, colors: ['#ffd700', '#ff6b6b', '#4ecdc4'] },
      moderate: { particles: 100, duration: 6000, colors: ['#ffd700', '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4'] },
      major: { particles: 200, duration: 10000, colors: ['#ffd700', '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#e056fd', '#ff9f43'] },
      epic: { particles: 400, duration: 15000, colors: ['#ffd700', '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#e056fd', '#ff9f43', '#26de81', '#fd79a8'] }
    };
    
    const config = configs[tier];
    return {
      ...config,
      particles: Math.floor(config.particles * (intensity / 10)),
      duration: config.duration * (intensity / 10)
    };
  };

  const createParticles = (count: number, colors: string[]): Particle[] => {
    const newParticles: Particle[] = [];
    const particleTypes: Particle['type'][] = ['confetti', 'star', 'circle', 'sparkle', 'heart', 'crown', 'fire'];
    
    for (let i = 0; i < count; i++) {
      newParticles.push({
        id: Math.random(),
        x: Math.random() * window.innerWidth,
        y: -20,
        vx: (Math.random() - 0.5) * 4,
        vy: Math.random() * 3 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 1,
        maxLife: 1,
        size: Math.random() * 8 + 4,
        type: particleTypes[Math.floor(Math.random() * particleTypes.length)],
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10
      });
    }
    
    // Add some fireworks particles from corners if enabled
    if (enableFireworks && count > 100) {
      const fireworkOrigins = [
        { x: 50, y: window.innerHeight - 100 },
        { x: window.innerWidth - 50, y: window.innerHeight - 100 },
        { x: window.innerWidth / 2, y: window.innerHeight - 50 }
      ];
      
      fireworkOrigins.forEach(origin => {
        for (let i = 0; i < 20; i++) {
          newParticles.push({
            id: Math.random(),
            x: origin.x + (Math.random() - 0.5) * 100,
            y: origin.y,
            vx: (Math.random() - 0.5) * 8,
            vy: -Math.random() * 10 - 5,
            color: colors[Math.floor(Math.random() * colors.length)],
            life: 1,
            maxLife: 1,
            size: Math.random() * 6 + 3,
            type: 'star',
            rotation: Math.random() * 360,
            rotationSpeed: (Math.random() - 0.5) * 15
          });
        }
      });
    }
    
    return newParticles;
  };

  const triggerScreenFlash = () => {
    if (!enableScreenFlash) return;
    setScreenFlash(true);
    setTimeout(() => setScreenFlash(false), 200);
  };

  const triggerScreenShake = () => {
    if (!enableScreenShake) return;
    setScreenShake(true);
    setTimeout(() => setScreenShake(false), 600);
  };

  useEffect(() => {
    if (isVisible) {
      setAnimationPhase('enter');
      const tier = getCelebrationTier(type, hours);
      const config = getCelebrationConfig(tier, intensity);
      
      // Trigger screen effects for major celebrations
      if (tier === 'major' || tier === 'epic') {
        triggerScreenFlash();
        setTimeout(() => triggerScreenShake(), 200);
      }
      
      // Create particles
      const newParticles = enableConfetti ? createParticles(config.particles, config.colors) : [];
      setParticles(newParticles);
      
      // Phase transitions
      setTimeout(() => setAnimationPhase('celebrate'), 300);
      setTimeout(() => setAnimationPhase('exit'), config.duration - 1000);
      setTimeout(() => {
        setParticles([]);
        onClose?.();
      }, config.duration);
    } else {
      setParticles([]);
    }
  }, [isVisible, type, hours, intensity, enableConfetti, enableScreenFlash, enableFireworks, enableScreenShake]);

  // Particle animation loop
  useEffect(() => {
    if (particles.length === 0) return;

    const animate = () => {
      setParticles(prevParticles => {
        return prevParticles
          .map(particle => ({
            ...particle,
            x: particle.x + particle.vx,
            y: particle.y + particle.vy,
            vy: particle.vy + 0.2, // gravity
            life: particle.life - 0.008,
            rotation: particle.rotation + particle.rotationSpeed
          }))
          .filter(particle => particle.life > 0 && particle.y < window.innerHeight + 50);
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [particles.length > 0]);

  const getParticleShape = (particle: Particle) => {
    const opacity = particle.life;
    const transform = `translate(${particle.x}px, ${particle.y}px) rotate(${particle.rotation}deg) scale(${particle.life})`;
    
    const commonStyle = {
      position: 'absolute' as const,
      transform,
      opacity,
      pointerEvents: 'none' as const,
    };

    switch (particle.type) {
      case 'confetti':
        return (
          <div
            key={particle.id}
            style={{
              ...commonStyle,
              width: `${particle.size}px`,
              height: `${particle.size * 0.6}px`,
              backgroundColor: particle.color,
              borderRadius: '2px',
            }}
          />
        );
      case 'star':
        return (
          <div
            key={particle.id}
            style={{
              ...commonStyle,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              color: particle.color,
              fontSize: `${particle.size}px`,
            }}
          >
            ⭐
          </div>
        );
      case 'heart':
        return (
          <div
            key={particle.id}
            style={{
              ...commonStyle,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              color: particle.color,
              fontSize: `${particle.size}px`,
            }}
          >
            💖
          </div>
        );
      case 'crown':
        return (
          <div
            key={particle.id}
            style={{
              ...commonStyle,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              color: particle.color,
              fontSize: `${particle.size}px`,
            }}
          >
            👑
          </div>
        );
      case 'fire':
        return (
          <div
            key={particle.id}
            style={{
              ...commonStyle,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              color: particle.color,
              fontSize: `${particle.size}px`,
            }}
          >
            🔥
          </div>
        );
      case 'sparkle':
        return (
          <div
            key={particle.id}
            style={{
              ...commonStyle,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              backgroundColor: particle.color,
              borderRadius: '50%',
              boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`,
            }}
          />
        );
      default:
        return (
          <div
            key={particle.id}
            style={{
              ...commonStyle,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              backgroundColor: particle.color,
              borderRadius: '50%',
            }}
          />
        );
    }
  };

  const getAchievementIcon = () => {
    const tier = getCelebrationTier(type, hours);
    if (tier === 'epic') return '🏆';
    if (tier === 'major') return '🥇';
    if (tier === 'moderate') return '🎖️';
    return '⭐';
  };

  const getAchievementTitle = () => {
    const tier = getCelebrationTier(type, hours);
    if (tier === 'epic') return 'LEGENDARY ACHIEVEMENT!';
    if (tier === 'major') return 'MAJOR MILESTONE!';
    if (tier === 'moderate') return 'Great Progress!';
    return 'Milestone Reached!';
  };

  if (!isVisible) return null;

  const tier = getCelebrationTier(type, hours);
  const isEpic = tier === 'epic';
  const isMajor = tier === 'major' || tier === 'epic';

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 z-50 pointer-events-none ${
        animationPhase === 'enter' 
          ? 'animate-fade-in' 
          : animationPhase === 'exit' 
          ? 'animate-fade-out' 
          : ''
      } ${screenShake ? 'animate-pulse' : ''}`}
      style={{
        backgroundColor: screenFlash ? 'rgba(255, 255, 255, 0.3)' : 'transparent',
        transition: 'background-color 0.2s ease-out'
      }}
    >
      {/* Particle Layer */}
      <div className="absolute inset-0 overflow-hidden">
        {particles.map(particle => getParticleShape(particle))}
      </div>
      
      {/* Achievement Card Overlay */}
      <div className={`absolute inset-0 flex items-center justify-center p-4 ${
        isMajor ? 'animate-scale-in' : ''
      }`}>
        <div className={`
          bg-gradient-to-br from-primary/90 to-primary-foreground/90 
          backdrop-blur-md rounded-2xl shadow-2xl 
          border-2 border-primary/50 
          text-center text-primary-foreground
          transform transition-all duration-700
          ${isEpic ? 'p-12 max-w-2xl' : isMajor ? 'p-10 max-w-xl' : 'p-8 max-w-lg'}
          ${animationPhase === 'celebrate' ? 'scale-105' : 'scale-100'}
        `}>
          <div className={`text-6xl mb-4 ${isEpic ? 'animate-bounce' : ''}`}>
            {getAchievementIcon()}
          </div>
          
          <h2 className={`font-bold mb-4 ${
            isEpic ? 'text-4xl' : isMajor ? 'text-3xl' : 'text-2xl'
          }`}>
            {getAchievementTitle()}
          </h2>
          
          <p className={`text-primary-foreground/90 font-medium ${
            isEpic ? 'text-2xl' : isMajor ? 'text-xl' : 'text-lg'
          }`}>
            {message}
          </p>
          
          {isEpic && (
            <div className="mt-6 space-y-2">
              <div className="text-5xl">🎊 🎉 🎊</div>
              <p className="text-lg font-semibold text-primary-foreground/80">
                You are absolutely crushing it!
              </p>
            </div>
          )}
          
          {isMajor && !isEpic && (
            <div className="mt-4 text-3xl">
              🎉 ✨ 🎉
            </div>
          )}
        </div>
      </div>
    </div>
  );
};