import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
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
  const { 
    quotes, 
    loading, 
    updateQuotes, 
    fastingQuotesEnabled,
    walkingQuotesEnabled,
    updateQuoteStatus
  } = useQuoteSettings();
  const [editingQuote, setEditingQuote] = useState<{ quote?: Quote; index?: number; type?: string } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [toggleStates, setToggleStates] = useState({
    fasting: false,
    walking: false
  });
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

  const handleToggleQuoteStatus = async (type: 'fasting_timer_quotes_enabled' | 'walking_timer_quotes_enabled', enabled: boolean) => {
    const result = await updateQuoteStatus(type, enabled);
    if (result.success) {
      toast({
        title: "Settings updated",
        description: `${type.includes('fasting') ? 'Fasting' : 'Walking'} timer quotes ${enabled ? 'enabled' : 'disabled'}`,
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to update settings",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="text-center py-4">Loading quotes...</div>;
  }

  return (
    <>
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-base font-medium flex items-center justify-between">
            <span>Fasting Timer Quotes</span>
            <div className="flex items-center space-x-2">
              <Label htmlFor="fasting-quotes-toggle">Enable</Label>
              {toggleStates.fasting ? (
                <div className="flex items-center">
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  <span className="text-sm text-muted-foreground">Updating...</span>
                </div>
              ) : (
                <Switch
                  id="fasting-quotes-toggle"
                  checked={fastingQuotesEnabled}
                  onCheckedChange={(checked) => handleToggleQuoteStatus('fasting_timer_quotes_enabled', checked)}
                  disabled={toggleStates.fasting}
                />
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          {fastingQuotesEnabled ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <Button size="sm" onClick={() => handleAddQuote('fasting_timer_quotes')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add
                </Button>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {quotes.fasting_timer_quotes.map((quote, index) => (
                  <div key={index} className="flex items-start gap-3 p-2 border-subtle rounded-lg">
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
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>Fasting timer quotes are disabled</p>
              <p className="text-sm">Enable the toggle above to show system quotes in the fasting timer</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-base font-medium flex items-center justify-between">
            <span>Walking Timer Quotes</span>
            <div className="flex items-center space-x-2">
              <Label htmlFor="walking-quotes-toggle">Enable</Label>
              {toggleStates.walking ? (
                <div className="flex items-center">
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  <span className="text-sm text-muted-foreground">Updating...</span>
                </div>
              ) : (
                <Switch
                  id="walking-quotes-toggle"
                  checked={walkingQuotesEnabled}
                  onCheckedChange={(checked) => handleToggleQuoteStatus('walking_timer_quotes_enabled', checked)}
                  disabled={toggleStates.walking}
                />
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          {walkingQuotesEnabled ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <Button size="sm" onClick={() => handleAddQuote('walking_timer_quotes')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add
                </Button>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {quotes.walking_timer_quotes.map((quote, index) => (
                  <div key={index} className="flex items-start gap-3 p-2 border-subtle rounded-lg">
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
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>Walking timer quotes are disabled</p>
              <p className="text-sm">Enable the toggle above to show system quotes in the walking timer</p>
            </div>
          )}

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