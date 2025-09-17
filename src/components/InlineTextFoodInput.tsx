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
      // Send directly to AI like voice input does
      const { data, error } = await supabase.functions.invoke('chat-completion', {
        body: {
          messages: [
            { 
              role: 'system', 
              content: 'You are a focused food tracking assistant. Extract ONLY the food items mentioned by the user and return them with proper nutrition data. NEVER add foods not explicitly mentioned by the user.' 
            },
            { role: 'user', content: inputText.trim() }
          ],
          context: 'food_only'
        }
      });

      if (error) throw error;

      // Handle successful AI parsing
      if (data.functionCall?.name === 'add_multiple_foods' && data.functionCall?.arguments?.foods) {
        const suggestion: FoodSuggestion = {
          foods: data.functionCall.arguments.foods,
          destination: 'today'
        };
        setFoodSuggestion(suggestion);
        setSelectedFoodIds(new Set(suggestion.foods.map((_, index) => index)));
        setShowFoodModal(true);
        
        toast({
          title: "✓ Food Recognized",
          description: `Found ${suggestion.foods.length} food item${suggestion.foods.length === 1 ? '' : 's'}`,
          className: "bg-green-600 text-white border-0",
          duration: 2000,
        });
        return;
      }

      // If AI couldn't parse it, show helpful message
      toast({
        title: "Need More Details", 
        description: data.completion || "Please be more specific (e.g., '2 apples' or '100g chicken')",
        variant: "default",
      });
    } catch (error) {
      console.error('Error processing food input:', error);
      toast({
        title: "Error",
        description: "Failed to process food input",
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
          className="w-8 h-8 p-0 rounded-full bg-background/80 backdrop-blur-sm border border-subtle hover:bg-muted/80 hover:scale-110 transition-all duration-200"
          title="Add food with text"
        >
          <Plus className="w-4 h-4 text-foreground" />
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
      {/* Overlay backdrop for click-outside-to-close */}
      <div 
        className="fixed inset-0 z-40"
        onClick={handleCancel}
      />
      
      {/* Dropdown overlay - perfectly centered on mobile */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[calc(100vw-2rem)] max-w-sm mx-auto p-4 bg-background/95 backdrop-blur-sm rounded-lg border border-subtle shadow-lg">
        <div className="w-full max-w-xs mx-auto">{/* Container to center content within the modal */}
          <div className="flex items-center gap-3">
            <Input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter food (e.g., pasta, apple, chicken)..."
              className="flex-1 h-10 text-sm text-center border border-subtle bg-background/80 placeholder:text-muted-foreground/70 focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-ring"
              autoFocus
              disabled={isProcessing}
            />
            <Button
              onClick={handleSubmit}
              disabled={!inputText.trim() || isProcessing}
              size="sm"
              variant="default"
              className="shrink-0 h-10 px-4 rounded-full"
              title="Add food"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Add
                </>
              )}
            </Button>
          </div>
        </div>
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