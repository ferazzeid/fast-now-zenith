import React, { useState, useEffect } from 'react';
import { Bookmark, Hand } from 'lucide-react';
import { Quote } from '@/hooks/useQuoteSettings';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

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
    <Card className={`${className} ${compact ? 'p-3' : 'p-4'} cursor-pointer transition-all duration-200 hover:shadow-md`} onClick={handleRefresh}>
      <blockquote className="text-center">
        <p className={`${compact ? 'text-sm' : 'text-base'} font-medium text-foreground leading-relaxed mb-2`}>
          "{currentQuote.text}"
        </p>
        {currentQuote.author && (
          <cite className={`${compact ? 'text-xs' : 'text-sm'} text-muted-foreground not-italic`}>
            — {currentQuote.author}
          </cite>
        )}
      </blockquote>
      
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-muted">
        <div className="text-xs text-muted-foreground flex items-center gap-1">
          <Hand className="w-3 h-3" />
          Tap for another
        </div>
        {onSaveQuote && (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleSaveQuote();
            }}
            className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 flex items-center gap-1"
          >
            <Bookmark className="w-3 h-3" />
            Save
          </Button>
        )}
      </div>
    </Card>
  );
};