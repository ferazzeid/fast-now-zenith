import { useState, useEffect, useRef } from 'react';
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

  // Internal refs to ensure single, deterministic loop
  const runIdRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const modeRef = useRef<'timer-focused' | 'motivator-focused'>('timer-focused');

  // Use ALL motivators with titles for rotation (regardless of image presence)
  const motivatorsWithTitles = motivators.filter(m => m.title);

  useEffect(() => {
    if (!isActive || motivatorsWithTitles.length === 0) {
      setDisplayState('timer');
      if (modeRef.current !== 'timer-focused') {
        onModeChange?.('timer-focused');
        modeRef.current = 'timer-focused';
      }
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      runIdRef.current += 1;
      return;
    }

    const thisRun = ++runIdRef.current;

    const setPhase = (phase: 'timer' | 'goal') => {
      setDisplayState(phase);
      const mode = phase === 'goal' ? 'motivator-focused' : 'timer-focused';
      if (modeRef.current !== mode) {
        onModeChange?.(mode);
        modeRef.current = mode;
      }
    };

    const loop = () => {
      if (runIdRef.current !== thisRun) return;

      // Show timer
      setIsAnimating(false);
      setPhase('timer');

      timeoutRef.current = setTimeout(() => {
        if (runIdRef.current !== thisRun) return;

        // Show goal
        setPhase('goal');

        timeoutRef.current = setTimeout(() => {
          if (runIdRef.current !== thisRun) return;

          // Advance to next and repeat
          setCurrentIndex(prev => (prev + 1) % motivatorsWithTitles.length);
          loop();
        }, 4000); // goal duration
      }, 5000); // timer duration
    };

    // Start loop
    loop();

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      runIdRef.current += 1; // invalidate this run
    };
  }, [isActive, motivatorsWithTitles.length, onModeChange]);

  if (!isActive || motivatorsWithTitles.length === 0) {
    return null;
  }

  const currentMotivator = motivatorsWithTitles[currentIndex];

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
            className="text-foreground font-bold text-xl tracking-wide text-center px-6 py-3 rounded-full bg-background/90 backdrop-blur-sm border-2 border-primary/30 max-w-[85%] shadow-lg animate-scale-in"
            style={{ textShadow: '0 2px 8px rgba(0,0,0,0.2)' }}
          >
            {currentMotivator.title.toUpperCase()}
          </div>
        </div>
      )}
    </div>
  );
};