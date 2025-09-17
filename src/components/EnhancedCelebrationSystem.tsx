import React, { useEffect, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

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
  type: 'confetti' | 'star' | 'circle' | 'sparkle';
}

interface EnhancedCelebrationSystemProps {
  isVisible: boolean;
  type: 'hourly' | 'completion';
  hours: number;
  message: string;
  onClose?: () => void;
}

export const EnhancedCelebrationSystem: React.FC<EnhancedCelebrationSystemProps> = ({
  isVisible,
  type,
  hours,
  message,
  onClose
}) => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [animationPhase, setAnimationPhase] = useState<'enter' | 'celebrate' | 'exit'>('enter');
  const [screenFlash, setScreenFlash] = useState(false);

  // Determine celebration intensity based on milestone importance
  const getCelebrationIntensity = () => {
    if (type === 'completion') return 'epic';
    if (hours >= 24) return 'epic';
    if (hours >= 12) return 'major';
    if (hours >= 4) return 'moderate';
    return 'minor';
  };

  const intensity = getCelebrationIntensity();

  // Create particles based on intensity
  const createParticles = useCallback(() => {
    const colors = [
      '#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
      '#FECA57', '#FF9FF3', '#54A0FF', '#5F27CD', '#00D2D3'
    ];
    
    const particleCount = {
      minor: 15,
      moderate: 30,
      major: 50,
      epic: 80
    }[intensity];

    const newParticles: Particle[] = [];
    
    for (let i = 0; i < particleCount; i++) {
      const types: Particle['type'][] = ['confetti', 'star', 'circle', 'sparkle'];
      
      newParticles.push({
        id: i,
        x: Math.random() * window.innerWidth,
        y: -20,
        vx: (Math.random() - 0.5) * 8,
        vy: Math.random() * 3 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 0,
        maxLife: 3000 + Math.random() * 2000,
        size: Math.random() * 8 + 4,
        type: types[Math.floor(Math.random() * types.length)]
      });
    }
    
    setParticles(newParticles);
  }, [intensity]);

  // Screen flash effect for major milestones
  const triggerScreenFlash = useCallback(() => {
    if (intensity === 'major' || intensity === 'epic') {
      setScreenFlash(true);
      setTimeout(() => setScreenFlash(false), 200);
    }
  }, [intensity]);

  // Animation lifecycle
  useEffect(() => {
    if (isVisible) {
      setAnimationPhase('enter');
      
      // Start celebration
      setTimeout(() => {
        setAnimationPhase('celebrate');
        createParticles();
        triggerScreenFlash();
      }, 300);

      // Duration based on intensity
      const duration = {
        minor: 6000,
        moderate: 8000,  
        major: 10000,
        epic: 12000
      }[intensity];

      // Exit phase
      setTimeout(() => {
        setAnimationPhase('exit');
      }, duration - 1000);

      // Complete cleanup
      setTimeout(() => {
        onClose?.();
      }, duration);
    }
  }, [isVisible, intensity, createParticles, triggerScreenFlash, onClose]);

  // Particle animation loop
  useEffect(() => {
    if (animationPhase !== 'celebrate' || particles.length === 0) return;

    const animationFrame = setInterval(() => {
      setParticles(prev => prev
        .map(particle => ({
          ...particle,
          x: particle.x + particle.vx,
          y: particle.y + particle.vy,
          vy: particle.vy + 0.1, // gravity
          life: particle.life + 16,
        }))
        .filter(particle => 
          particle.life < particle.maxLife && 
          particle.y < window.innerHeight + 50
        )
      );
    }, 16);

    return () => clearInterval(animationFrame);
  }, [animationPhase, particles.length]);

  if (!isVisible) return null;

  const getParticleShape = (particle: Particle) => {
    const opacity = 1 - (particle.life / particle.maxLife);
    const style = {
      left: particle.x,
      top: particle.y,
      width: particle.size,
      height: particle.size,
      backgroundColor: particle.color,
      opacity: opacity * 0.9,
    };

    switch (particle.type) {
      case 'confetti':
        return (
          <div
            key={particle.id}
            className="absolute transform rotate-45 rounded-sm"
            style={style}
          />
        );
      case 'star':
        return (
          <div
            key={particle.id}
            className="absolute text-yellow-400"
            style={{
              left: particle.x,
              top: particle.y,
              fontSize: particle.size,
              opacity: opacity,
            }}
          >
            ⭐
          </div>
        );
      case 'sparkle':
        return (
          <div
            key={particle.id}
            className="absolute text-white"
            style={{
              left: particle.x,
              top: particle.y,
              fontSize: particle.size,
              opacity: opacity,
            }}
          >
            ✨
          </div>
        );
      default:
        return (
          <div
            key={particle.id}
            className="absolute rounded-full"
            style={style}
          />
        );
    }
  };

  const getAchievementIcon = () => {
    if (type === 'completion') return '🏆';
    if (hours >= 24) return '👑';
    if (hours >= 12) return '🎯';
    if (hours >= 4) return '🔥';
    return '⭐';
  };

  const getAchievementTitle = () => {
    if (type === 'completion') return 'Goal Achieved!';
    if (hours >= 24) return 'Legendary Fast!';
    if (hours >= 12) return 'Major Milestone!';
    if (hours >= 4) return 'Great Progress!';
    return 'Milestone Reached!';
  };

  return (
    <>
      {/* Screen flash effect */}
      {screenFlash && (
        <div className="fixed inset-0 z-[100] bg-white/30 pointer-events-none animate-pulse" />
      )}
      
      {/* Particle layer - behind everything but above rotation */}
      <div className="fixed inset-0 z-[60] pointer-events-none overflow-hidden">
        {particles.map(getParticleShape)}
      </div>

      {/* Achievement card overlay */}
      <div 
        className="fixed inset-0 z-[70] flex items-center justify-center pointer-events-auto"
        onClick={onClose}
      >
        {/* Background overlay */}
        <div className={cn(
          "absolute inset-0 transition-all duration-500",
          animationPhase === 'enter' ? 'bg-black/0 backdrop-blur-0' : 
          animationPhase === 'celebrate' ? 'bg-black/20 backdrop-blur-sm' :
          'bg-black/0 backdrop-blur-0'
        )} />
        
        {/* Achievement card */}
        <div 
          className={cn(
            "relative max-w-md mx-4 p-8 rounded-3xl transition-all duration-700 transform",
            "bg-gradient-to-br from-primary/95 to-primary-glow/95 backdrop-blur-md",
            "border-2 border-primary/40 shadow-2xl",
            intensity === 'epic' && "animate-bounce",
            animationPhase === 'enter' && "opacity-0 scale-50 translate-y-10",
            animationPhase === 'celebrate' && "opacity-100 scale-100 translate-y-0",
            animationPhase === 'exit' && "opacity-0 scale-95 translate-y-5"
          )}
        >
          {/* Animated border rings for epic celebrations */}
          {intensity === 'epic' && (
            <>
              <div className="absolute inset-[-8px] border-4 border-primary/30 rounded-3xl animate-pulse" />
              <div className="absolute inset-[-16px] border-2 border-primary/20 rounded-3xl animate-ping" />
              <div className="absolute inset-[-24px] border border-primary/10 rounded-3xl animate-pulse" 
                   style={{ animationDelay: '0.5s' }} />
            </>
          )}

          {/* Content */}
          <div className="relative text-center text-white space-y-4">
            {/* Achievement icon */}
            <div className={cn(
              "text-6xl mb-4 filter drop-shadow-lg",
              intensity === 'epic' && "animate-bounce",
              intensity === 'major' && "animate-pulse"
            )}>
              {getAchievementIcon()}
            </div>
            
            {/* Achievement title */}
            <div className={cn(
              "text-2xl font-bold tracking-wide",
              intensity === 'epic' && "text-yellow-200 animate-pulse"
            )}>
              {getAchievementTitle()}
            </div>
            
            {/* Hours display */}
            <div className="text-4xl font-black tracking-wider">
              {hours} Hour{hours === 1 ? '' : 's'}
            </div>
            
            {/* Message */}
            <div className="text-lg opacity-90 font-medium leading-relaxed">
              {message}
            </div>
            
            {/* Progress indicator for epic milestones */}
            {intensity === 'epic' && (
              <div className="mt-6 p-3 bg-white/10 rounded-xl border border-white/20 backdrop-blur-sm">
                <div className="text-sm font-semibold text-yellow-200">
                  🌟 Exceptional Achievement! 🌟
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};