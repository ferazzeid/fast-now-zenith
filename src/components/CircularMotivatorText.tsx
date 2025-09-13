import { useState, useEffect } from 'react';
import { useMotivators } from '@/hooks/useMotivators';

interface CircularMotivatorTextProps {
  isActive: boolean;
  transitionTime?: number;
  onModeChange?: (mode: 'timer-focused' | 'motivator-focused') => void;
}

type DisplayMode = 'timer-focused' | 'motivator-focused';

export const CircularMotivatorText = ({ isActive, transitionTime = 15, onModeChange }: CircularMotivatorTextProps) => {
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
  }, [isActive, motivatorsWithImages.length, transitionTime, onModeChange]);

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
          className="absolute font-semibold text-foreground text-sm tracking-wide drop-shadow-lg"
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

  if (!isActive || motivatorsWithImages.length === 0) {
    return null;
  }

  const currentMotivator = motivatorsWithImages[currentIndex];

  return null; // Circular text removed per user request - too fast to read
};