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
  const [isVisible, setIsVisible] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Create unified list of all motivators (image + text)
  const motivatorsWithImages = motivators.filter(m => m.imageUrl);
  const motivatorsWithoutImages = motivators.filter(m => !m.imageUrl && m.title);
  
  const allMotivatorItems: MotivatorItem[] = [
    ...motivatorsWithImages.map((m, i) => ({ type: 'image' as MotivatorType, motivator: m, index: i })),
    ...motivatorsWithoutImages.map((m, i) => ({ type: 'text' as MotivatorType, motivator: m, index: i }))
  ];

  useEffect(() => {
    if (!isActive || allMotivatorItems.length === 0) {
      setIsVisible(false);
      return;
    }

    let phaseTimer: NodeJS.Timeout;
    let slideTimer: NodeJS.Timeout;
    let transitionTimer: NodeJS.Timeout;

    const startCycle = () => {
      // Start with timer-focused mode
      setDisplayMode('timer-focused');
      onModeChange?.('timer-focused');
      setIsVisible(true);
      setIsTransitioning(false);

      // Switch to motivator-focused after 4 seconds with smooth transition
      phaseTimer = setTimeout(() => {
        setIsTransitioning(true);
        setTimeout(() => {
          setDisplayMode('motivator-focused');
          onModeChange?.('motivator-focused');
          setIsTransitioning(false);
        }, 300);
      }, 4000);

      // Switch back to timer-focused and advance to next motivator after 8 more seconds
      slideTimer = setTimeout(() => {
        setIsTransitioning(true);
        setTimeout(() => {
          setDisplayMode('timer-focused');
          onModeChange?.('timer-focused');
          setIsTransitioning(false);
          
          // Advance to next motivator after timer is visible
          transitionTimer = setTimeout(() => {
            setCurrentItemIndex(prev => (prev + 1) % allMotivatorItems.length);
          }, 1500);
        }, 300);
      }, 10000);
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
      clearTimeout(slideTimer);
      clearTimeout(transitionTimer);
      clearInterval(interval);
    };
  }, [isActive, allMotivatorItems.length, transitionTime, onModeChange]);

  if (allMotivatorItems.length === 0) {
    return null;
  }

  const currentItem = allMotivatorItems[currentItemIndex];
  
  return (
    <div className={`absolute inset-0 ${className}`}>
      {/* Image Motivator Display */}
      {currentItem?.type === 'image' && (
        <div 
          className={`absolute inset-0 rounded-full overflow-hidden transition-all duration-500 ease-out ${
            isTransitioning ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
          }`}
        >
          <MotivatorImageWithFallback
            src={currentItem.motivator.imageUrl}
            alt={currentItem.motivator.title}
            className={`w-full h-full object-cover transition-all duration-700 ease-out ${
              isVisible && displayMode === 'motivator-focused' ? 'opacity-100 scale-105' : 'opacity-20 scale-100'
            }`}
          />
          {/* Centered text overlay for images */}
          {isVisible && displayMode === 'motivator-focused' && !isTransitioning && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div 
                className="text-white font-bold text-center px-4 animate-in zoom-in-95 duration-700 ease-out"
                style={{ 
                  textShadow: '2px 2px 8px rgba(0,0,0,0.9)',
                  fontSize: textSize === 'text-xs' ? '1.25rem' : '1.5rem',
                  letterSpacing: '0.5px'
                }}
              >
                {currentItem.motivator.title}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Text Motivator Display */}
      {currentItem?.type === 'text' && isVisible && displayMode === 'motivator-focused' && !isTransitioning && (
        <div 
          className="absolute inset-0 flex items-center justify-center animate-in zoom-in-95 duration-700 ease-out"
        >
          {/* Enhanced pulsating background */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 border-3 border-primary/40 rounded-full animate-pulse" 
                 style={{ animationDuration: '2s' }} />
            <div className="absolute w-36 h-36 border-2 border-primary/25 rounded-full animate-pulse" 
                 style={{ animationDuration: '2.5s', animationDelay: '0.3s' }} />
            <div className="absolute w-48 h-48 border border-primary/15 rounded-full animate-pulse" 
                 style={{ animationDuration: '3s', animationDelay: '0.6s' }} />
            {/* Gradient background for more presence */}
            <div className="absolute w-40 h-40 rounded-full bg-gradient-to-r from-primary/20 to-primary/10 animate-pulse"
                 style={{ animationDuration: '2.2s' }} />
          </div>
          
          {/* Enhanced text content */}
          <div 
            className="relative z-10 font-bold text-primary text-center px-6 leading-tight animate-in zoom-in-95 duration-700 ease-out"
            style={{ 
              textShadow: '0 4px 12px rgba(0,0,0,0.2)',
              fontSize: textSize === 'text-xs' ? '2rem' : '2.25rem',
              letterSpacing: '1px',
              transform: 'translateY(-2px)'
            }}
          >
            {currentItem.motivator.title}
          </div>
          
          {/* Additional glow effect */}
          <div 
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{
              background: 'radial-gradient(circle, hsl(var(--primary) / 0.1) 30%, transparent 70%)',
            }}
          />
        </div>
      )}
    </div>
  );
};