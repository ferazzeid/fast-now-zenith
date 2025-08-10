import { useState, useEffect } from 'react';
import { useMotivators } from '@/hooks/useMotivators';

interface RotatingGoalTextProps {
  isActive: boolean;
  transitionTime?: number;
  onModeChange?: (mode: 'timer-focused' | 'motivator-focused') => void;
  className?: string;
  radius?: number;
  textSize?: string;
}

type DisplayMode = 'timer-focused' | 'motivator-focused';

export const RotatingGoalText = ({ 
  isActive, 
  transitionTime = 15, 
  onModeChange,
  className = "",
  radius = 130,
  textSize = "text-sm"
}: RotatingGoalTextProps) => {
  const { motivators } = useMotivators();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [displayMode, setDisplayMode] = useState<DisplayMode>('timer-focused');

  // Filter motivators without images to show as rotating text
  const motivatorsWithoutImages = motivators.filter(m => !m.imageUrl && m.title);

  useEffect(() => {
    if (!isActive || motivatorsWithoutImages.length === 0) {
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

      // Switch back to timer-focused and advance to next goal after 8 more seconds
      slideTimer = setTimeout(() => {
        setDisplayMode('timer-focused');
        onModeChange?.('timer-focused');
        setTimeout(() => {
          setCurrentIndex(prev => (prev + 1) % motivatorsWithoutImages.length);
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
  }, [isActive, motivatorsWithoutImages.length, transitionTime, onModeChange]);

  if (!isActive || motivatorsWithoutImages.length === 0) {
    return null;
  }

  const currentMotivator = motivatorsWithoutImages[currentIndex];

  // Create circular rotating text path
  const createCircularText = (text: string) => {
    const chars = text.toUpperCase().split('');
    const angleStep = (2 * Math.PI) / Math.max(chars.length, 20); // Prevent too tight spacing
    
    return chars.map((char, index) => {
      const angle = index * angleStep - Math.PI / 2; // Start at top
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      
      return (
        <span
          key={index}
          className={`absolute font-bold text-primary ${textSize} tracking-wide drop-shadow-lg`}
          style={{
            transform: `translate(${x}px, ${y}px) rotate(${angle + Math.PI / 2}rad)`,
            transformOrigin: '50% 50%',
            left: '50%',
            top: '50%',
            marginLeft: '-0.5ch',
            marginTop: '-0.5em',
            animation: displayMode === 'motivator-focused' ? 'spin 12s linear infinite' : 'none'
          }}
        >
          {char === ' ' ? '\u00A0' : char}
        </span>
      );
    });
  };

  return (
    <div className={`absolute inset-0 ${className}`}>
      {/* Circular Rotating Text - Only visible during motivator-focused mode */}
      {isVisible && currentMotivator && (
        <div 
          className={`absolute inset-0 transition-opacity duration-1000 ${
            displayMode === 'motivator-focused' ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ 
            zIndex: displayMode === 'motivator-focused' ? 10 : 1,
            pointerEvents: 'none' 
          }}
        >
          <div className="relative w-full h-full flex items-center justify-center">
            {createCircularText(currentMotivator.title)}
          </div>
        </div>
      )}

      {/* Central Goal Text Display */}
      {isVisible && currentMotivator && displayMode === 'motivator-focused' && (
        <div 
          className="absolute inset-0 flex items-center justify-center"
          style={{ zIndex: 15 }}
        >
          <div 
            className="text-primary font-bold text-lg tracking-wide text-center px-4 py-2 rounded-full bg-background/80 backdrop-blur-sm border border-primary/20 animate-scale-in max-w-[80%]"
            style={{
              textShadow: '0 2px 4px rgba(0,0,0,0.1)',
              animation: 'scaleIn 8s ease-in-out'
            }}
          >
            {currentMotivator.title.toUpperCase()}
          </div>
        </div>
      )}
    </div>
  );
};