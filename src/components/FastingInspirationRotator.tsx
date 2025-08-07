import React, { useState, useEffect, useRef } from 'react';
import { InspirationQuote } from '@/components/InspirationQuote';
import { FastingTimeline } from '@/components/FastingTimeline';
import { FastingSliderHeader } from '@/components/FastingSliderHeader';
import { Quote } from '@/hooks/useQuoteSettings';

interface FastingInspirationRotatorProps {
  quotes: Quote[];
  currentFastingHour?: number;
  className?: string;
}

type DisplayMode = 'quote' | 'timeline';

export const FastingInspirationRotator: React.FC<FastingInspirationRotatorProps> = ({ 
  quotes, 
  currentFastingHour = 0,
  className = '' 
}) => {
  const [displayMode, setDisplayMode] = useState<DisplayMode>('quote');
  const [isVisible, setIsVisible] = useState(true);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (quotes.length === 0) return;

    const interval = setInterval(() => {
      // Fade out
      setIsVisible(false);

      // After fade out completes, switch mode and fade in
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setDisplayMode(prev => prev === 'quote' ? 'timeline' : 'quote');
        setIsVisible(true);
      }, 300); // Match the transition duration
    }, 30000); // 30 seconds

    return () => {
      clearInterval(interval);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [quotes.length]);

  // Manual mode switch on tap/click
  const handleSwitch = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsVisible(false);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setDisplayMode(prev => prev === 'quote' ? 'timeline' : 'quote');
      setIsVisible(true);
    }, 300);
  };

  if (quotes.length === 0 && displayMode === 'quote') {
    // If no quotes, just show timeline
    return (
      <FastingTimeline 
        currentHour={currentFastingHour}
        className={className}
      />
    );
  }

  return (
    <div 
      className={`transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      } ${className}`}
    >
      {displayMode === 'quote' ? (
        <div>
          <InspirationQuote quotes={quotes} />
          <div className="text-center mt-2">
            <div 
              className="flex justify-center items-center gap-2 cursor-pointer select-none"
              role="button"
              aria-label="Switch between quote and timeline"
              onClick={handleSwitch}
            >
              <div className="w-2 h-2 rounded-full bg-primary"></div>
              <div className="w-2 h-2 rounded-full bg-muted"></div>
              <span className="text-xs text-muted-foreground ml-2">Tap to switch</span>
            </div>
          </div>
        </div>
      ) : (
        <div>
          <FastingSliderHeader currentHour={currentFastingHour} className="mb-2" />
          <FastingTimeline currentHour={currentFastingHour} />
          <div className="text-center mt-2">
            <div 
              className="flex justify-center items-center gap-2 cursor-pointer select-none"
              role="button"
              aria-label="Switch between quote and timeline"
              onClick={handleSwitch}
            >
              <div className="w-2 h-2 rounded-full bg-muted"></div>
              <div className="w-2 h-2 rounded-full bg-primary"></div>
              <span className="text-xs text-muted-foreground ml-2">Tap to switch</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};