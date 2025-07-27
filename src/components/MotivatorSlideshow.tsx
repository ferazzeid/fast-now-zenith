import { useState, useEffect } from 'react';
import { useMotivators } from '@/hooks/useMotivators';

interface MotivatorSlideshowProps {
  isActive: boolean;
  transitionTime?: number;
  onModeChange?: (mode: 'timer-focused' | 'motivator-focused') => void;
}

type DisplayMode = 'timer-focused' | 'motivator-focused';

export const MotivatorSlideshow = ({ isActive, transitionTime = 15, onModeChange }: MotivatorSlideshowProps) => {
  const { motivators } = useMotivators();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [displayMode, setDisplayMode] = useState<DisplayMode>('timer-focused');

  const motivatorsWithImages = motivators.filter(m => m.imageUrl);

  useEffect(() => {
    if (!isActive || motivatorsWithImages.length === 0) {
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

      // Switch back to timer-focused and advance slide after 8 more seconds
      slideTimer = setTimeout(() => {
        setDisplayMode('timer-focused');
        onModeChange?.('timer-focused');
        setTimeout(() => {
          setCurrentIndex(prev => (prev + 1) % motivatorsWithImages.length);
        }, 1000);
      }, 12000);
    };

    // Initial delay to let plate render
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
  }, [isActive, motivatorsWithImages.length, transitionTime]);

  if (!isActive || motivatorsWithImages.length === 0) {
    return null;
  }

  const currentMotivator = motivatorsWithImages[currentIndex];

  // Create circular text path for the title - positioned away from inner edge
  const createCircularText = (text: string, radius: number = 130) => {
    const chars = text.split('');
    const angleStep = (2 * Math.PI) / Math.max(chars.length, 20); // Prevent too tight spacing
    
    return chars.map((char, index) => {
      const angle = index * angleStep - Math.PI / 2; // Start at top
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      
      return (
        <span
          key={index}
          className="absolute font-semibold text-primary text-sm tracking-wide drop-shadow-lg"
          style={{
            transform: `translate(${x}px, ${y}px) rotate(${angle + Math.PI / 2}rad)`,
            transformOrigin: '50% 50%',
            left: '50%',
            top: '50%',
            marginLeft: '-0.5ch',
            marginTop: '-0.5em',
          }}
        >
          {char === ' ' ? '\u00A0' : char}
        </span>
      );
    });
  };

  return (
    <>
      {/* Image Layer - Only visible during motivator-focused mode */}
      <div 
        className={`absolute inset-0 rounded-full overflow-hidden transition-all duration-1000 ${
          displayMode === 'motivator-focused' ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ zIndex: displayMode === 'motivator-focused' ? 8 : 1 }}
      >
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${currentMotivator?.imageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'brightness(0.9) saturate(1.1) contrast(1.05)',
          }}
        />
        
        {/* Subtle ceramic overlay */}
        <div 
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle at 50% 50%, transparent 40%, hsla(var(--ceramic-base), 0.15) 100%)`,
            mixBlendMode: 'multiply'
          }}
        />
      </div>

      {/* Circular Title Text - Above plate border */}
      {isVisible && currentMotivator && (
        <div 
          className={`absolute inset-0 transition-all duration-1000 ${
            displayMode === 'motivator-focused' ? 'opacity-100' : 'opacity-60'
          }`}
          style={{ 
            zIndex: 15, // Higher than plate border
            animation: displayMode === 'motivator-focused' ? 'spin 60s linear infinite' : 'none'
          }}
        >
          <div className="relative w-full h-full">
            {createCircularText(currentMotivator.title.toUpperCase())}
          </div>
        </div>
      )}

      {/* Remove the overlay for timer-focused mode - keep clean ceramic look */}
    </>
  );
};