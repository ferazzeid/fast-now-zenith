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
  contentDurationMs = 6000, // 6 seconds for content
  timerFocusDurationMs = 4000, // 4 seconds for timer focus
  quotesType = 'fasting'
}: ImprovedUnifiedMotivatorRotationProps) => {
  const { motivators } = useMotivators();
  const { quotes } = useOptimizedQuoteSettings();
  const adminSettings = useAdminAnimationSettings();
  
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('timer');
  
  // Internal refs to ensure single, deterministic loop
  const runIdRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const modeRef = useRef<'timer-focused' | 'motivator-focused'>('timer-focused');

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

            // Advance to next content and repeat - with longer transition time
            setIndex(prev => (prev + 1) % items.length);
            setTimeout(() => {
              if (runIdRef.current !== thisRun) return;
              loop();
            }, 500); // Reduced transition delay for smoother flow
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
      {/* Content display - image and title appear together */}
      {showContent && (
        <div 
          className="absolute inset-0 transition-all duration-1000 ease-in-out"
          style={{ 
            opacity: showContent ? 1 : 0,
            transform: `scale(${showContent ? 1 : 0.95})`,
            zIndex: 10 
          }}
        >
          {/* Background image layer */}
          {current.imageUrl && (
            <div className="absolute inset-0 overflow-hidden">
              <MotivatorImageWithFallback
                src={current.imageUrl}
                alt={current.title || "Content image"}
                className="absolute inset-0 w-full h-full object-cover transition-all duration-1000 ease-in-out"
                style={{ 
                  filter: "brightness(0.7) saturate(1.1) contrast(1.05)",
                  transform: `scale(${showContent ? 1.05 : 1})` 
                }}
              />
            </div>
          )}

          {/* Dark overlay for text readability */}
          <div 
            className="absolute inset-0 bg-black/40 transition-all duration-1000 ease-in-out"
            style={{ opacity: showContent ? 1 : 0 }}
          />

          {/* Text content - unified with image */}
          <div className="absolute inset-0 flex items-center justify-center p-6">
            <div 
              className="text-center max-w-3xl w-full transition-all duration-1000 ease-in-out"
              style={{ 
                opacity: showContent ? 1 : 0,
                transform: `translateY(${showContent ? 0 : 20}px)` 
              }}
            >
              {current.type === 'motivator' || current.type === 'note' ? (
                /* Goals: Clean, bold text */
                <p className="text-lg font-bold leading-tight text-white uppercase tracking-wide drop-shadow-lg">
                  {current.title}
                </p>
              ) : (
                /* Quotes: With author attribution */
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