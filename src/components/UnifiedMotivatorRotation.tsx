import React, { useState, useEffect } from 'react';
import { useMotivators } from '@/hooks/useMotivators';
import { MotivatorImageWithFallback } from './MotivatorImageWithFallback';

interface UnifiedMotivatorRotationProps {
  isActive: boolean;
  transitionTime?: number;
  onModeChange?: (mode: 'timer-focused' | 'motivator-focused') => void;
  radius?: number;
  textSize?: string;
  className?: string;
}

type MotivatorType = 'image' | 'text';
type AnimationPhase = 'entering' | 'active' | 'exiting' | 'hidden';

interface MotivatorItem {
  type: MotivatorType;
  motivator: any;
  index: number;
}

export const UnifiedMotivatorRotation: React.FC<UnifiedMotivatorRotationProps> = ({
  isActive,
  transitionTime = 12,
  onModeChange,
  radius = 110,
  textSize = "text-xs",
  className = ""
}) => {
  const { motivators } = useMotivators();
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [displayMode, setDisplayMode] = useState<'timer-focused' | 'motivator-focused'>('timer-focused');
  const [animationPhase, setAnimationPhase] = useState<AnimationPhase>('hidden');
  const [blackMask, setBlackMask] = useState(false);

  // Create unified list of all motivators (image + text)
  const motivatorsWithImages = motivators.filter(m => m.imageUrl);
  const motivatorsWithoutImages = motivators.filter(m => !m.imageUrl && m.title);
  
  const allMotivatorItems: MotivatorItem[] = [
    ...motivatorsWithImages.map((m, i) => ({ type: 'image' as MotivatorType, motivator: m, index: i })),
    ...motivatorsWithoutImages.map((m, i) => ({ type: 'text' as MotivatorType, motivator: m, index: i }))
  ];

  // Dynamic text sizing based on length
  const getTextSize = (text: string) => {
    if (text.length > 40) return textSize === 'text-xs' ? '1.1rem' : '1.3rem';
    if (text.length > 20) return textSize === 'text-xs' ? '1.4rem' : '1.6rem';
    return textSize === 'text-xs' ? '1.8rem' : '2rem';
  };

  useEffect(() => {
    if (!isActive || allMotivatorItems.length === 0) {
      setAnimationPhase('hidden');
      setDisplayMode('timer-focused');
      onModeChange?.('timer-focused');
      return;
    }

    let phaseTimer: NodeJS.Timeout;
    let blackMaskTimer: NodeJS.Timeout;
    let nextItemTimer: NodeJS.Timeout;

    const startCycle = () => {
      // Phase 1: Show timer (3 seconds)
      setDisplayMode('timer-focused');
      onModeChange?.('timer-focused');
      setAnimationPhase('hidden');
      setBlackMask(false);

      // Phase 2: Transition to motivator with black mask (after 3 seconds)
      phaseTimer = setTimeout(() => {
        setBlackMask(true);
        
        setTimeout(() => {
          setDisplayMode('motivator-focused');
          onModeChange?.('motivator-focused');
          setAnimationPhase('entering');
          setBlackMask(false);
          
          // Phase 3: Show motivator fully (after entering animation)
          setTimeout(() => {
            setAnimationPhase('active');
          }, 600);
          
        }, 400); // Black mask duration
      }, 3000);

      // Phase 4: Exit motivator and advance to next (after 7 more seconds)
      const exitTimer = setTimeout(() => {
        setAnimationPhase('exiting');
        
        setTimeout(() => {
          setBlackMask(true);
          
          setTimeout(() => {
            setAnimationPhase('hidden');
            setBlackMask(false);
            setCurrentItemIndex(prev => (prev + 1) % allMotivatorItems.length);
          }, 400);
        }, 500);
      }, 10000);

      return () => {
        clearTimeout(exitTimer);
      };
    };

    // Initial delay to let component render
    const initialDelay = setTimeout(() => {
      startCycle();
    }, 500);

    // Main cycle interval
    const interval = setInterval(startCycle, transitionTime * 1000);

    return () => {
      clearTimeout(initialDelay);
      clearTimeout(phaseTimer);
      clearTimeout(blackMaskTimer);
      clearTimeout(nextItemTimer);
      clearInterval(interval);
    };
  }, [isActive, allMotivatorItems.length, transitionTime, onModeChange]);

  if (allMotivatorItems.length === 0) {
    return null;
  }

  const currentItem = allMotivatorItems[currentItemIndex];
  const isMotivatorVisible = displayMode === 'motivator-focused' && animationPhase !== 'hidden';
  
  return (
    <div className={`absolute inset-0 ${className}`}>
      {/* Black transition mask */}
      {blackMask && (
        <div className="absolute inset-0 bg-black rounded-full z-50 animate-in fade-in duration-400" />
      )}

      {/* Image Motivator Display */}
      {currentItem?.type === 'image' && isMotivatorVisible && (
        <div className="absolute inset-0 rounded-full overflow-hidden">
          {/* Background image with subtle zoom */}
          <MotivatorImageWithFallback
            src={currentItem.motivator.imageUrl}
            alt={currentItem.motivator.title}
            className={`w-full h-full object-cover transition-all duration-1000 ease-out ${
              animationPhase === 'entering' 
                ? 'opacity-0 scale-110' 
                : animationPhase === 'active'
                ? 'opacity-100 scale-100'
                : animationPhase === 'exiting'
                ? 'opacity-0 scale-95'
                : 'opacity-0 scale-110'
            }`}
          />
          
          {/* Dark overlay for better text contrast */}
          <div 
            className={`absolute inset-0 bg-black/40 transition-opacity duration-1000 ${
              animationPhase === 'active' ? 'opacity-100' : 'opacity-0'
            }`} 
          />
          
          {/* Text overlay with enhanced entrance */}
          <div 
            className={`absolute inset-0 flex items-center justify-center transition-all duration-1000 ease-out ${
              animationPhase === 'entering' 
                ? 'opacity-0 scale-75 translate-y-8' 
                : animationPhase === 'active'
                ? 'opacity-100 scale-100 translate-y-0'
                : animationPhase === 'exiting'
                ? 'opacity-0 scale-75 -translate-y-8'
                : 'opacity-0 scale-75 translate-y-8'
            }`}
          >
            <div 
              className="text-white font-bold text-center px-6 py-2 rounded-lg bg-black/20 backdrop-blur-sm"
              style={{ 
                textShadow: '0 4px 16px rgba(0,0,0,0.8)',
                fontSize: getTextSize(currentItem.motivator.title),
                letterSpacing: '0.5px',
                lineHeight: '1.2',
                maxWidth: '90%'
              }}
            >
              {currentItem.motivator.title}
            </div>
          </div>
        </div>
      )}

      {/* Text Motivator Display */}
      {currentItem?.type === 'text' && isMotivatorVisible && (
        <div className="absolute inset-0 flex items-center justify-center">
          {/* Animated background circles */}
          <div 
            className={`absolute inset-0 flex items-center justify-center transition-all duration-1000 ease-out ${
              animationPhase === 'entering' 
                ? 'opacity-0 scale-50' 
                : animationPhase === 'active'
                ? 'opacity-100 scale-100'
                : animationPhase === 'exiting'
                ? 'opacity-0 scale-125'
                : 'opacity-0 scale-50'
            }`}
          >
            {/* Multiple pulsating rings */}
            <div className="absolute w-20 h-20 border-2 border-primary/60 rounded-full animate-pulse" 
                 style={{ animationDuration: '2s' }} />
            <div className="absolute w-32 h-32 border border-primary/40 rounded-full animate-pulse" 
                 style={{ animationDuration: '2.5s', animationDelay: '0.3s' }} />
            <div className="absolute w-44 h-44 border border-primary/20 rounded-full animate-pulse" 
                 style={{ animationDuration: '3s', animationDelay: '0.6s' }} />
            
            {/* Central glow */}
            <div className="absolute w-24 h-24 rounded-full bg-gradient-radial from-primary/30 via-primary/10 to-transparent animate-pulse"
                 style={{ animationDuration: '2.2s' }} />
          </div>
          
          {/* Enhanced text with bounce entrance */}
          <div 
            className={`relative z-10 font-bold text-primary text-center px-8 transition-all duration-1000 ease-out ${
              animationPhase === 'entering' 
                ? 'opacity-0 scale-50 translate-y-12' 
                : animationPhase === 'active'
                ? 'opacity-100 scale-100 translate-y-0'
                : animationPhase === 'exiting'
                ? 'opacity-0 scale-50 -translate-y-12'
                : 'opacity-0 scale-50 translate-y-12'
            }`}
            style={{ 
              textShadow: '0 6px 20px rgba(0,0,0,0.3)',
              fontSize: getTextSize(currentItem.motivator.title),
              letterSpacing: '1px',
              lineHeight: '1.1',
              maxWidth: '85%',
              wordWrap: 'break-word'
            }}
          >
            {currentItem.motivator.title}
          </div>
          
          {/* Outer glow effect */}
          <div 
            className={`absolute inset-0 pointer-events-none transition-opacity duration-1000 ${
              animationPhase === 'active' ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              background: 'radial-gradient(circle, hsl(var(--primary) / 0.15) 20%, transparent 60%)',
            }}
          />
        </div>
      )}
    </div>
  );
};