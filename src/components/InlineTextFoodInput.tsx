import { useState } from 'react';
import { Plus, Loader2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAccess } from '@/hooks/useAccess';
import { FoodSelectionModal } from './FoodSelectionModal';
import { PremiumFoodModal } from './PremiumFoodModal';

interface InlineTextFoodInputProps {
  onFoodAdded?: (foods: any[]) => void;
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

export const InlineTextFoodInput = ({ onFoodAdded }: InlineTextFoodInputProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [foodSuggestion, setFoodSuggestion] = useState<FoodSuggestion | null>(null);
  const [showFoodModal, setShowFoodModal] = useState(false);
  const [selectedFoodIds, setSelectedFoodIds] = useState<Set<number>>(new Set());
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const { toast } = useToast();
  const { hasAIAccess } = useAccess();

  const handleButtonClick = () => {
    if (!hasAIAccess) {
      setShowPremiumModal(true);
      return;
    }
    setIsOpen(true);
  };

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
    setIsOpen(false);
    setFoodSuggestion(null);
    setSelectedFoodIds(new Set());
  };

  const handleCancel = () => {
    setIsOpen(false);
    setInputText('');
    setIsProcessing(false);
  };

  return (
    <div className="relative">
      {/* Plus/Lock button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleButtonClick}
        className="w-8 h-8 p-0 rounded-full bg-background/80 backdrop-blur-sm border border-subtle hover:bg-muted/80 hover:scale-110 transition-all duration-200"
        title={hasAIAccess ? "Add food with text" : "AI features require premium"}
      >
        {hasAIAccess ? (
          <Plus className="w-4 h-4 text-foreground" />
        ) : (
          <Lock className="w-4 h-4 text-muted-foreground" />
        )}
      </Button>

      {isOpen && (
        <>
          {/* Full screen overlay backdrop */}
          <div 
            className="fixed inset-0 z-40 bg-black/20"
            onClick={handleCancel}
          />
          
          {/* Centered modal-style input */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-background rounded-lg border border-border shadow-xl p-6">
              <h3 className="text-lg font-semibold mb-4 text-center">Enter Food</h3>
              <div className="flex items-center gap-3">
                <Input
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter food (e.g., apple, rice, chicken)"
                  className="flex-1 h-12 text-center text-base border-2 focus-visible:ring-2 focus-visible:ring-ring"
                  autoFocus
                  disabled={isProcessing}
                />
                <Button
                  onClick={handleSubmit}
                  disabled={!inputText.trim() || isProcessing}
                  size="lg"
                  variant="default"
                  className="shrink-0 h-12 px-6 font-semibold"
                  title="Add food"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    "Go"
                  )}
                </Button>
              </div>
              <div className="flex justify-center mt-4">
                <Button 
                  variant="ghost" 
                  onClick={handleCancel}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </Button>
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

      {/* Premium Modal for free users */}
      <PremiumFoodModal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
      />
    </div>
  );
};