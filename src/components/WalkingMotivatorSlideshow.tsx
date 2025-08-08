import { useState, useEffect } from 'react';
import { useMotivators } from '@/hooks/useMotivators';
import { MotivatorImageWithFallback } from '@/components/MotivatorImageWithFallback';
import { useMotivatorAnimation } from '@/hooks/useMotivatorAnimation';

interface WalkingMotivatorSlideshowProps {
  isActive: boolean;
  transitionTime?: number;
  onModeChange?: (mode: 'timer-focused' | 'motivator-focused') => void;
}

type DisplayMode = 'timer-focused' | 'motivator-focused';

// Matrix Pixel Component for rectangular walking timer
const WalkingMatrixPixel = ({ delay, image, index }: { delay: number; image: string; index: number }) => {
  const row = Math.floor(index / 10);
  const col = index % 10;
  
  return (
    <div 
      className="absolute w-[10%] h-[10%] overflow-hidden"
      style={{
        left: `${col * 10}%`,
        top: `${row * 10}%`,
        animationDelay: `${delay}ms`,
      }}
    >
      <div
        className="w-full h-full bg-cover bg-center animate-[pixelSwarmOut_1000ms_ease-in-out_forwards]"
        style={{
          backgroundImage: `url(${image})`,
          backgroundPosition: `${-col * 100}% ${-row * 100}%`,
          backgroundSize: '1000% 1000%'
        }}
      />
    </div>
  );
};

const WalkingMatrixPixelIn = ({ delay, image, index }: { delay: number; image: string; index: number }) => {
  const row = Math.floor(index / 10);
  const col = index % 10;
  
  return (
    <div 
      className="absolute w-[10%] h-[10%] overflow-hidden"
      style={{
        left: `${col * 10}%`,
        top: `${row * 10}%`,
        animationDelay: `${delay}ms`,
      }}
    >
      <div
        className="w-full h-full bg-cover bg-center animate-[pixelSwarmIn_1000ms_ease-in-out_forwards]"
        style={{
          backgroundImage: `url(${image})`,
          backgroundPosition: `${-col * 100}% ${-row * 100}%`,
          backgroundSize: '1000% 1000%'
        }}
      />
    </div>
  );
};

export const WalkingMotivatorSlideshow = ({ isActive, transitionTime = 15, onModeChange }: WalkingMotivatorSlideshowProps) => {
  const { motivators } = useMotivators();
  const { animationStyle } = useMotivatorAnimation();
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

  if (animationStyle === 'pixel_dissolve') {
    return (
      <>
        {/* Matrix dissolve effect for walking timer */}
        {displayMode === 'motivator-focused' && isVisible && currentMotivator?.imageUrl && (
          <div 
            className="absolute inset-0 rounded-lg overflow-hidden"
            style={{ zIndex: 5 }}
          >
            {/* Create 100 pixel cubes (10x10 grid) */}
            {Array.from({ length: 100 }, (_, index) => {
              const delay = Math.random() * 800; // Stagger the animation randomly
              return (
                <WalkingMatrixPixelIn
                  key={`in-${index}`}
                  delay={delay}
                  image={currentMotivator.imageUrl!}
                  index={index}
                />
              );
            })}
          </div>
        )}

        {/* Centered Zoom-In Text */}
        {isVisible && currentMotivator && displayMode === 'motivator-focused' && (
          <div 
            className="absolute inset-0 flex items-center justify-center"
            style={{ zIndex: 15 }}
          >
            <div 
              className="text-white font-bold text-xl tracking-wide text-center px-6 py-3 rounded-lg bg-black/50 backdrop-blur-sm border border-white/10"
              style={{
                animation: 'zoomIn 8s ease-in-out',
                textShadow: '0 2px 4px rgba(0,0,0,0.8)'
              }}
            >
              {currentMotivator.title.toUpperCase()}
            </div>
          </div>
        )}

        {/* Light background during timer-focused mode - matches food page card background */}
        {displayMode === 'timer-focused' && (
          <div 
            className="absolute inset-0 bg-card rounded-lg transition-opacity duration-1000"
            style={{ zIndex: 2 }}
          />
        )}
      </>
    );
  }

  // Original smooth fade animation
  return (
    <>
      {/* Image Layer - Full rectangular fill during motivator-focused mode */}
      <div 
        className={`absolute inset-0 rounded-lg overflow-hidden transition-all duration-1000 ${
          displayMode === 'motivator-focused' ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ zIndex: displayMode === 'motivator-focused' ? 5 : 1 }}
      >
        <MotivatorImageWithFallback
          src={currentMotivator?.imageUrl}
          alt={currentMotivator?.title || 'Motivator image'}
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            filter: 'brightness(0.9) saturate(1.1) contrast(1.05)'
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

      {/* Centered Zoom-In Text */}
      {isVisible && currentMotivator && displayMode === 'motivator-focused' && (
        <div 
          className="absolute inset-0 flex items-center justify-center"
          style={{ zIndex: 15 }}
        >
          <div 
            className="text-white font-bold text-xl tracking-wide text-center px-6 py-3 rounded-lg bg-black/50 backdrop-blur-sm border border-white/10 animate-zoom-in"
            style={{
              animation: 'zoomIn 8s ease-in-out',
              textShadow: '0 2px 4px rgba(0,0,0,0.8)'
            }}
          >
            {currentMotivator.title.toUpperCase()}
          </div>
        </div>
      )}

      {/* Light background during timer-focused mode - matches food page card background */}
      {displayMode === 'timer-focused' && (
        <div 
          className="absolute inset-0 bg-card rounded-lg transition-opacity duration-1000"
          style={{ zIndex: 2 }}
        />
      )}
    </>
  );
};