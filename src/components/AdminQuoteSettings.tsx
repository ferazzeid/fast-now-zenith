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

  // Function to replace all quotes with the new motivational quotes
  const replaceAllQuotes = async () => {
    const newQuotes: Quote[] = [
      { text: "If you're going through hell, keep going.", author: "Winston Churchill" },
      { text: "The man who moves a mountain begins by carrying away small stones.", author: "Confucius" },
      { text: "He who has a why to live can bear almost any how.", author: "Friedrich Nietzsche" },
      { text: "Discipline equals freedom.", author: "Jocko Willink" },
      { text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author: "Will Durant (summarizing Aristotle)" },
      { text: "Fall seven times and stand up eight.", author: "Japanese proverb" },
      { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
      { text: "First you form the habit, then the habit forms you.", author: "Anonymous" },
      { text: "Suffer the pain of discipline, or suffer the pain of regret.", author: "Anonymous" },
      { text: "What you seek is seeking you.", author: "Rumi" },
      { text: "Don't wish it were easier, wish you were better.", author: "Jim Rohn" },
      { text: "Endurance is not just the ability to bear a hard thing, but to turn it into glory.", author: "William Barclay" },
      { text: "A man who is a master of patience is master of everything else.", author: "George Savile" },
      { text: "The temptation to quit will be greatest just before you are about to succeed.", author: "Chinese proverb" },
      { text: "Perseverance is not a long race; it is many short races one after the other.", author: "Walter Elliot" },
      { text: "Do not pray for an easy life, pray for the strength to endure a difficult one.", author: "Bruce Lee" },
      { text: "Hard choices, easy life. Easy choices, hard life.", author: "Jerzy Gregorek" },
      { text: "Chains of habit are too light to be felt until they are too heavy to be broken.", author: "Warren Buffett (adaptation of Samuel Johnson)" },
      { text: "When you're at the end of your rope, tie a knot and hold on.", author: "Theodore Roosevelt" },
      { text: "Strength does not come from winning. Your struggles develop your strengths.", author: "Arnold Schwarzenegger" }
    ];

    try {
      // Update both fasting and walking timer quotes with the same set
      const fastingResult = await updateQuotes('fasting_timer_quotes', newQuotes);
      const walkingResult = await updateQuotes('walking_timer_quotes', newQuotes);
      
      if (fastingResult.success && walkingResult.success) {
        toast({
          title: "Quotes Updated",
          description: "All timer quotes have been replaced with the new motivational quotes."
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to update some quotes. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update quotes. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Function to add 20 additional motivational quotes to existing ones
  const addAdditionalQuotes = async () => {
    const additionalQuotes: Quote[] = [
      { text: "He conquers who endures.", author: "Persius" },
      { text: "Patience is bitter, but its fruit is sweet.", author: "Aristotle" },
      { text: "Endurance is nobler than strength, and patience than beauty.", author: "John Ruskin" },
      { text: "If you can't fly then run, if you can't run then walk, if you can't walk then crawl; but whatever you do, you have to keep moving forward.", author: "Martin Luther King Jr." },
      { text: "The last of human freedoms is to choose one's attitude in any given set of circumstances.", author: "Viktor Frankl" },
      { text: "We do not rise to the level of our expectations; we fall to the level of our training.", author: "Archilochus" },
      { text: "Energy and persistence conquer all things.", author: "Benjamin Franklin" },
      { text: "The bamboo that bends is stronger than the oak that resists.", author: "Japanese proverb" },
      { text: "The man who masters himself is delivered from all others.", author: "Johann Wolfgang von Goethe" },
      { text: "A warrior lives by acting, not by thinking about acting.", author: "Carlos Castaneda" },
      { text: "Not everything that is faced can be changed, but nothing can be changed until it is faced.", author: "James Baldwin" },
      { text: "Sometimes survival is an act of defiance.", author: "Anonymous" },
      { text: "The greatest test of courage on earth is to bear defeat without losing heart.", author: "Robert Green Ingersoll" },
      { text: "A hero is an ordinary individual who finds the strength to persevere and endure in spite of overwhelming obstacles.", author: "Christopher Reeve" },
      { text: "The will to win means nothing without the will to prepare.", author: "Juma Ikangaa" },
      { text: "You can't cross the sea merely by standing and staring at the water.", author: "Rabindranath Tagore" },
      { text: "A diamond is a lump of coal that stuck with it under pressure.", author: "Anonymous" },
      { text: "Pain is inevitable. Suffering is optional.", author: "Haruki Murakami" },
      { text: "An ounce of patience is worth more than a ton of preaching.", author: "Dutch proverb" },
      { text: "Great works are performed not by strength but by perseverance.", author: "Samuel Johnson" }
    ];

    try {
      // Get current quotes and append the new ones
      const currentFastingQuotes = [...quotes.fasting_timer_quotes, ...additionalQuotes];
      const currentWalkingQuotes = [...quotes.walking_timer_quotes, ...additionalQuotes];
      
      // Update both sections with the combined quotes
      const fastingResult = await updateQuotes('fasting_timer_quotes', currentFastingQuotes);
      const walkingResult = await updateQuotes('walking_timer_quotes', currentWalkingQuotes);
      
      if (fastingResult.success && walkingResult.success) {
        toast({
          title: "Quotes Added",
          description: "20 additional motivational quotes have been added to both timer sections."
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to add some quotes. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add quotes. Please try again.",
        variant: "destructive"
      });
    }
  };

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
      {/* Quote Management Actions */}
      <Card className="mt-8">
        <CardContent className="p-6">
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <h3 className="text-lg font-medium">Replace All Timer Quotes</h3>
              <p className="text-sm text-muted-foreground">
                Click below to replace all existing quotes in both Fasting Timer and Walking Timer sections with the new motivational quotes.
              </p>
              <Button 
                onClick={replaceAllQuotes}
                variant="destructive"
                className="px-6"
              >
                Replace All Quotes with New Set
              </Button>
            </div>
            
            <div className="border-t pt-6">
              <div className="text-center space-y-4">
                <h3 className="text-lg font-medium">Add Additional Quotes</h3>
                <p className="text-sm text-muted-foreground">
                  Add 20 more motivational quotes to the existing quotes in both timer sections.
                </p>
                <Button 
                  onClick={addAdditionalQuotes}
                  variant="default"
                  className="px-6"
                >
                  Add 20 More Quotes
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
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