import { useState, useEffect, useRef, useMemo } from 'react';
import { useMotivators } from '@/hooks/useMotivators';
import { useOptimizedQuoteSettings } from '@/hooks/optimized/useOptimizedQuoteSettings';
import { MotivatorImageWithFallback } from '@/components/MotivatorImageWithFallback';

interface ImprovedUnifiedMotivatorRotationProps {
  isActive: boolean;
  onModeChange?: (mode: 'timer-focused' | 'motivator-focused') => void;
  className?: string;
  contentDurationMs?: number; // Duration to show content
  timerFocusDurationMs?: number; // Duration to focus on timer
  quotesType?: 'fasting' | 'walking'; // Which quotes to use
}

type UnifiedItem = {
  id: string;
  title: string;
  content?: string;
  imageUrl?: string;
  type: 'motivator' | 'quote' | 'note';
  author?: string;
};

type Phase = 'timer' | 'content';

export const ImprovedUnifiedMotivatorRotation = ({ 
  isActive, 
  onModeChange,
  className = "",
  contentDurationMs = 6000, // 6 seconds for content
  timerFocusDurationMs = 4000, // 4 seconds for timer focus
  quotesType = 'fasting'
}: ImprovedUnifiedMotivatorRotationProps) => {
  const { motivators } = useMotivators();
  const { quotes } = useOptimizedQuoteSettings();
  
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('timer');
  
  // Internal refs to ensure single, deterministic loop
  const runIdRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const modeRef = useRef<'timer-focused' | 'motivator-focused'>('timer-focused');

  // Combine all content into unified items
  const items = useMemo(() => {
    const unifiedItems: UnifiedItem[] = [];

    // Add motivators that are set to show in animations
    const activeMotivators = motivators.filter(m => 
      m.show_in_animations && m.title && m.title.trim() !== ''
    );
    
    activeMotivators.forEach(motivator => {
      unifiedItems.push({
        id: motivator.id,
        title: motivator.title,
        content: motivator.content,
        imageUrl: motivator.imageUrl,
        type: motivator.category === 'personal_note' ? 'note' : 'motivator',
      });
    });

    // Add quotes based on type
    const quotesToUse = quotesType === 'walking' 
      ? quotes.walking_timer_quotes 
      : quotes.fasting_timer_quotes;
      
    if (quotesToUse && Array.isArray(quotesToUse)) {
      quotesToUse.forEach((quote, idx) => {
        if (quote.text && quote.text.trim() !== '') {
          unifiedItems.push({
            id: `quote-${idx}`,
            title: quote.text,
            type: 'quote',
            author: quote.author || 'Unknown Author',
          });
        }
      });
    }

    return unifiedItems;
  }, [motivators, quotes, quotesType]);

  // Handle visibility changes - reset to timer when document becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && isActive) {
        setPhase('timer');
        if (modeRef.current !== 'timer-focused') {
          onModeChange?.('timer-focused');
          modeRef.current = 'timer-focused';
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isActive, onModeChange]);

  // Main rotation loop
  useEffect(() => {
    if (!isActive || items.length === 0) {
      setPhase('timer');
      if (modeRef.current !== 'timer-focused') {
        onModeChange?.('timer-focused');
        modeRef.current = 'timer-focused';
      }
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      runIdRef.current += 1;
      return;
    }

    const thisRun = ++runIdRef.current;

    const setPhaseAndMode = (newPhase: Phase) => {
      setPhase(newPhase);
      const mode = newPhase === 'content' ? 'motivator-focused' : 'timer-focused';
      if (modeRef.current !== mode) {
        onModeChange?.(mode);
        modeRef.current = mode;
      }
    };

    const loop = () => {
      if (runIdRef.current !== thisRun) return;

      // Show timer focus
      setPhaseAndMode('timer');

      timeoutRef.current = setTimeout(() => {
        if (runIdRef.current !== thisRun) return;

        // Show content
        setPhaseAndMode('content');

        timeoutRef.current = setTimeout(() => {
          if (runIdRef.current !== thisRun) return;

          // Advance to next content and repeat
          setIndex(prev => (prev + 1) % items.length);
          loop();
        }, contentDurationMs);
      }, timerFocusDurationMs);
    };

    // Start the loop
    loop();

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      runIdRef.current += 1; // invalidate this run
    };
  }, [isActive, items.length, contentDurationMs, timerFocusDurationMs, onModeChange]);

  if (!isActive || items.length === 0) return null;

  const current = items[index];
  const showContent = phase === 'content' && current;

  return (
        <div className={`absolute inset-0 ${className}`}>
          {/* Content display */}
          {showContent && (
            <>
              {/* Background image layer */}
              {current.imageUrl && (
                <div
                  className="absolute inset-0 overflow-hidden transition-opacity duration-500 ease-in-out"
                  style={{ zIndex: 8 }}
                >
                  <MotivatorImageWithFallback
                    src={current.imageUrl}
                    alt={current.title || 'Content image'}
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{ filter: 'brightness(0.7) saturate(1.1) contrast(1.05)' }}
                  />
                  {/* Improved overlay for better text readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-black/30" />
                </div>
              )}

              {/* Text content with improved contrast */}
              <div
                className="absolute inset-0 flex items-center justify-center p-6 transition-all duration-500 ease-in-out"
                style={{ zIndex: 15 }}
              >
                <div className="text-center max-w-4xl w-full animate-fade-in">
                  {current.type === 'motivator' || current.type === 'note' ? (
                    /* Goals/Notes: Bold uppercase text with strong background */
                    <div className="bg-black/40 backdrop-blur-sm rounded-2xl px-8 py-6 border border-white/20">
                      <p className="text-2xl font-bold leading-tight text-white uppercase tracking-wide">
                        {current.title}
                      </p>
                    </div>
                  ) : (
                    /* Quotes: Elegant text with subtle background */
                    <div className="bg-black/30 backdrop-blur-sm rounded-2xl px-8 py-6 border border-white/10">
                      <p 
                        className={`font-medium leading-relaxed text-white ${
                          current.title.length > 200 ? 'text-lg' : 
                          current.title.length > 120 ? 'text-xl' : 'text-2xl'
                        }`}
                      >
                        "{current.title}"
                      </p>
                      {current.author && current.author !== 'Unknown Author' && (
                        <p className="text-lg text-white/80 mt-3 font-medium">
                          — {current.author}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
  );
};