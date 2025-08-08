import React, { useState, useEffect } from 'react';
import { Quote } from '@/hooks/useQuoteSettings';

interface InspirationQuoteProps {
  quotes: Quote[];
  className?: string;
}

export const InspirationQuote: React.FC<InspirationQuoteProps> = ({ 
  quotes, 
  className = '' 
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

  if (!currentQuote || quotes.length === 0) {
    return null;
  }

  return (
    <div 
      className={`max-w-md mx-auto text-center px-6 py-4 cursor-pointer transition-opacity duration-500 hover:opacity-80 ${className}`}
      onClick={handleRefresh}
    >
      <blockquote className="relative">
        <p className="text-sm italic text-muted-foreground/80 leading-relaxed mb-2">
          "{currentQuote.text}"
        </p>
        {currentQuote.author && (
          <cite className="text-xs text-muted-foreground/60 not-italic">
            — {currentQuote.author}
          </cite>
        )}
      </blockquote>
      <div className="text-xs text-muted-foreground/40 mt-2">
        Tap for another quote
      </div>
    </div>
  );
};