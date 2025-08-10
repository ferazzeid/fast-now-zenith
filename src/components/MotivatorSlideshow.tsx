import { useState, useEffect } from 'react';
import { useMotivators } from '@/hooks/useMotivators';
import { MotivatorImageWithFallback } from '@/components/MotivatorImageWithFallback';

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

  // Circular text functionality removed per user request - too fast to read

  return (
    <>
      {/* Image Layer - Only visible during motivator-focused mode */}
      <div 
        className={`absolute inset-0 rounded-full overflow-hidden transition-all duration-1000 ${
          displayMode === 'motivator-focused' ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ 
          zIndex: displayMode === 'motivator-focused' ? 8 : 1,
          willChange: 'transform, opacity',
          transform: 'translate3d(0, 0, 0)' // GPU acceleration
        }}
      >
        <MotivatorImageWithFallback
          src={currentMotivator?.imageUrl}
          alt={currentMotivator?.title || 'Motivator image'}
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            filter: 'brightness(0.9) saturate(1.1) contrast(1.05)'
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

      {/* Centered Zoom-In Text for Ceramic Timer */}
      {isVisible && currentMotivator && displayMode === 'motivator-focused' && (
        <div 
          className="absolute inset-0 flex items-center justify-center"
          style={{ zIndex: 15 }}
        >
          <div 
            className="text-white font-bold text-lg tracking-wide text-center px-4 py-2 rounded-full bg-black/60 backdrop-blur-sm border border-white/20"
            style={{
              animation: 'zoomIn 8s ease-in-out',
              textShadow: '0 2px 4px rgba(0,0,0,0.8)',
              maxWidth: '80%'
            }}
          >
            {currentMotivator.title.toUpperCase()}
          </div>
        </div>
      )}
    </>
  );
};