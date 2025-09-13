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
    // Allow goals to rotate even when fasting is inactive per user request
    if (motivatorsWithoutImages.length === 0) {
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

  if (motivatorsWithoutImages.length === 0) {
    return null;
  }

  const currentMotivator = motivatorsWithoutImages[currentIndex];

  // Circular text functionality removed per user request - too fast to read

  return (
    <div className={`absolute inset-0 ${className}`}>
      {/* Circular text removed per user request - too fast to read */}
      
      {/* Central Goal Text Display with Pulsating Circles */}
      {isVisible && currentMotivator && displayMode === 'motivator-focused' && (
        <div 
          className="absolute inset-0 flex items-center justify-center"
          style={{ zIndex: 15 }}
        >
          {/* Pulsating Circles around the ceramic plate */}
          <div className="absolute inset-[-40px] border-4 border-primary/20 rounded-full goal-celebration pointer-events-none" />
          <div className="absolute inset-[-30px] border-3 border-primary/30 rounded-full goal-celebration pointer-events-none" style={{ animationDelay: '0.3s' }} />
          <div className="absolute inset-[-20px] border-2 border-primary/40 rounded-full goal-celebration pointer-events-none" style={{ animationDelay: '0.6s' }} />
          <div className="absolute inset-[-10px] border-2 border-primary/50 rounded-full goal-celebration pointer-events-none" style={{ animationDelay: '0.9s' }} />
          
          <div 
            className="text-foreground font-bold text-lg tracking-wide text-center px-4 py-2 rounded-full bg-background/80 backdrop-blur-sm border border-primary/20 animate-scale-in max-w-[80%]"
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