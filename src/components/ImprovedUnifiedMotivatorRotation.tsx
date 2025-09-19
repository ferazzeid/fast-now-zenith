import { useState, useEffect, useRef, useMemo } from 'react';
import { useMotivators } from '@/hooks/useMotivators';
import { useOptimizedQuoteSettings } from '@/hooks/optimized/useOptimizedQuoteSettings';
import { MotivatorImageWithFallback } from '@/components/MotivatorImageWithFallback';
import { useAdminAnimationSettings } from '@/hooks/useAdminAnimationSettings';
import { MilestoneMotivatorCard } from '@/components/MilestoneMotivatorCard';

interface ImprovedUnifiedMotivatorRotationProps {
  isActive: boolean;
  onModeChange?: (mode: 'timer-focused' | 'motivator-focused') => void;
  className?: string;
  quotesType?: 'fasting' | 'walking'; // Which quotes to use
  milestoneHours?: number; // Current milestone hours for special content
  milestoneType?: 'hourly' | 'completion'; // Type of milestone
}

type UnifiedItem = {
  id: string;
  title: string;
  content?: string;
  imageUrl?: string;
  type: 'motivator' | 'quote' | 'note' | 'milestone';
  author?: string;
  hours?: number;
  milestoneType?: 'hourly' | 'completion';
};

type Phase = 'timer' | 'content';

export const ImprovedUnifiedMotivatorRotation = ({ 
  isActive, 
  onModeChange,
  className = "",
  quotesType = 'fasting',
  milestoneHours,
  milestoneType
}: ImprovedUnifiedMotivatorRotationProps) => {
  const { motivators } = useMotivators();
  const { quotes } = useOptimizedQuoteSettings();
  const adminSettings = useAdminAnimationSettings();
  
  // Use admin setting for duration (convert seconds to milliseconds)
  const durationMs = adminSettings.animation_duration_seconds * 1000;
  
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('timer');
  const [showContent, setShowContent] = useState(false); // Controls CSS opacity transition
  
  // Internal refs to ensure single, deterministic loop
  const runIdRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const modeRef = useRef<'timer-focused' | 'motivator-focused'>('timer-focused');

  // Transition timing constants
  const FADE_DURATION = 500; // 500ms for fade in/out

  // Equal weight round-robin mixing of goals, quotes, and notes
  const items = useMemo(() => {
    // Create separate arrays for each content type
    const goals: UnifiedItem[] = [];
    const quotesArray: UnifiedItem[] = [];
    const notes: UnifiedItem[] = [];
    const milestones: UnifiedItem[] = [];

    // Add milestone cards for major achievements
    if (milestoneHours && milestoneType && (milestoneHours >= 4 || milestoneType === 'completion')) {
      milestones.push({
        id: `milestone-${milestoneHours}`,
        title: `${milestoneHours}h Milestone`,
        type: 'milestone',
        hours: milestoneHours,
        milestoneType: milestoneType
      });
    }

    // Collect goals - but only if admin allows the category
    // Show all motivators by default (no filtering)
    if (true) {
      const activeGoals = motivators.filter(m => 
        m.show_in_animations && 
        m.title && 
        m.title.trim() !== '' &&
        m.category !== 'saved_quote' &&
        m.category !== 'personal_note'
      );
      
      activeGoals.forEach(motivator => {
        goals.push({
          id: motivator.id,
          title: motivator.title,
          content: motivator.content,
          imageUrl: motivator.imageUrl,
          type: 'motivator',
        });
      });
    }

    // Collect quotes - but only if admin allows quotes
    // Show all quotes by default (no filtering)
    if (true) {
      const savedQuotes = motivators.filter(m => 
        m.show_in_animations && 
        m.category === 'saved_quote' &&
        m.content &&
        m.content.trim() !== ''
      );
      
      savedQuotes.forEach(quote => {
        // Use content as primary quote text, title as fallback
        const quoteText = (quote.content && quote.content.trim() !== '') ? quote.content : quote.title;
        
        // Try to extract author from content first, then use title if it looks like an author
        const contentWithAttribution = quote.content || '';
        const authorFromContent = contentWithAttribution.match(/—\s*(.+)$/);
        
        let author = 'Unknown Author';
        if (authorFromContent) {
          author = authorFromContent[1].trim();
        } else if (quote.title && quote.title !== quoteText && quote.title.length < 50) {
          // If title is different from content and short, it's likely the author
          author = quote.title;
        }
        
        quotesArray.push({
          id: quote.id,
          title: quoteText.replace(/—\s*.+$/, '').trim(), // Remove author attribution from quote text
          type: 'quote',
          author,
        });
      });

      // Only add system quotes if enabled and user has no saved quotes selected
      const hasSavedQuotes = quotesArray.length > 0;
      
      if (!hasSavedQuotes) {
        const quotesToUse = quotesType === 'walking' 
          ? quotes.walking_timer_quotes 
          : quotes.fasting_timer_quotes;
          
        if (quotesToUse && Array.isArray(quotesToUse)) {
          quotesToUse.forEach((quote, idx) => {
            if (quote.text && quote.text.trim() !== '') {
              quotesArray.push({
                id: `system-quote-${idx}`,
                title: quote.text,
                type: 'quote',
                author: quote.author || 'Unknown Author',
              });
            }
          });
        }
      }
    }

    // Collect notes - but only if admin allows notes
    // Show all notes by default (no filtering)
    if (true) {
      const activeNotes = motivators.filter(m => 
        m.show_in_animations && 
        m.category === 'personal_note' &&
        m.title && 
        m.title.trim() !== ''
      );
      
      activeNotes.forEach(note => {
        notes.push({
          id: note.id,
          title: note.title,
          content: note.content,
          imageUrl: note.imageUrl,
          type: 'note',
        });
      });
    }

    // Round-robin mixing algorithm for equal weight (1:1:1:1 including milestones)
    const mixedItems: UnifiedItem[] = [];
    const maxLength = Math.max(goals.length, quotesArray.length, notes.length, milestones.length);
    
    for (let i = 0; i < maxLength; i++) {
      if (milestones[i]) mixedItems.push(milestones[i]); // Milestones first for prominence
      if (goals[i]) mixedItems.push(goals[i]);
      if (quotesArray[i]) mixedItems.push(quotesArray[i]); 
      if (notes[i]) mixedItems.push(notes[i]);
    }

    return mixedItems;
  }, [motivators, quotes, quotesType, adminSettings, milestoneHours, milestoneType]);

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
          }, durationMs + FADE_DURATION);
        }, durationMs);
    };

    // Start the loop
    loop();

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      runIdRef.current += 1; // invalidate this run
    };
  }, [isActive, items.length, durationMs, onModeChange, FADE_DURATION]);

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
              {/* Milestone cards get special treatment */}
              {current.type === 'milestone' ? (
                <MilestoneMotivatorCard
                  hours={current.hours!}
                  type={current.milestoneType!}
                  isActive={showContent}
                />
              ) : (
                <>
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
                    className="absolute inset-0 bg-background/95 transition-all duration-500 ease-in-out"
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
                      {current.type === 'motivator' ? (
                        <p className="text-lg font-bold leading-tight text-foreground uppercase tracking-wide drop-shadow-lg">
                          {current.title}
                        </p>
                      ) : current.type === 'note' ? (
                        <p 
                          className={`font-medium leading-snug text-foreground drop-shadow-lg ${
                            (current.content?.length || 0) > 100 ? 'text-base' :
                            (current.content?.length || 0) > 60 ? 'text-lg' : 'text-xl'
                          }`}
                        >
                          {current.content && current.content.length > 150 
                            ? `${current.content.substring(0, 150)}...` 
                            : current.content
                          }
                        </p>
                      ) : (
                        <div className="text-center">
                          <p 
                            className={`font-medium leading-snug text-foreground drop-shadow-lg ${
                              current.title.length > 150 ? 'text-sm' : 
                              current.title.length > 100 ? 'text-base' : 'text-lg'
                            }`}
                          >
                            "{current.title}"
                          </p>
                          {current.author && current.author !== 'Unknown Author' && current.author.trim() !== '' && (
                            <p className="text-sm text-muted-foreground mt-3 font-medium drop-shadow-lg">
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
          )}
    </div>
  );
};