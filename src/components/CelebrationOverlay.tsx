import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface CelebrationOverlayProps {
  isVisible: boolean;
  type: 'hourly' | 'completion';
  hours: number;
  message: string;
}

export const CelebrationOverlay: React.FC<CelebrationOverlayProps> = ({
  isVisible,
  type,
  hours,
  message
}) => {
  const [animationPhase, setAnimationPhase] = useState<'enter' | 'show' | 'exit'>('enter');

  useEffect(() => {
    if (isVisible) {
      setAnimationPhase('enter');
      
      // Transition to show phase
      const showTimer = setTimeout(() => {
        setAnimationPhase('show');
      }, 200);

      // Transition to exit phase
      const exitTimer = setTimeout(() => {
        setAnimationPhase('exit');
      }, 2500);

      return () => {
        clearTimeout(showTimer);
        clearTimeout(exitTimer);
      };
    }
  }, [isVisible]);

  if (!isVisible) return null;

  const getAnimationClasses = () => {
    switch (animationPhase) {
      case 'enter':
        return 'opacity-0 scale-50 animate-scale-in';
      case 'show':
        return 'opacity-100 scale-100';
      case 'exit':
        return 'opacity-0 scale-95 animate-fade-out';
      default:
        return 'opacity-0';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      {/* Background overlay */}
      <div className={cn(
        "absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity duration-300",
        isVisible ? 'opacity-100' : 'opacity-0'
      )} />
      
      {/* Celebration content */}
      <div className={cn(
        "relative max-w-sm mx-4 p-8 rounded-2xl transition-all duration-300",
        "bg-gradient-to-br from-primary/90 to-primary-glow/90 backdrop-blur-md",
        "border border-primary/30 shadow-2xl",
        getAnimationClasses()
      )}>
        {/* Animated background effects */}
        <div className="absolute inset-0 rounded-2xl overflow-hidden">
          {/* Sparkle animation for completion */}
          {type === 'completion' && (
            <div className="absolute inset-0">
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 bg-white rounded-full animate-ping"
                  style={{
                    left: `${20 + (i % 4) * 20}%`,
                    top: `${20 + Math.floor(i / 4) * 20}%`,
                    animationDelay: `${i * 150}ms`,
                    animationDuration: '1.5s'
                  }}
                />
              ))}
            </div>
          )}
          
          {/* Ring pulse for hourly */}
          {type === 'hourly' && (
            <div className="absolute inset-4 border-2 border-white/30 rounded-full animate-pulse" />
          )}
        </div>
        
        {/* Content */}
        <div className="relative text-center text-white space-y-3">
          {/* Icon/Emoji */}
          <div className="text-4xl mb-2">
            {type === 'completion' ? '🏆' : '🎉'}
          </div>
          
          {/* Hours display */}
          <div className="text-2xl font-bold">
            {hours} Hour{hours === 1 ? '' : 's'}
          </div>
          
          {/* Message */}
          <div className="text-sm opacity-90 font-medium">
            {message}
          </div>
          
          {/* Special effects for completion */}
          {type === 'completion' && (
            <div className="text-lg font-semibold text-yellow-200 animate-bounce">
              Goal Achieved! 🌟
            </div>
          )}
        </div>
      </div>
    </div>
  );
};