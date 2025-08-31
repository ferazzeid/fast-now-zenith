import React, { useState, useEffect } from 'react';
import { Bookmark, Hand } from 'lucide-react';
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
      className={`max-w-md mx-auto bg-primary text-primary-foreground rounded-lg shadow-sm ${compact ? 'px-4 py-3' : 'px-6 py-4'} cursor-pointer transition-all duration-300 hover:shadow-md ${className}`}
      onClick={handleRefresh}
    >
      <blockquote className="relative">
        <p className={`${compact ? 'text-sm' : 'text-base'} italic text-primary-foreground leading-relaxed mb-3`}>
          "{currentQuote.text}"
        </p>
        {currentQuote.author && (
          <cite className={`${compact ? 'text-xs' : 'text-sm'} text-primary-foreground/80 not-italic`}>
            — {currentQuote.author}
          </cite>
        )}
      </blockquote>
      
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-primary-foreground/20">
        <div className={`${compact ? 'text-xs' : 'text-sm'} text-primary-foreground/70 flex items-center gap-1`}>
          <Hand className={`${compact ? 'w-3 h-3' : 'w-4 h-4'}`} />
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
            className={`${compact ? 'h-6 px-2 text-xs' : 'h-8 px-3 text-sm'} text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10`}
          >
            <Bookmark className={`${compact ? 'w-3 h-3 mr-1' : 'w-4 h-4 mr-1.5'}`} />
            Save to Goals
          </Button>
        )}
      </div>
    </div>
  );
};