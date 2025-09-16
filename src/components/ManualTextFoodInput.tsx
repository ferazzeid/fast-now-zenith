import React, { useState } from 'react';
import { Plus, Type, Lock, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UniversalModal } from '@/components/ui/universal-modal';
import { FoodSelectionModal } from '@/components/FoodSelectionModal';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAccess } from '@/hooks/useAccess';
import { showAIAccessError } from '@/components/AIRequestLimitToast';
import { cn } from '@/lib/utils';

interface ManualTextFoodInputProps {
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

export const ManualTextFoodInput = ({ onFoodAdded }: ManualTextFoodInputProps) => {
  const [showTextModal, setShowTextModal] = useState(false);
  const [showFoodModal, setShowFoodModal] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [foodSuggestion, setFoodSuggestion] = useState<FoodSuggestion | null>(null);
  const [selectedFoodIds, setSelectedFoodIds] = useState<Set<number>>(new Set());
  
  const { toast } = useToast();
  const { access_level, hasAIAccess, createSubscription } = useAccess();
  const hasAccess = access_level === 'admin' || hasAIAccess;

  const handleButtonClick = () => {
    if (!hasAccess) {
      showAIAccessError(toast, createSubscription);
      return;
    }
    setShowTextModal(true);
  };

  const handleTextSubmit = async () => {
    if (!textInput.trim()) {
      toast({
        title: "No text entered",
        description: "Please enter a food description.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    try {
      const { data, error } = await supabase.functions.invoke('chat-completion', {
        body: {
          messages: [
            { 
              role: 'system', 
              content: `You are a focused food tracking assistant. Extract food items from user input and return them with proper nutrition data. 

IMPORTANT: When users don't specify quantities, use standard serving sizes:
- Pasta/rice/grains: 75g dry weight (≈200g cooked)
- Bread: 2 medium slices (≈60g)
- Fruits (apple, orange, banana): 1 medium piece (≈150-180g)
- Vegetables: 1 cup chopped (≈100-150g depending on vegetable)
- Meat/fish: 150g portion
- Chicken breast: 150g
- Eggs: 2 large eggs (≈100g)
- Cheese: 30g portion
- Nuts: 30g portion
- Milk: 250ml (1 cup)
- Yogurt: 150g container
- Cooking oil: 1 tablespoon (≈15ml)

Always return food items with realistic serving sizes that users can easily adjust.` 
            },
            { role: 'user', content: textInput }
          ],
          context: 'food_only'
        }
      });

      if (error) throw error;

      if (data?.functionCall?.name === 'add_multiple_foods') {
        const foods = data.functionCall.arguments.foods || [];
        
        if (foods.length > 0) {
          setFoodSuggestion({
            foods,
            destination: 'today',
            added: false
          });
          setSelectedFoodIds(new Set(foods.map((_: any, index: number) => index)));
          setShowTextModal(false);
          setShowFoodModal(true);
        } else {
          toast({
            title: "No foods detected",
            description: "I couldn't identify any foods from your text. Try being more specific.",
            variant: "destructive"
          });
        }
      } else if (data?.completion) {
        // Handle case where AI asks for clarification
        toast({
          title: "Need more details", 
          description: data.completion,
          variant: "default"
        });
      } else {
        toast({
          title: "Processing failed",
          description: "I couldn't process your text input. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Text food processing error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Could not process text input';
      toast({
        title: "Processing Failed", 
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTextModalClose = () => {
    setShowTextModal(false);
    setTextInput('');
  };

  const handleFoodModalClose = () => {
    setShowFoodModal(false);
    setFoodSuggestion(null);
    setSelectedFoodIds(new Set());
  };

  const handleFoodUpdate = (index: number, updates: Partial<FoodItem>) => {
    if (!foodSuggestion) return;
    
    const updatedFoods = [...foodSuggestion.foods];
    updatedFoods[index] = { ...updatedFoods[index], ...updates };
    
    setFoodSuggestion({
      ...foodSuggestion,
      foods: updatedFoods
    });
  };

  const handleFoodRemove = (index: number) => {
    if (!foodSuggestion) return;
    
    const updatedFoods = foodSuggestion.foods.filter((_, i) => i !== index);
    setFoodSuggestion({
      ...foodSuggestion,
      foods: updatedFoods
    });
    
    const newSelectedIds = new Set<number>();
    selectedFoodIds.forEach(id => {
      if (id < index) {
        newSelectedIds.add(id);
      } else if (id > index) {
        newSelectedIds.add(id - 1);
      }
    });
    setSelectedFoodIds(newSelectedIds);
  };

  const handleDestinationChange = (destination: 'today' | 'template' | 'library') => {
    if (!foodSuggestion) return;
    
    setFoodSuggestion({
      ...foodSuggestion,
      destination
    });
  };

  const handleAddFoods = async () => {
    if (!foodSuggestion) return;
    
    const selectedFoods = foodSuggestion.foods.filter((_, index) => selectedFoodIds.has(index));
    
    if (selectedFoods.length === 0) {
      toast({
        title: "No foods selected",
        description: "Please select at least one food to add.",
        variant: "destructive"
      });
      return;
    }

    try {
      onFoodAdded?.(selectedFoods);
      
      toast({
        title: "✅ Foods Added",
        description: `Added ${selectedFoods.length} food${selectedFoods.length === 1 ? '' : 's'} to today's plan`,
      });
      
      handleFoodModalClose();
      setTextInput('');
    } catch (error) {
      console.error('Error adding foods:', error);
      toast({
        title: "Error",
        description: "Failed to add foods. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <>
      <Button 
        variant="ghost"
        size="sm"
        className="w-8 h-8 p-0 rounded-full bg-ceramic-plate/80 backdrop-blur-sm border-ceramic-shadow hover:bg-ceramic-plate hover:scale-110 transition-all duration-200"
        onClick={handleButtonClick}
        title={hasAccess ? "Add food manually by typing" : "Manual text input (Premium Feature)"}
        aria-label={hasAccess ? "Add food manually by typing" : "Manual text input (Premium Feature)"}
      >
        {hasAccess ? <Type className="w-4 h-4 text-warm-text" /> : <Lock className="w-4 h-4 text-warm-text" />}
      </Button>

      {/* Text Input Modal */}
      <UniversalModal
        isOpen={showTextModal}
        onClose={handleTextModalClose}
        title="Add Food"
        variant="standard"
        size="sm"
        showCloseButton={false}
        closeOnOverlay={true}
        className="w-[calc(100vw-2rem)] max-w-sm mx-auto"
      >
        <div className="space-y-6 p-2">
          <Input
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Enter food (e.g., pasta, apple, chicken)..."
            className="text-center h-12 text-base border-2 focus-visible:ring-2 focus-visible:ring-ring"
            autoFocus
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !isProcessing && textInput.trim()) {
                handleTextSubmit();
              }
            }}
          />
          
          <Button
            onClick={handleTextSubmit}
            disabled={!textInput.trim() || isProcessing}
            className="w-full h-12 text-base font-semibold"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Processing...
              </>
            ) : (
              'Add Food'
            )}
          </Button>
        </div>
      </UniversalModal>

      {/* Food Selection Modal */}
      <FoodSelectionModal
        isOpen={showFoodModal}
        onClose={handleFoodModalClose}
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