import React, { useState } from 'react';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useQuoteSettings, Quote } from '@/hooks/useQuoteSettings';


interface QuoteEditModalProps {
  quote?: Quote;
  isOpen: boolean;
  onSave: (quote: Quote) => void;
  onClose: () => void;
}

const QuoteEditModal: React.FC<QuoteEditModalProps> = ({ quote, isOpen, onSave, onClose }) => {
  const [text, setText] = useState(quote?.text || '');
  const [author, setAuthor] = useState(quote?.author || '');

  const handleSave = () => {
    if (!text.trim()) return;
    onSave({
      text: text.trim(),
      author: author.trim() || undefined
    });
    setText('');
    setAuthor('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg shadow-lg max-w-md w-full p-6">
        <h3 className="text-lg font-semibold mb-4">
          {quote ? 'Edit Quote' : 'Add New Quote'}
        </h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Quote Text *</label>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter the inspirational quote..."
              rows={3}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Author (optional)</label>
            <Input
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="e.g., Maya Angelou"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!text.trim()}>
              {quote ? 'Update' : 'Add'} Quote
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const AdminQuoteSettings: React.FC = () => {
  const { quotes, loading, updateQuotes } = useQuoteSettings();
  const [editingQuote, setEditingQuote] = useState<{ quote?: Quote; index?: number; type?: string } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const { toast } = useToast();

  const handleAddQuote = (type: 'fasting_timer_quotes' | 'walking_timer_quotes') => {
    setEditingQuote({ type });
    setShowModal(true);
  };

  const handleEditQuote = (quote: Quote, index: number, type: 'fasting_timer_quotes' | 'walking_timer_quotes') => {
    setEditingQuote({ quote, index, type });
    setShowModal(true);
  };

  const handleDeleteQuote = async (index: number, type: 'fasting_timer_quotes' | 'walking_timer_quotes') => {
    const currentQuotes = [...quotes[type]];
    currentQuotes.splice(index, 1);
    
    const result = await updateQuotes(type, currentQuotes);
    if (result.success) {
      toast({
        title: "Quote deleted",
        description: "Quote has been removed successfully."
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to delete quote. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleSaveQuote = async (newQuote: Quote) => {
    if (!editingQuote?.type) return;

    const type = editingQuote.type as 'fasting_timer_quotes' | 'walking_timer_quotes';
    const currentQuotes = [...quotes[type]];
    
    if (editingQuote.index !== undefined) {
      // Editing existing quote
      currentQuotes[editingQuote.index] = newQuote;
    } else {
      // Adding new quote
      currentQuotes.push(newQuote);
    }

    const result = await updateQuotes(type, currentQuotes);
    if (result.success) {
      toast({
        title: editingQuote.index !== undefined ? "Quote updated" : "Quote added",
        description: "Quote has been saved successfully."
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to save quote. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return <div className="text-center py-4">Loading quotes...</div>;
  }

  return (
    <>
      <Card className="mt-8">
        <CardContent className="space-y-6 p-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium mt-2">Fasting Timer Quotes</h3>
              <Button size="sm" onClick={() => handleAddQuote('fasting_timer_quotes')}>
                <Plus className="w-4 h-4 mr-2" />
                Add
              </Button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {quotes.fasting_timer_quotes.map((quote, index) => (
                <div key={index} className="flex items-start gap-3 p-2 border rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm italic">"{quote.text}"</p>
                    {quote.author && (
                      <p className="text-xs text-muted-foreground mt-1">— {quote.author}</p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => handleEditQuote(quote, index, 'fasting_timer_quotes')}>
                      <Edit2 className="w-3 h-3" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDeleteQuote(index, 'fasting_timer_quotes')}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-2 text-xs text-muted-foreground">{quotes.fasting_timer_quotes.length} quotes</div>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-8">
        <CardContent className="space-y-6 p-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium mt-2">Walking Timer Quotes</h3>
              <Button size="sm" onClick={() => handleAddQuote('walking_timer_quotes')}>
                <Plus className="w-4 h-4 mr-2" />
                Add
              </Button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {quotes.walking_timer_quotes.map((quote, index) => (
                <div key={index} className="flex items-start gap-3 p-2 border rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm italic">"{quote.text}"</p>
                    {quote.author && (
                      <p className="text-xs text-muted-foreground mt-1">— {quote.author}</p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => handleEditQuote(quote, index, 'walking_timer_quotes')}>
                      <Edit2 className="w-3 h-3" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDeleteQuote(index, 'walking_timer_quotes')}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-2 text-xs text-muted-foreground">{quotes.walking_timer_quotes.length} quotes</div>
          </div>

          <QuoteEditModal
            quote={editingQuote?.quote}
            isOpen={showModal}
            onSave={handleSaveQuote}
            onClose={() => {
              setShowModal(false);
              setEditingQuote(null);
            }}
          />
        </CardContent>
      </Card>
    </>
  );
};