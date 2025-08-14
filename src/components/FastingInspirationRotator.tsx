import React from 'react';
import { InspirationQuote } from '@/components/InspirationQuote';
import { FastingTimelineV2 } from '@/components/FastingTimelineV2';
import { Quote } from '@/hooks/useQuoteSettings';

interface FastingInspirationRotatorProps {
  quotes: Quote[];
  currentFastingHour?: number;
  className?: string;
  onSaveQuote?: (quote: Quote) => void;
}

export const FastingInspirationRotator: React.FC<FastingInspirationRotatorProps> = ({ 
  quotes, 
  currentFastingHour = 0,
  className = '',
  onSaveQuote
}) => {
  return (
    <div className={className}>
      <FastingTimelineV2 currentHour={currentFastingHour} />
      {quotes && quotes.length > 0 && (
        <InspirationQuote quotes={quotes} className="mt-4" onSaveQuote={onSaveQuote} compact={true} />
      )}
    </div>
  );
};