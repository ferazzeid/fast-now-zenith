import React from 'react';
import { InspirationQuote } from '@/components/InspirationQuote';
import { FastingTimelineV2 } from '@/components/FastingTimelineV2';
import { Quote } from '@/hooks/useQuoteSettings';

interface FastingInspirationRotatorProps {
  quotes: Quote[];
  currentFastingHour?: number;
  className?: string;
}

export const FastingInspirationRotator: React.FC<FastingInspirationRotatorProps> = ({ 
  quotes, 
  currentFastingHour = 0,
  className = '' 
}) => {
  return (
    <div className={className}>
      <FastingTimelineV2 currentHour={currentFastingHour} />
      {quotes && quotes.length > 0 && (
        <InspirationQuote quotes={quotes} className="mt-4" />
      )}
    </div>
  );
};