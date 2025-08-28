import { useEffect, useRef, useState } from 'react';
import { useMotivators } from '@/hooks/useMotivators';
import { MotivatorImageWithFallback } from '@/components/MotivatorImageWithFallback';
import { useProfile } from '@/hooks/useProfile';

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
  
  // Filter motivators based on user preferences
  const items = motivators.filter(m => {
    if (!m?.title) return false;
    
    // Always show goals (personal, general, etc.)
    if (m.category !== 'saved_quote' && m.category !== 'personal_note') {
      return true;
    }
    
    // Check quotes setting
    if (m.category === 'saved_quote') {
      return profile?.enable_quotes_in_animations ?? true;
    }
    
    // Check notes setting  
    if (m.category === 'personal_note') {
      return profile?.enable_notes_in_animations ?? true;
    }
    
    return true;
  });

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

      {/* Text overlay (above progress ring) */}
      {showText && (
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ zIndex: 15 }}
        >
          <div className="relative">
            {/* Pulsation rings (inspired by Admin Dev 'ring pulse') */}
            <div className="absolute -inset-6 rounded-full border-2 border-primary/20 animate-pulse pointer-events-none" />
            <div className="absolute -inset-3 rounded-full border border-primary/30 animate-pulse pointer-events-none" style={{ animationDelay: '0.15s' }} />
            <div className="absolute -inset-1 rounded-full border border-primary/40 animate-pulse pointer-events-none" style={{ animationDelay: '0.3s' }} />

            {/* Circular blurred background with text */}
            <div 
              className="w-44 h-44 rounded-full bg-black/40 text-white backdrop-blur-sm border border-white/10 shadow-lg animate-scale-in flex items-center justify-center px-6 text-center"
              style={{ textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}
            >
              <span className="font-semibold text-sm tracking-wide leading-snug">
                {current!.title!.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
