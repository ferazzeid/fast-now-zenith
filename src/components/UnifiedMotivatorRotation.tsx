import { useEffect, useRef, useState } from 'react';
import { useMotivators } from '@/hooks/useMotivators';
import { MotivatorImageWithFallback } from '@/components/MotivatorImageWithFallback';

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
  const items = motivators.filter(m => m?.title); // rotate through all with titles; image optional

  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('timer');

  const runIdRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const modeRef = useRef<'timer-focused' | 'motivator-focused'>('timer-focused');

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
          <div
            className="font-bold text-xl tracking-wide text-center px-6 py-3 rounded-lg bg-black/40 text-white backdrop-blur-sm border border-white/10 animate-scale-in"
            style={{
              textShadow: '0 2px 8px rgba(0,0,0,0.4)',
              maxWidth: '85%'
            }}
          >
            {current!.title!.toUpperCase()}
          </div>
        </div>
      )}
    </div>
  );
};
