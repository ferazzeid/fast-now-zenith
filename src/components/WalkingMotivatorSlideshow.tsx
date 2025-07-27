import { useState, useEffect } from 'react';
import { useMotivators } from '@/hooks/useMotivators';

interface WalkingMotivatorSlideshowProps {
  isActive: boolean;
  transitionTime?: number;
  onModeChange?: (mode: 'timer-focused' | 'motivator-focused') => void;
}

type DisplayMode = 'timer-focused' | 'motivator-focused';

export const WalkingMotivatorSlideshow = ({ isActive, transitionTime = 15, onModeChange }: WalkingMotivatorSlideshowProps) => {
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

  if (!isActive || motivatorsWithImages.length === 0) {
    return null;
  }

  const currentMotivator = motivatorsWithImages[currentIndex];

  return (
    <>
      {/* Image Layer - Full rectangular fill during motivator-focused mode */}
      <div 
        className={`absolute inset-0 rounded-lg overflow-hidden transition-all duration-1000 ${
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
        
        {/* Subtle overlay for readability */}
        <div 
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 30%)`,
          }}
        />
      </div>

      {/* Fast Fade-In Ticker Text at Bottom */}
      {isVisible && currentMotivator && displayMode === 'motivator-focused' && (
        <div 
          className="absolute bottom-0 left-0 right-0 h-12 flex items-center overflow-hidden"
          style={{ zIndex: 15 }}
        >
          <div 
            className="whitespace-nowrap text-white font-semibold text-lg tracking-wide drop-shadow-lg animate-fast-fade-marquee"
            style={{
              animation: 'fastFadeMarquee 8s ease-in-out'
            }}
          >
            {currentMotivator.title.toUpperCase()}
          </div>
        </div>
      )}

      {/* Light background during timer-focused mode - matches food page card background */}
      {displayMode === 'timer-focused' && (
        <div 
          className="absolute inset-0 bg-card border border-border rounded-lg transition-opacity duration-1000"
          style={{ zIndex: 2 }}
        />
      )}
    </>
  );
};