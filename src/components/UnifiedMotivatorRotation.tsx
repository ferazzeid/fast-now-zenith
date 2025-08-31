import { useEffect, useRef, useState, useMemo } from 'react';
import { useMotivators } from '@/hooks/useMotivators';
import { MotivatorImageWithFallback } from '@/components/MotivatorImageWithFallback';
import { useProfile } from '@/hooks/useProfile';
import { useQuoteSettings } from '@/hooks/useQuoteSettings';

interface UnifiedMotivatorRotationProps {
  isActive: boolean;
  onModeChange?: (mode: 'timer-focused' | 'motivator-focused') => void;
  className?: string;
  // Optional durations (ms)
  timerDurationMs?: number; // time to show timer before each motivator
  imageLeadMs?: number;     // for items with images: time to show image alone before text
  textDurationMs?: number;  // time to show text overlay (image stays visible underneath if present)
}

type Phase = 'timer' | 'image' | 'text';

export const UnifiedMotivatorRotation = ({
  isActive,
  onModeChange,
  className = '',
  timerDurationMs = 5000,
  imageLeadMs = 2000,
  textDurationMs = 4000,
}: UnifiedMotivatorRotationProps) => {
  const { motivators } = useMotivators();
  const { profile } = useProfile();
  const { quotes: quoteSettings } = useQuoteSettings();
  
  // Combine all content types into unified items
  const items = useMemo(() => {
    console.log('🎯 Building unified content list');
    
    // Filter motivators based on individual show_in_animations setting
    const allMotivators = motivators.filter(item => item.is_active)
      .filter(item => {
        const showInAnimations = (item as any).show_in_animations;
        return showInAnimations !== false; // Show if true or undefined/null
      });

    const goalMotivators = allMotivators
      .filter(item => item.category !== 'saved_quote') // Only actual goals
      .map(item => ({
        id: `motivator-${item.id}`,
        title: item.title || item.content?.substring(0, 50) + '...' || 'Untitled',
        content: item.content,
        imageUrl: item.imageUrl,
        type: 'motivator' as const
      }));

    const savedQuotes = allMotivators
      .filter(item => item.category === 'saved_quote') // Saved quotes from motivators table
      .map(item => ({
        id: `saved-quote-${item.id}`,
        title: item.title || item.content?.substring(0, 50) + '...' || 'Untitled',
        content: item.content || item.title,
        imageUrl: item.imageUrl,
        type: 'quote' as const
      }));

    // Add walking timer quotes (for now, we'll use walking timer quotes in the walking context)
    const walkingQuotes = quoteSettings?.walking_timer_quotes || [];
    const filteredQuotes = walkingQuotes
      .map((quote, index) => ({
        id: `quote-${index}`,
        title: quote.text,
        content: quote.text,
        imageUrl: null,
        type: 'quote' as const
      }));

    // TODO: Add notes when they're available from admin system
    // For now, we'll just use motivators and quotes
    
    const allItems = [...goalMotivators, ...savedQuotes, ...filteredQuotes];
      
    console.log('🎯 Unified content result:', {
      goals: goalMotivators.length,
      savedQuotes: savedQuotes.length,
      walkingQuotes: filteredQuotes.length,
      total: allItems.length,
      itemDetails: allItems.map(item => ({ type: item.type, title: item.title.substring(0, 30) }))
    });
    
    return allItems;
  }, [motivators, quoteSettings]);

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
              setIndex(prev => (prev + 1) % items.length);
              loop();
            }, textDurationMs);
          }, imageLeadMs);
        } else {
          // No image: just show text
          setPhaseAndMode('text');
          timeoutRef.current = setTimeout(() => {
            if (runIdRef.current !== thisRun) return;
            setIndex(prev => (prev + 1) % items.length);
            loop();
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
          className="absolute inset-0 overflow-hidden transition-opacity duration-700"
          style={{ zIndex: 8 }}
        >
          <MotivatorImageWithFallback
            src={current!.imageUrl}
            alt={current!.title || 'Motivator image'}
            className="absolute inset-0 w-full h-full object-cover"
            style={{ filter: 'brightness(0.95) saturate(1.05) contrast(1.02)' }}
          />
        </div>
      )}

      {/* Content-specific text display */}
      {showText && current && (
        <div
          className="absolute inset-0 flex items-center justify-center p-4"
          style={{ zIndex: 15 }}
        >
          {(() => {
            console.log('🎯 Rendering content:', { 
              type: current.type, 
              title: current.title.substring(0, 30),
              isMotivator: current.type === 'motivator'
            });
            return current.type === 'motivator';
          })() ? (
            /* Goals: Circular centered display with ALL CAPS */
            <div className="w-44 h-44 rounded-full bg-black/40 backdrop-blur-md border border-white/20 shadow-2xl flex items-center justify-center animate-scale-in">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent rounded-full" />
              <div className="relative z-10 text-center text-white px-6">
                <p className="text-lg font-bold leading-tight break-words uppercase" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>
                  {current.title}
                </p>
              </div>
            </div>
          ) : (
            /* Quotes/Notes: Adaptive rectangular card with smaller font and full space */
            <div className="bg-black/40 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl p-6 max-w-md w-full animate-scale-in">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent rounded-2xl" />
              <div className="relative z-10 text-center text-white">
                <p className="text-sm font-medium leading-relaxed break-words" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>
                  {current.title}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
};
