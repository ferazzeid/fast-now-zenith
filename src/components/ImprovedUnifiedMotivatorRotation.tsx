import { useState, useEffect, useRef, useMemo } from 'react';
import { useMotivators } from '@/hooks/useMotivators';
import { useOptimizedQuoteSettings } from '@/hooks/optimized/useOptimizedQuoteSettings';
import { MotivatorImageWithFallback } from '@/components/MotivatorImageWithFallback';
import { useAdminAnimationSettings } from '@/hooks/useAdminAnimationSettings';

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
  contentDurationMs = 4500, // 4.5 seconds visible content
  timerFocusDurationMs = 2500, // 2.5 seconds for timer focus
  quotesType = 'fasting'
}: ImprovedUnifiedMotivatorRotationProps) => {
  const { motivators } = useMotivators();
  const { quotes } = useOptimizedQuoteSettings();
  const adminSettings = useAdminAnimationSettings();
  
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('timer');
  const [showContent, setShowContent] = useState(false); // Controls CSS opacity transition
  
  // Internal refs to ensure single, deterministic loop
  const runIdRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const modeRef = useRef<'timer-focused' | 'motivator-focused'>('timer-focused');

  // Transition timing constants
  const FADE_DURATION = 500; // 500ms for fade in/out

  // Combine all content into unified items
  const items = useMemo(() => {
    const unifiedItems: UnifiedItem[] = [];

    // Add motivators that are set to show in animations - but only if admin allows the category
    if (adminSettings.enable_goals_in_animations) {
      const activeGoals = motivators.filter(m => 
        m.show_in_animations && 
        m.title && 
        m.title.trim() !== '' &&
        m.category !== 'saved_quote' &&
        m.category !== 'personal_note'
      );
      
      activeGoals.forEach(motivator => {
        unifiedItems.push({
          id: motivator.id,
          title: motivator.title,
          content: motivator.content,
          imageUrl: motivator.imageUrl,
          type: 'motivator',
        });
      });
    }

    // Add saved quotes - but only if admin allows quotes
    if (adminSettings.enable_quotes_in_animations) {
      const savedQuotes = motivators.filter(m => 
        m.show_in_animations && 
        m.category === 'saved_quote' &&
        m.content &&
        m.content.trim() !== ''
      );
      
      savedQuotes.forEach(quote => {
        unifiedItems.push({
          id: quote.id,
          title: quote.content, // Use content as the quote text
          type: 'quote',
          author: quote.title || 'Unknown Author', // Use title as author
        });
      });

      // Add system quotes based on type
      const quotesToUse = quotesType === 'walking' 
        ? quotes.walking_timer_quotes 
        : quotes.fasting_timer_quotes;
        
      if (quotesToUse && Array.isArray(quotesToUse)) {
        quotesToUse.forEach((quote, idx) => {
          if (quote.text && quote.text.trim() !== '') {
            unifiedItems.push({
              id: `system-quote-${idx}`,
              title: quote.text,
              type: 'quote',
              author: quote.author || 'Unknown Author',
            });
          }
        });
      }
    }

    // Add notes - but only if admin allows notes
    if (adminSettings.enable_notes_in_animations) {
      const activeNotes = motivators.filter(m => 
        m.show_in_animations && 
        m.category === 'personal_note' &&
        m.title && 
        m.title.trim() !== ''
      );
      
      activeNotes.forEach(note => {
        unifiedItems.push({
          id: note.id,
          title: note.title,
          content: note.content,
          imageUrl: note.imageUrl,
          type: 'note',
        });
      });
    }

    return unifiedItems;
  }, [motivators, quotes, quotesType, adminSettings]);

  // Handle visibility changes - reset to timer when document becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && isActive) {
        setPhase('timer');
        setShowContent(false);
        if (modeRef.current !== 'timer-focused') {
          onModeChange?.('timer-focused');
          modeRef.current = 'timer-focused';
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isActive, onModeChange]);

  // Main rotation loop with proper smooth transitions
  useEffect(() => {
    if (!isActive || items.length === 0) {
      setPhase('timer');
      setShowContent(false);
      if (modeRef.current !== 'timer-focused') {
        onModeChange?.('timer-focused');
        modeRef.current = 'timer-focused';
      }
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      runIdRef.current += 1;
      return;
    }

    const thisRun = ++runIdRef.current;

    const setModeIfChanged = (mode: 'timer-focused' | 'motivator-focused') => {
      if (modeRef.current !== mode) {
        onModeChange?.(mode);
        modeRef.current = mode;
      }
    };

    const loop = () => {
      if (runIdRef.current !== thisRun) return;

      // Phase 1: Timer focus - content hidden
      setPhase('timer');
      setShowContent(false);
      setModeIfChanged('timer-focused');

      timeoutRef.current = setTimeout(() => {
        if (runIdRef.current !== thisRun) return;

        // Phase 2: Start content fade in - change to content phase and show
        setPhase('content');
        setModeIfChanged('motivator-focused');
        
        // Small delay to ensure DOM is ready, then trigger fade in
        setTimeout(() => {
          if (runIdRef.current !== thisRun) return;
          setShowContent(true);
        }, 50);

        timeoutRef.current = setTimeout(() => {
          if (runIdRef.current !== thisRun) return;

          // Phase 3: Start content fade out
          setShowContent(false);

          timeoutRef.current = setTimeout(() => {
            if (runIdRef.current !== thisRun) return;

            // Phase 4: Content fully hidden, advance index
            setIndex(prev => (prev + 1) % items.length);
            
            // Continue to next cycle
            loop();
          }, FADE_DURATION);
        }, contentDurationMs + FADE_DURATION);
      }, timerFocusDurationMs);
    };

    // Start the loop
    loop();

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      runIdRef.current += 1; // invalidate this run
    };
  }, [isActive, items.length, contentDurationMs, timerFocusDurationMs, onModeChange, FADE_DURATION]);

  if (!isActive || items.length === 0) return null;

  const current = items[index];

  return (
    <div className={`absolute inset-0 ${className}`}>
      {/* Content overlay - fades smoothly over timer */}
      {current && phase === 'content' && (
        <div 
          className="absolute inset-0 transition-all duration-500 ease-in-out"
          style={{ 
            opacity: showContent ? 1 : 0,
            transform: `scale(${showContent ? 1 : 0.95})`,
            zIndex: 20 // Always above timer
          }}
        >
          {/* Background image layer */}
          {current.imageUrl && (
            <div className="absolute inset-0 overflow-hidden">
              <MotivatorImageWithFallback
                src={current.imageUrl}
                alt={current.title || "Content image"}
                className="absolute inset-0 w-full h-full object-cover transition-all duration-500 ease-in-out"
                style={{ 
                  filter: "brightness(0.7) saturate(1.1) contrast(1.05)",
                  transform: `scale(${showContent ? 1.05 : 1})` 
                }}
              />
            </div>
          )}

          {/* Dark overlay for text readability */}
          <div 
            className="absolute inset-0 bg-black/40 transition-all duration-500 ease-in-out"
            style={{ opacity: showContent ? 1 : 0 }}
          />

          {/* Text content */}
          <div className="absolute inset-0 flex items-center justify-center p-6">
            <div 
              className="text-center max-w-3xl w-full transition-all duration-500 ease-in-out"
              style={{ 
                opacity: showContent ? 1 : 0,
                transform: `translateY(${showContent ? 0 : 20}px)` 
              }}
            >
              {current.type === 'motivator' || current.type === 'note' ? (
                <p className="text-lg font-bold leading-tight text-white uppercase tracking-wide drop-shadow-lg">
                  {current.title}
                </p>
              ) : (
                <div className="text-center">
                  <p 
                    className={`font-medium leading-snug text-white drop-shadow-lg ${
                      current.title.length > 150 ? 'text-sm' : 
                      current.title.length > 100 ? 'text-base' : 'text-lg'
                    }`}
                  >
                    "{current.title}"
                  </p>
                  {current.author && current.author !== 'Unknown Author' && current.author.trim() !== '' && (
                    <p className="text-sm text-white/90 mt-3 font-medium drop-shadow-lg">
                      — {current.author}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};