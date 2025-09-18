import { useEffect, useRef, useState, useMemo } from 'react';
import { useMotivators } from '@/hooks/useMotivators';
import { MotivatorImageWithFallback } from '@/components/MotivatorImageWithFallback';
import { useProfile } from '@/hooks/useProfile';
import { useQuoteSettings } from '@/hooks/useQuoteSettings';
import { useAdminAnimationSettings } from '@/hooks/useAdminAnimationSettings';

interface UnifiedMotivatorRotationProps {
  isActive: boolean;
  onModeChange?: (mode: 'timer-focused' | 'motivator-focused') => void;
  className?: string;
  // Optional durations (ms)
  timerDurationMs?: number; // time to show timer before each motivator
  imageLeadMs?: number;     // for items with images: time to show image alone before text
  textDurationMs?: number;  // time to show text overlay (image stays visible underneath if present)
}

type UnifiedItem = {
  id: string;
  title: string;
  content: string;
  imageUrl: string | null;
  type: 'motivator' | 'quote';
  author?: string; // For saved quotes
};

type Phase = 'timer' | 'image' | 'text';

export const UnifiedMotivatorRotation = ({
  isActive,
  onModeChange,
  className = '',
  timerDurationMs = 6000,
  imageLeadMs = 1000, // Increased for cleaner transitions
  textDurationMs = 5000,
}: UnifiedMotivatorRotationProps) => {
  const { motivators } = useMotivators();
  const { profile } = useProfile();
  const { quotes: quoteSettings } = useQuoteSettings();
  const adminSettings = useAdminAnimationSettings();
  
  // Combine all content types into unified items
  const items: UnifiedItem[] = useMemo(() => {
    console.log('🎯 Building unified content list');
    
    // Filter motivators based on individual show_in_animations setting
    const allMotivators = motivators.filter(item => item.is_active)
      .filter(item => {
        const showInAnimations = (item as any).show_in_animations;
        return showInAnimations !== false; // Show if true or undefined/null
      });

    const goalMotivators = true 
      ? allMotivators
          .filter(item => item.category !== 'saved_quote' && item.category !== 'personal_note') // Only actual goals
          .map(item => ({
            id: `motivator-${item.id}`,
            title: item.title || item.content?.substring(0, 50) + '...' || 'Untitled',
            content: item.content,
            imageUrl: item.imageUrl,
            type: 'motivator' as const
          }))
      : [];

    const savedQuotes = true 
      ? allMotivators
          .filter(item => item.category === 'saved_quote' && item.content && item.content.trim() !== '') // Saved quotes from motivators table
          .map(item => ({
            id: `saved-quote-${item.id}`,
            title: item.content, // Use content (quote) as title for display
            content: item.content, // Keep content same
            author: item.title, // Store author separately
            imageUrl: item.imageUrl,
            type: 'quote' as const
          }))
      : [];

    // Add walking timer quotes only if enabled
    const walkingQuotes = quoteSettings?.walking_timer_quotes || [];
    const filteredQuotes = (true && quoteSettings?.walking_timer_quotes_enabled !== false) 
      ? walkingQuotes
          .filter(quote => quote.text && quote.text.trim() !== '') // Filter out empty quotes
          .map((quote, index) => ({
            id: `quote-${index}`,
            title: quote.text,
            content: quote.text,
            imageUrl: null,
            type: 'quote' as const,
            author: quote.author && quote.author.trim() !== '' ? quote.author : undefined
          }))
      : [];

    const allItems = [...goalMotivators, ...savedQuotes, ...filteredQuotes];
      
    return allItems;
  }, [motivators, quoteSettings, adminSettings]);

  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('timer');

  const runIdRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const modeRef = useRef<'timer-focused' | 'motivator-focused'>('timer-focused');
  const wasHiddenRef = useRef(false);

  // Reset rotation to timer when page becomes visible after being hidden
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && wasHiddenRef.current) {
        // Page became visible after being hidden - reset to timer phase
        setPhase('timer');
        setIndex(0);
        wasHiddenRef.current = false;
        runIdRef.current += 1; // Force restart of the rotation
      } else if (document.visibilityState === 'hidden') {
        wasHiddenRef.current = true;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

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

    const setPhaseAndMode = (p: Phase) => {
      setPhase(p);
      const mode = p === 'timer' ? 'timer-focused' : 'motivator-focused';
      if (modeRef.current !== mode) {
        onModeChange?.(mode);
        modeRef.current = mode;
      }
    };

    const loop = () => {
      if (runIdRef.current !== thisRun) return;

      // Phase 1: Timer visible
      setPhaseAndMode('timer');

      timeoutRef.current = setTimeout(() => {
        if (runIdRef.current !== thisRun) return;

        const current = items[index];
        const hasImage = Boolean(current?.imageUrl);

        if (hasImage) {
          // Phase 2a: Show image first
          setPhaseAndMode('image');

          timeoutRef.current = setTimeout(() => {
            if (runIdRef.current !== thisRun) return;
            // Phase 2b: Blend in title over image
            setPhaseAndMode('text');

            timeoutRef.current = setTimeout(() => {
              if (runIdRef.current !== thisRun) return;
              // Advance to next item with transition delay
              setIndex(prev => (prev + 1) % items.length);
              setTimeout(() => {
                if (runIdRef.current !== thisRun) return;
                loop();
              }, 800); // 800ms delay for clean transition
            }, textDurationMs);
          }, imageLeadMs);
        } else {
          // No image: just show text
          setPhaseAndMode('text');
          timeoutRef.current = setTimeout(() => {
            if (runIdRef.current !== thisRun) return;
            // Advance to next item with transition delay
            setIndex(prev => (prev + 1) % items.length);
            setTimeout(() => {
              if (runIdRef.current !== thisRun) return;
              loop();
            }, 800); // 800ms delay for clean transition
          }, textDurationMs);
        }
      }, timerDurationMs);
    };

    loop();

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      runIdRef.current += 1;
    };
  }, [isActive, items.length, index, timerDurationMs, imageLeadMs, textDurationMs, onModeChange]);

  if (!isActive || items.length === 0) return null;

  const current = items[index];
  const showImageLayer = (phase === 'image' || phase === 'text') && current?.imageUrl;
  const showText = phase === 'text' && current?.title;

  return (
    <div className={`absolute inset-0 ${className}`}>
      {/* Image layer (below progress ring if needed) */}
      {showImageLayer && (
        <div
          className="absolute inset-0 overflow-hidden transition-opacity duration-1000 ease-in-out"
          style={{ zIndex: 8 }}
        >
          <MotivatorImageWithFallback
            src={current!.imageUrl}
            alt={current!.title || 'Motivator image'}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 ease-in-out"
            style={{ filter: 'brightness(0.95) saturate(1.05) contrast(1.02)' }}
          />
        </div>
      )}

      {/* Content-specific text display */}
      {showText && current && (
        <>
          {/* Dark overlay for text readability - always present during text phase */}
          <div className="absolute inset-0 bg-black/40 transition-opacity duration-1000" style={{ zIndex: 9 }} />
          
          <div
            className="absolute inset-0 flex items-center justify-center p-4 transition-opacity duration-1000"
            style={{ zIndex: 15 }}
          >
            <div className="text-center max-w-3xl w-full animate-fade-in">
              {current.type === 'motivator' ? (
                /* Goals: Direct text on overlay */
                <p className="text-sm font-bold leading-tight text-white uppercase tracking-wide">
                  {current.title}
                </p>
              ) : (
                /* Quotes: Direct text on overlay */
                <div className="text-center">
                  <p 
                    className={`font-medium leading-snug text-white ${
                      current.title.length > 150 ? 'text-xs' : 
                      current.title.length > 100 ? 'text-sm' : 'text-sm'
                    }`}
                  >
                    "{current.title}"
                  </p>
                  {(current as any).author && 
                   (current as any).author !== 'Unknown Author' && 
                   (current as any).author.trim() !== '' && (
                    <p className="text-xs text-white/80 mt-2 font-medium">
                      — {(current as any).author}
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
