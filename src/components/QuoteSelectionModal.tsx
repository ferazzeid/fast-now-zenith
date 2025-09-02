import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Quote, useQuoteSettings } from '@/hooks/useQuoteSettings';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Timer, Footprints } from 'lucide-react';

interface QuoteSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectQuote: (quote: Quote) => void;
}

export function QuoteSelectionModal({ isOpen, onClose, onSelectQuote }: QuoteSelectionModalProps) {
  const { quotes, loading } = useQuoteSettings();

  const handleSelectQuote = (quote: Quote) => {
    onSelectQuote(quote);
    onClose();
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Select a Quote</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Select a Quote</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Fasting Timer Quotes */}
          {quotes.fasting_timer_quotes && quotes.fasting_timer_quotes.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Timer className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold text-foreground">Fasting Timer Quotes</h3>
              </div>
              <div className="space-y-2">
                {quotes.fasting_timer_quotes.map((quote, index) => (
                  <Card key={`fasting-${index}`} className="p-4 hover:bg-accent/50 cursor-pointer transition-colors" onClick={() => handleSelectQuote(quote)}>
                    <p className="text-foreground mb-2 leading-relaxed">"{quote.text}"</p>
                    {quote.author && (
                      <p className="text-sm text-muted-foreground font-medium">— {quote.author}</p>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Walking Timer Quotes */}
          {quotes.walking_timer_quotes && quotes.walking_timer_quotes.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Footprints className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold text-foreground">Walking Timer Quotes</h3>
              </div>
              <div className="space-y-2">
                {quotes.walking_timer_quotes.map((quote, index) => (
                  <Card key={`walking-${index}`} className="p-4 hover:bg-accent/50 cursor-pointer transition-colors" onClick={() => handleSelectQuote(quote)}>
                    <p className="text-foreground mb-2 leading-relaxed">"{quote.text}"</p>
                    {quote.author && (
                      <p className="text-sm text-muted-foreground font-medium">— {quote.author}</p>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* No quotes available */}
          {(!quotes.fasting_timer_quotes || quotes.fasting_timer_quotes.length === 0) &&
           (!quotes.walking_timer_quotes || quotes.walking_timer_quotes.length === 0) && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No quotes are currently available.</p>
              <p className="text-sm text-muted-foreground mt-2">
                Contact your administrator to add inspirational quotes.
              </p>
            </div>
          )}
        </div>

        <Separator />
        
        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}