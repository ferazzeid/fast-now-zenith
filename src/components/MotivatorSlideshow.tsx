import { useEffect, useRef, useState } from 'react';
import { useMotivators } from '@/hooks/useMotivators';
import { useMotivatorAnimation } from '@/hooks/useMotivatorAnimation';

interface MotivatorSlideshowProps {
  isActive: boolean;
  transitionTime?: number;
  onModeChange?: (mode: 'timer-focused' | 'motivator-focused') => void;
}

type DisplayMode = 'timer-focused' | 'motivator-focused';

// Config for the matrix effect
const ROWS = 25; // 25 x 40 = 1000 tiles
const COLS = 40;
const STEP_MS = 18; // diagonal sweep step for stagger
const ANIM_MS = 2600; // slower duration to savor the effect

export const MotivatorSlideshow = ({ isActive, transitionTime = 15, onModeChange }: MotivatorSlideshowProps) => {
  const { motivators } = useMotivators();
  const { animationStyle } = useMotivatorAnimation();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [displayMode, setDisplayMode] = useState<DisplayMode>('timer-focused');

  // Track previous mode to trigger OUT animation
  const prevModeRef = useRef<DisplayMode>('timer-focused');
  const [outgoingImage, setOutgoingImage] = useState<string | null>(null);
  const clearOutgoingTimer = useRef<number | null>(null);

  const motivatorsWithImages = motivators.filter((m) => m.imageUrl);

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
          setCurrentIndex((prev) => (prev + 1) % motivatorsWithImages.length);
        }, 1000);
      }, 12000);
    };

    // Initial delay to let timer/plate render
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

  // Handle triggering OUT animation when leaving motivator-focused
  useEffect(() => {
    if (animationStyle !== 'pixel_dissolve') return;

    if (
      prevModeRef.current === 'motivator-focused' &&
      displayMode === 'timer-focused' &&
      motivatorsWithImages[currentIndex]?.imageUrl
    ) {
      setOutgoingImage(motivatorsWithImages[currentIndex]!.imageUrl!);

      // Clear outgoing after the longest delay + animation duration
      const maxDelay = (ROWS + COLS) * STEP_MS + ANIM_MS + 100;
      const id = window.setTimeout(() => setOutgoingImage(null), maxDelay);
      if (clearOutgoingTimer.current) window.clearTimeout(clearOutgoingTimer.current);
      clearOutgoingTimer.current = id;
    }
    prevModeRef.current = displayMode;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayMode, animationStyle, currentIndex, motivatorsWithImages.length]);

  useEffect(() => () => {
    if (clearOutgoingTimer.current) window.clearTimeout(clearOutgoingTimer.current);
  }, []);

  if (!isActive || motivatorsWithImages.length === 0) {
    return null;
  }

  const currentMotivator = motivatorsWithImages[currentIndex];

  // Utility to render a 25x40 grid with corner-to-corner diagonal sweep
  const renderMatrix = (imageUrl: string, type: 'in' | 'out') => {
    const tiles: JSX.Element[] = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const delay = (r + c) * STEP_MS + Math.random() * 40; // diagonal sweep + jitter
        const style: React.CSSProperties = {
          left: `${(c * 100) / COLS}%`,
          top: `${(r * 100) / ROWS}%`,
          width: `${100 / COLS}%`,
          height: `${100 / ROWS}%`,
          animationDelay: `${delay}ms`,
          pointerEvents: 'none',
        };
        const innerStyle: React.CSSProperties = {
          width: '100%',
          height: '100%',
          backgroundImage: `url(${imageUrl})`,
          backgroundSize: `${COLS * 100}% ${ROWS * 100}%`,
          backgroundPosition: `${-c * 100}% ${-r * 100}%`,
          animationDuration: `${ANIM_MS}ms`,
          animationTimingFunction: 'ease-in-out',
          animationFillMode: 'forwards',
          animationName: type === 'in' ? 'pixelSwarmIn' : 'pixelSwarmOut',
        };
        tiles.push(
          <div key={`${type}-${r}-${c}`} className="absolute overflow-hidden" style={style}>
            <div style={innerStyle} />
          </div>
        );
      }
    }
    return tiles;
  };

  if (animationStyle === 'pixel_dissolve') {
    return (
      <>
        {/* Incoming matrix when motivator-focused */}
        {displayMode === 'motivator-focused' && isVisible && currentMotivator?.imageUrl && (
          <div
            className="absolute inset-0 rounded-full overflow-hidden"
            style={{ zIndex: 30, pointerEvents: 'none' }}
          >
            {renderMatrix(currentMotivator.imageUrl!, 'in')}
          </div>
        )}

        {/* Outgoing matrix right after leaving motivator-focused */}
        {outgoingImage && (
          <div
            className="absolute inset-0 rounded-full overflow-hidden"
            style={{ zIndex: 30, pointerEvents: 'none' }}
          >
            {renderMatrix(outgoingImage, 'out')}
          </div>
        )}
        {/* No title overlay in matrix mode to keep image unobstructed */}
      </>
    );
  }

  // Smooth fade fallback (original)
  return (
    <>
      <div
        className={`absolute inset-0 rounded-full overflow-hidden transition-all duration-1000 ${
          displayMode === 'motivator-focused' ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ zIndex: displayMode === 'motivator-focused' ? 8 : 1, willChange: 'transform, opacity' }}
      >
        {/* Image sits below timer text in smooth mode */}
        {currentMotivator?.imageUrl && (
          <img
            src={currentMotivator.imageUrl}
            alt={currentMotivator.title || 'Motivator image'}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ filter: 'brightness(0.9) saturate(1.1) contrast(1.05)' }}
          />
        )}
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle at 50% 50%, transparent 40%, hsla(var(--ceramic-base), 0.15) 100%)`,
            mixBlendMode: 'multiply',
          }}
        />
      </div>
    </>
  );
};
