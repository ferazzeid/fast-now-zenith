import { useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAccess } from '@/hooks/useAccess';
import { FoodSelectionModal } from './FoodSelectionModal';

interface InlineTextFoodInputProps {
  onFoodAdded?: (foods: any[]) => void;
}

interface FoodItem {
  name: string;
  serving_size: number;
  calories: number;
  carbs: number;
  image_url?: string;
}

interface FoodSuggestion {
  foods: FoodItem[];
  destination?: 'today' | 'template' | 'library';
  added?: boolean;
}

export const InlineTextFoodInput = ({ onFoodAdded }: InlineTextFoodInputProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [foodSuggestion, setFoodSuggestion] = useState<FoodSuggestion | null>(null);
  const [showFoodModal, setShowFoodModal] = useState(false);
  const [selectedFoodIds, setSelectedFoodIds] = useState<Set<number>>(new Set());
  const { toast } = useToast();
  const { hasAIAccess } = useAccess();

  const handleSubmit = async () => {
    if (!inputText.trim() || isProcessing) return;

    if (!hasAIAccess) {
      toast({
        title: "Premium Feature",
        description: "AI food parsing requires premium access.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('chat-completion', {
        body: {
          messages: [{ role: 'user', content: inputText }],
          context: 'food_only'
        }
      });

      if (error) throw error;

      // Check if AI is asking for clarification
      if (data.completion && !data.functionCall) {
        // If AI asks for more details, show helpful message
        if (data.completion.toLowerCase().includes('more details') || 
            data.completion.toLowerCase().includes('serving size') ||
            data.completion.toLowerCase().includes('quantity')) {
          toast({
            title: "Need More Details",
            description: data.completion,
            variant: "default",
          });
          setIsProcessing(false);
          return;
        }
      }

      // Handle function call response
      if (data.functionCall?.name === 'add_multiple_foods' && data.functionCall?.arguments?.foods) {
        const suggestion: FoodSuggestion = {
          foods: data.functionCall.arguments.foods,
          destination: 'today'
        };
        setFoodSuggestion(suggestion);
        // Pre-select all foods
        setSelectedFoodIds(new Set(suggestion.foods.map((_, index) => index)));
        setShowFoodModal(true);
      } else {
        throw new Error('No food items could be parsed from your input');
      }
    } catch (error) {
      console.error('Error processing food input:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to process food input",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFoodUpdate = (index: number, updates: Partial<FoodItem>) => {
    if (foodSuggestion) {
      const updatedFoods = [...foodSuggestion.foods];
      updatedFoods[index] = { ...updatedFoods[index], ...updates };
      setFoodSuggestion({ ...foodSuggestion, foods: updatedFoods });
    }
  };

  const handleFoodRemove = (index: number) => {
    if (foodSuggestion) {
      const updatedFoods = foodSuggestion.foods.filter((_, i) => i !== index);
      setFoodSuggestion({ ...foodSuggestion, foods: updatedFoods });
      
      // Update selected IDs to account for removed food
      const newSelectedIds = new Set<number>();
      selectedFoodIds.forEach(id => {
        if (id < index) {
          newSelectedIds.add(id);
        } else if (id > index) {
          newSelectedIds.add(id - 1);
        }
      });
      setSelectedFoodIds(newSelectedIds);
    }
  };

  const handleDestinationChange = (destination: 'today' | 'template' | 'library') => {
    if (foodSuggestion) {
      setFoodSuggestion({ ...foodSuggestion, destination });
    }
  };

  const handleAddFoods = async () => {
    if (!foodSuggestion) return;
    
    const selectedFoods = Array.from(selectedFoodIds).map(id => foodSuggestion.foods[id]).filter(Boolean);
    
    if (selectedFoods.length === 0) {
      toast({
        title: "No foods selected",
        description: "Please select at least one food to add.",
        variant: "destructive"
      });
      return;
    }

    try {
      if (onFoodAdded) {
        onFoodAdded(selectedFoods);
      }
      
      toast({
        title: "✅ Foods Added",
        description: `Added ${selectedFoods.length} food${selectedFoods.length === 1 ? '' : 's'} to today's plan`,
      });
      
      handleModalClose();
    } catch (error) {
      console.error('Error adding foods:', error);
      toast({
        title: "Error",
        description: "Failed to add foods. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleModalClose = () => {
    setShowFoodModal(false);
    setInputText('');
    setIsOpen(false);
    setFoodSuggestion(null);
    setSelectedFoodIds(new Set());
  };

  const handleCancel = () => {
    setIsOpen(false);
    setInputText('');
    setIsProcessing(false);
  };

  if (!isOpen) {
    return (
      <>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(true)}
          className="w-8 h-8 p-0 rounded-full bg-ceramic-plate/80 backdrop-blur-sm border-ceramic-shadow hover:bg-ceramic-plate hover:scale-110 transition-all duration-200"
          title="Add food with text"
        >
          <Plus className="w-4 h-4 text-warm-text" />
        </Button>

        {/* Food Selection Modal */}
        <FoodSelectionModal
          isOpen={showFoodModal}
          onClose={handleModalClose}
          foodSuggestion={foodSuggestion}
          selectedFoodIds={selectedFoodIds}
          onSelectionChange={setSelectedFoodIds}
          onFoodUpdate={handleFoodUpdate}
          onFoodRemove={handleFoodRemove}
          onDestinationChange={handleDestinationChange}
          onAddFoods={handleAddFoods}
          isProcessing={false}
        />
      </>
    );
  }

  return (
    <>
      <div className="flex items-center gap-2 p-2 bg-ceramic-plate/90 backdrop-blur-sm rounded-2xl border border-ceramic-shadow shadow-ceramic-shadow/20">
        <Input
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type food (e.g., '2 apples, pasta')"
          className="border-0 bg-transparent text-sm placeholder:text-warm-text/60 focus-visible:ring-0"
          autoFocus
          disabled={isProcessing}
        />
        <Button
          onClick={handleSubmit}
          disabled={!inputText.trim() || isProcessing}
          size="sm"
          className="shrink-0 h-8 px-3 bg-gradient-primary hover:bg-gradient-primary/90 text-white border-0"
        >
          {isProcessing ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Plus className="w-3 h-3" />
          )}
        </Button>
        <Button
          onClick={handleCancel}
          variant="ghost"
          size="sm"
          className="shrink-0 h-8 w-8 p-0 hover:bg-ceramic-shadow/20"
        >
          ×
        </Button>
      </div>

      {/* Food Selection Modal */}
      <FoodSelectionModal
        isOpen={showFoodModal}
        onClose={handleModalClose}
        foodSuggestion={foodSuggestion}
        selectedFoodIds={selectedFoodIds}
        onSelectionChange={setSelectedFoodIds}
        onFoodUpdate={handleFoodUpdate}
        onFoodRemove={handleFoodRemove}
        onDestinationChange={handleDestinationChange}
        onAddFoods={handleAddFoods}
        isProcessing={false}
      />
    </>
  );
};