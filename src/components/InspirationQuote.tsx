import React, { useState, useEffect } from 'react';
import { Bookmark } from 'lucide-react';
import { Quote } from '@/hooks/useQuoteSettings';
import { Button } from '@/components/ui/button';

interface InspirationQuoteProps {
  quotes: Quote[];
  className?: string;
  onSaveQuote?: (quote: Quote) => void;
  compact?: boolean;
}

export const InspirationQuote: React.FC<InspirationQuoteProps> = ({ 
  quotes, 
  className = '',
  onSaveQuote,
  compact = false
}) => {
  const [currentQuote, setCurrentQuote] = useState<Quote | null>(null);
  const [lastShownIndex, setLastShownIndex] = useState<number>(-1);

  // Get a random quote that's different from the last one
  const getRandomQuote = () => {
    if (quotes.length === 0) return null;
    if (quotes.length === 1) return quotes[0];

    let newIndex;
    do {
      newIndex = Math.floor(Math.random() * quotes.length);
    } while (newIndex === lastShownIndex && quotes.length > 1);

    setLastShownIndex(newIndex);
    return quotes[newIndex];
  };

  // Rotate quotes every 30 seconds and on component mount
  useEffect(() => {
    if (quotes.length === 0) {
      setCurrentQuote(null);
      return;
    }

    // Set initial quote
    const initialQuote = getRandomQuote();
    setCurrentQuote(initialQuote);

    // Set up rotation interval
    const interval = setInterval(() => {
      const newQuote = getRandomQuote();
      setCurrentQuote(newQuote);
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [quotes]);

  // Handle manual refresh on tap/click
  const handleRefresh = () => {
    const newQuote = getRandomQuote();
    setCurrentQuote(newQuote);
  };

  const handleSaveQuote = () => {
    if (currentQuote && onSaveQuote) {
      onSaveQuote(currentQuote);
    }
  };

  if (!currentQuote || quotes.length === 0) {
    return null;
  }

  return (
    <div 
      className={`max-w-md mx-auto text-center ${compact ? 'px-4 py-2' : 'px-6 py-4'} cursor-pointer transition-opacity duration-500 hover:opacity-80 ${className}`}
      onClick={handleRefresh}
    >
      <blockquote className="relative">
        <p className={`${compact ? 'text-xs' : 'text-sm'} italic text-muted-foreground/80 leading-relaxed mb-2`}>
          "{currentQuote.text}"
        </p>
        {currentQuote.author && (
          <cite className={`${compact ? 'text-[10px]' : 'text-xs'} text-muted-foreground/60 not-italic`}>
            — {currentQuote.author}
          </cite>
        )}
      </blockquote>
      <div className="flex items-center justify-between mt-2">
        <div className={`${compact ? 'text-[10px]' : 'text-xs'} text-muted-foreground/40`}>
          Tap for another quote
        </div>
        {onSaveQuote && (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleSaveQuote();
            }}
            className={`${compact ? 'h-5 px-1 text-[10px]' : 'h-6 px-2 text-xs'} text-muted-foreground/60 hover:text-muted-foreground`}
          >
            <Bookmark className={`${compact ? 'w-2 h-2 mr-0.5' : 'w-3 h-3 mr-1'}`} />
            Save to Goals
          </Button>
        )}
      </div>
    </div>
  );
};