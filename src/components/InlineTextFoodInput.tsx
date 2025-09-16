import { useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAccess } from '@/hooks/useAccess';
import { FoodSelectionModal } from './FoodSelectionModal';
import { parseVoiceFoodInput } from '@/utils/voiceParsing';

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

    setIsProcessing(true);
    
    try {
      // Use the same parsing logic as voice input
      const parsedResult = parseVoiceFoodInput(inputText.trim());
      console.log('Parsed result:', parsedResult);
      
      // Always use local parsing if we have a food name - no AI fallback for simple foods
      if (parsedResult.foodName) {
        // Convert parsed result to food item format
        const foodItem: FoodItem = {
          name: parsedResult.foodName,
          serving_size: getServingSize(parsedResult),
          calories: getCalories(parsedResult.foodName, getServingSize(parsedResult)),
          carbs: getCarbs(parsedResult.foodName, getServingSize(parsedResult))
        };

        const suggestion: FoodSuggestion = {
          foods: [foodItem],
          destination: 'today'
        };
        
        setFoodSuggestion(suggestion);
        setSelectedFoodIds(new Set([0]));
        setShowFoodModal(true);
        
        toast({
          title: "✓ Food Recognized",
          description: `${foodItem.name} (${foodItem.serving_size}g)`,
          className: "bg-green-600 text-white border-0",
          duration: 2000,
        });
      } else {
        // Only fallback to AI for completely unrecognizable input
        toast({
          title: "Need More Details",
          description: "Please be more specific (e.g., '2 apples' or '100g chicken')",
          variant: "default",
        });
      }
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

  const getServingSize = (parsed: any) => {
    if (parsed.amount && parsed.unit) {
      // Convert different units to grams
      switch (parsed.unit) {
        case 'kg': return parsed.amount * 1000;
        case 'g': return parsed.amount;
        case 'cup': return parsed.amount * 100; // Approximate
        case 'piece': 
        case 'slice': return parsed.amount * 100; // Standard piece size
        default: return parsed.amount;
      }
    }
    
    // Standard serving sizes for common foods
    const foodName = parsed.foodName?.toLowerCase() || '';
    if (foodName.includes('pasta') || foodName.includes('rice')) return 75;
    if (foodName.includes('apple') || foodName.includes('banana')) return 150;
    if (foodName.includes('chicken') || foodName.includes('meat')) return 150;
    if (foodName.includes('bread')) return 60;
    if (foodName.includes('egg')) return 100;
    
    return 100; // Default serving size
  };

  const getCalories = (foodName: string, servingSize: number) => {
    const name = foodName.toLowerCase();
    let caloriesPer100g = 100; // Default

    // Common food calorie values per 100g
    if (name.includes('pasta')) caloriesPer100g = 364;
    else if (name.includes('rice')) caloriesPer100g = 365;
    else if (name.includes('apple')) caloriesPer100g = 52;
    else if (name.includes('banana')) caloriesPer100g = 89;
    else if (name.includes('chicken')) caloriesPer100g = 165;
    else if (name.includes('bread')) caloriesPer100g = 265;
    else if (name.includes('egg')) caloriesPer100g = 155;
    
    return Math.round((caloriesPer100g * servingSize) / 100);
  };

  const getCarbs = (foodName: string, servingSize: number) => {
    const name = foodName.toLowerCase();
    let carbsPer100g = 5; // Default

    // Common food carb values per 100g
    if (name.includes('pasta')) carbsPer100g = 76;
    else if (name.includes('rice')) carbsPer100g = 76;
    else if (name.includes('apple')) carbsPer100g = 14;
    else if (name.includes('banana')) carbsPer100g = 23;
    else if (name.includes('chicken')) carbsPer100g = 0;
    else if (name.includes('bread')) carbsPer100g = 49;
    else if (name.includes('egg')) carbsPer100g = 1;
    
    return Math.round((carbsPer100g * servingSize) / 100);
  };

  const handleAIFallback = async () => {
    if (!hasAIAccess) {
      toast({
        title: "Premium Feature",
        description: "AI food parsing requires premium access.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('chat-completion', {
        body: {
          messages: [{ role: 'user', content: inputText }],
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
        return;
      }

      // If AI couldn't parse it either, show helpful message
      toast({
        title: "Need More Details",
        description: "Please be more specific (e.g., '2 apples' or '100g chicken')",
        variant: "default",
      });
    } catch (error) {
      throw error; // Re-throw to be handled by main catch block
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
          className="w-8 h-8 p-0 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 hover:bg-muted/80 hover:scale-110 transition-all duration-200"
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
      
      {/* Dropdown overlay - centered */}
      <div className="absolute top-12 left-1/2 -translate-x-1/2 z-50 w-72 p-3 bg-background/95 backdrop-blur-sm rounded-lg border border-border shadow-md">
        <div className="flex items-center gap-2">
          <Input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type..."
            className="flex-1 h-9 text-sm border-border/50 bg-background/80 placeholder:text-muted-foreground/70 focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-ring"
            autoFocus
            disabled={isProcessing}
          />
          <Button
            onClick={handleSubmit}
            disabled={!inputText.trim() || isProcessing}
            size="sm"
            variant="default"
            className="shrink-0 h-9 w-9 p-0 rounded-full"
            title="Add food"
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
          </Button>
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