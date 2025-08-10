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

    const startCycle = () => {
      // Start with timer-focused mode
      setDisplayMode('timer-focused');
      onModeChange?.('timer-focused');
      setIsVisible(true);

      // Switch to motivator-focused after 4 seconds
      phaseTimer = setTimeout(() => {
        setDisplayMode('motivator-focused');
        onModeChange?.('motivator-focused');
      }, 4000);

      // Switch back to timer-focused and advance to next motivator after 8 more seconds
      slideTimer = setTimeout(() => {
        setDisplayMode('timer-focused');
        onModeChange?.('timer-focused');
        setTimeout(() => {
          setCurrentItemIndex(prev => (prev + 1) % allMotivatorItems.length);
        }, 1000);
      }, 12000);
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
        <div className="absolute inset-0 rounded-full overflow-hidden">
          <MotivatorImageWithFallback
            src={currentItem.motivator.imageUrl}
            alt={currentItem.motivator.title}
            className={`w-full h-full object-cover transition-opacity duration-1000 ${
              isVisible && displayMode === 'motivator-focused' ? 'opacity-100' : 'opacity-20'
            }`}
          />
          {/* Centered text overlay for images */}
          {isVisible && displayMode === 'motivator-focused' && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div 
                className="text-white font-bold text-center px-4 animate-in zoom-in duration-1000"
                style={{ 
                  textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                  fontSize: textSize === 'text-xs' ? '0.75rem' : '0.875rem'
                }}
              >
                {currentItem.motivator.title}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Text Motivator Display */}
      {currentItem?.type === 'text' && isVisible && displayMode === 'motivator-focused' && (
        <div className="absolute inset-0 flex items-center justify-center">
          {/* Pulsating circles */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 border-2 border-primary/30 rounded-full animate-pulse" />
            <div className="absolute w-32 h-32 border border-primary/20 rounded-full animate-pulse delay-300" />
            <div className="absolute w-44 h-44 border border-primary/10 rounded-full animate-pulse delay-700" />
          </div>
          
          {/* Text content */}
          <div 
            className={`relative z-10 font-bold text-primary text-center px-4 animate-in zoom-in duration-1000 ${textSize}`}
            style={{ 
              textShadow: '0 2px 4px rgba(0,0,0,0.1)',
              transform: 'translateY(-4px)'
            }}
          >
            {currentItem.motivator.title}
          </div>
        </div>
      )}
    </div>
  );
};