import { useState } from 'react';
import { Type } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { FoodSelectionModal } from './FoodSelectionModal';

interface InlineTextFoodInputButtonProps {
  onFoodAdded?: (foods: any[]) => void;
  className?: string;
}

interface FoodItem {
  name: string;
  serving_size: number;
  calories: number;
  carbs: number;
  calories_per_100g?: number;
  carbs_per_100g?: number;
  image_url?: string;
}

interface FoodSuggestion {
  foods: FoodItem[];
  destination?: 'today' | 'template' | 'library';
  added?: boolean;
}

export const InlineTextFoodInputButton = ({ onFoodAdded, className = "" }: InlineTextFoodInputButtonProps) => {
  const [showModal, setShowModal] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [foodSuggestion, setFoodSuggestion] = useState<FoodSuggestion | null>(null);
  const [showFoodModal, setShowFoodModal] = useState(false);
  const [selectedFoodIds, setSelectedFoodIds] = useState<Set<number>>(new Set());
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!inputText.trim() || isProcessing) return;

    setIsProcessing(true);
    
    try {
      // Send to AI for food processing
      const { data, error } = await supabase.functions.invoke('analyze-food-voice', {
        body: {
          message: inputText.trim()
        }
      });

      if (error) throw error;

      // Handle successful AI parsing
      if (data.functionCall?.name === 'add_multiple_foods' && data.functionCall?.arguments?.foods) {
        const suggestion: FoodSuggestion = {
          foods: data.functionCall.arguments.foods,
          destination: data.functionCall.arguments.destination || 'today'
        };
        setFoodSuggestion(suggestion);
        setSelectedFoodIds(new Set(suggestion.foods.map((_, index) => index)));
        setShowFoodModal(true);
        setShowModal(false);
        
        // Show different message for fallback vs AI-parsed foods
        if (data.fallbackCreated) {
          toast({
            title: "Manual Review Required",
            description: `I identified ${suggestion.foods.length} food items but need your help with nutritional information.`,
            variant: "default"
          });
        } else {
          toast({
            title: "✓ Food Recognized",
            description: `Found ${suggestion.foods.length} food item${suggestion.foods.length === 1 ? '' : 's'}`,
            className: "bg-green-600 text-white border-0",
            duration: 2000,
          });
        }
        return;
      }

      // If AI couldn't parse it, create manual fallback option
      const suggestion: FoodSuggestion = {
        foods: [{
          name: inputText.trim(),
          serving_size: 100,
          calories: 0,
          carbs: 0
        }],
        destination: 'today'
      };
      
      setFoodSuggestion(suggestion);
      setSelectedFoodIds(new Set([0]));
      setShowFoodModal(true);
      setShowModal(false);
      
      toast({
        title: "Added for Manual Entry",
        description: `"${inputText}" added with 0 values - please edit the nutritional information`,
        className: "bg-amber-600 text-white border-0",
        duration: 3000,
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
        title: "Foods Added",
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
    setShowModal(false);
    setFoodSuggestion(null);
    setSelectedFoodIds(new Set());
  };

  const handleCancel = () => {
    setShowModal(false);
    setInputText('');
    setIsProcessing(false);
  };

  return (
    <>
      <Button
        onClick={() => setShowModal(true)}
        variant="outline"
        className={`w-16 h-16 rounded-full border-border bg-background hover:bg-muted transition-colors ${className}`}
        title="AI text input"
      >
        <Type className="w-6 h-6 text-foreground" />
      </Button>

      {showModal && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={handleCancel}
          />
          
          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md p-6 bg-background border border-border rounded-lg shadow-lg">
              <h3 className="text-lg font-semibold mb-4">AI Text Input</h3>
              <div className="space-y-4">
                <Input
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter food (e.g., 2 slices of pizza)"
                  className="text-sm"
                  autoFocus
                  disabled={isProcessing}
                />
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    className="flex-1"
                    disabled={isProcessing}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={!inputText.trim() || isProcessing}
                    className="flex-1"
                  >
                    {isProcessing ? 'Processing...' : 'Analyze'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

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