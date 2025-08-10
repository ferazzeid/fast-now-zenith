import { useState, useEffect } from 'react';
import { useMotivators } from '@/hooks/useMotivators';

interface SequentialGoalRotationProps {
  isActive: boolean;
  onModeChange?: (mode: 'timer-focused' | 'motivator-focused') => void;
  className?: string;
}

type DisplayState = 'timer' | 'goal' | 'transition';

export const SequentialGoalRotation = ({ 
  isActive, 
  onModeChange,
  className = ""
}: SequentialGoalRotationProps) => {
  const { motivators } = useMotivators();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayState, setDisplayState] = useState<DisplayState>('timer');
  const [isAnimating, setIsAnimating] = useState(false);

  // Filter motivators without images to show as rotating text
  const motivatorsWithoutImages = motivators.filter(m => !m.imageUrl && m.title);

  useEffect(() => {
    if (!isActive || motivatorsWithoutImages.length === 0) {
      setDisplayState('timer');
      onModeChange?.('timer-focused');
      return;
    }

    let timer: NodeJS.Timeout;

    const runCycle = () => {
      // Reset to timer state
      setDisplayState('timer');
      setIsAnimating(false);
      onModeChange?.('timer-focused');
      
      // Show timer for 5 seconds
      timer = setTimeout(() => {
        // Switch to goal
        setDisplayState('goal');
        onModeChange?.('motivator-focused');
        
        // Show goal for 4 seconds, then advance to next
        timer = setTimeout(() => {
          // Move to next goal and back to timer
          setCurrentIndex(prev => (prev + 1) % motivatorsWithoutImages.length);
          setDisplayState('timer');
          onModeChange?.('timer-focused');
        }, 4000);
      }, 5000);
    };

    // Start immediately
    runCycle();
    
    // Repeat every 10 seconds (5s timer + 4s goal + 1s buffer)
    const interval = setInterval(runCycle, 10000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [isActive, motivatorsWithoutImages.length, onModeChange]);

  if (!isActive || motivatorsWithoutImages.length === 0) {
    return null;
  }

  const currentMotivator = motivatorsWithoutImages[currentIndex];

  return (
    <div className={`absolute inset-0 ${className}`}>
      {/* Goal Display - Only visible during goal phase */}
      {displayState === 'goal' && currentMotivator && (
        <div 
          className="absolute inset-0 flex items-center justify-center"
          style={{ zIndex: 15 }}
        >
          {/* Pulsating rings around the plate */}
          <div className="absolute inset-[-40px] border-4 border-primary/20 rounded-full animate-pulse pointer-events-none" />
          <div className="absolute inset-[-30px] border-3 border-primary/30 rounded-full animate-pulse pointer-events-none" style={{ animationDelay: '0.2s' }} />
          <div className="absolute inset-[-20px] border-2 border-primary/40 rounded-full animate-pulse pointer-events-none" style={{ animationDelay: '0.4s' }} />
          
          {/* Goal Text */}
          <div 
            className="text-primary font-bold text-xl tracking-wide text-center px-6 py-3 rounded-full bg-background/90 backdrop-blur-sm border-2 border-primary/30 max-w-[85%] shadow-lg animate-scale-in"
            style={{ textShadow: '0 2px 8px rgba(0,0,0,0.2)' }}
          >
            {currentMotivator.title.toUpperCase()}
          </div>
        </div>
      )}
    </div>
  );
};