import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { UniversalModal } from '@/components/ui/universal-modal';
import { AlertCircle, Edit, X, Calculator, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { capitalizeFoodName } from '@/utils/textUtils';
import { 
  EnhancedFoodItem, 
  updateFoodItemWithRecalculation, 
  resetToCalculatedValues,
  isNutritionCalculated 
} from '@/utils/nutritionCalculations';

interface FoodItem extends EnhancedFoodItem {}

interface FoodSuggestion {
  foods: FoodItem[];
  destination?: 'today' | 'template' | 'library';
  added?: boolean;
  originalTranscription?: string; // Store original voice input for user reference
}

interface FoodSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  foodSuggestion: FoodSuggestion | null;
  selectedFoodIds: Set<number>;
  onSelectionChange: (selectedIds: Set<number>) => void;
  onFoodUpdate: (index: number, updates: Partial<FoodItem>) => void;
  onFoodRemove: (index: number) => void;
  onDestinationChange: (destination: 'today' | 'template' | 'library') => void;
  onAddFoods: () => Promise<void>;
  isProcessing: boolean;
}

interface InlineEditData {
  [key: number]: {
    name?: string;
    portion?: string;
    calories?: string;
    carbs?: string;
  };
}

export const FoodSelectionModal = ({
  isOpen,
  onClose,
  foodSuggestion,
  selectedFoodIds,
  onSelectionChange,
  onFoodUpdate,
  onFoodRemove,
  onDestinationChange,
  onAddFoods,
  isProcessing
}: FoodSelectionModalProps) => {
  const [editingFoodIndex, setEditingFoodIndex] = useState<number | null>(null);
  const [inlineEditData, setInlineEditData] = useState<InlineEditData>({});
  const { toast } = useToast();

  if (!foodSuggestion?.foods) return null;

  const handleInlineEdit = (index: number) => {
    const food = foodSuggestion.foods[index];
    setInlineEditData(prev => ({
      ...prev,
      [index]: {
        name: food.name,
        portion: food.serving_size.toString(),
        calories: food.calories.toString(),
        carbs: food.carbs.toString()
      }
    }));
    setEditingFoodIndex(index);
  };

  const handleSaveInlineEdit = (index: number) => {
    const editData = inlineEditData[index];
    if (editData) {
      const currentFood = foodSuggestion.foods[index];
      const updates: Partial<EnhancedFoodItem> = {};
      
      if (editData.name) updates.name = capitalizeFoodName(editData.name);
      if (editData.portion) updates.serving_size = parseFloat(editData.portion);
      if (editData.calories) updates.calories = parseFloat(editData.calories);
      if (editData.carbs) updates.carbs = parseFloat(editData.carbs);
      
      // Use smart recalculation logic
      const updatedFood = updateFoodItemWithRecalculation(currentFood, updates);
      onFoodUpdate(index, updatedFood);
      
      setEditingFoodIndex(null);
      setInlineEditData(prev => {
        const updated = { ...prev };
        delete updated[index];
        return updated;
      });
    }
  };

  const handleResetToCalculated = (index: number) => {
    const currentFood = foodSuggestion.foods[index];
    const resetFood = resetToCalculatedValues(currentFood);
    onFoodUpdate(index, resetFood);
    
    // Update inline edit data to reflect the reset values
    setInlineEditData(prev => ({
      ...prev,
      [index]: {
        ...prev[index],
        calories: resetFood.calories.toString(),
        carbs: resetFood.carbs.toString()
      }
    }));
    
    toast({
      title: "Values Reset",
      description: "Calories and carbs have been recalculated from weight.",
    });
  };

  const handleWeightChange = (index: number, newWeight: string) => {
    const weightValue = parseFloat(newWeight);
    if (!isNaN(weightValue) && weightValue > 0) {
      const currentFood = foodSuggestion.foods[index];
      const updatedFood = updateFoodItemWithRecalculation(currentFood, { serving_size: weightValue });
      
      // Update inline edit data to show recalculated values
      setInlineEditData(prev => ({
        ...prev,
        [index]: {
          ...prev[index],
          portion: newWeight,
          calories: updatedFood.calories.toString(),
          carbs: updatedFood.carbs.toString()
        }
      }));
    } else {
      // Just update the weight field without recalculation
      setInlineEditData(prev => ({
        ...prev,
        [index]: { ...prev[index], portion: newWeight }
      }));
    }
  };

  const handleCancelInlineEdit = (index: number) => {
    setEditingFoodIndex(null);
    setInlineEditData(prev => {
      const updated = { ...prev };
      delete updated[index];
      return updated;
    });
  };

  const handleAddSelectedFoods = async () => {
    if (selectedFoodIds.size === 0) {
      toast({
        title: "No foods selected",
        description: "Please select at least one food to add.",
        variant: "destructive"
      });
      return;
    }

    // Check for unrealistic calorie totals and warn user
    const totalCalories = selectedCalories;
    if (totalCalories > 3000) {
      toast({
        title: "High calorie warning",
        description: `${totalCalories} calories seems very high. Please double-check your portions.`,
        variant: "destructive"
      });
      return;
    }

    await onAddFoods();
  };

  const selectedCalories = Array.from(selectedFoodIds).reduce((sum: number, index) => {
    const food = foodSuggestion.foods[index];
    return sum + (food?.calories || 0);
  }, 0);

  const selectedCarbs = Math.round(Array.from(selectedFoodIds).reduce((sum: number, index) => {
    const food = foodSuggestion.foods[index];
    return sum + (food?.carbs || 0);
  }, 0));

  return (
    <UniversalModal
      isOpen={isOpen}
      onClose={onClose}
      title="Review Foods"
      variant="standard"
      size="md"
      showCloseButton={true}
    >
      <div className="space-y-4">
        {/* Summary Card */}
        <Card className="p-3 bg-muted/50">
          <div className="text-sm font-medium">
            Selected: {selectedCalories} calories, {selectedCarbs}g carbs
            {foodSuggestion.added && (
              <span className="ml-2 text-green-600 text-xs">✅ Added to log</span>
            )}
          </div>
        </Card>

        {/* Manual Entry Indicator */}
        {foodSuggestion.foods.some(food => (food as any).needsManualInput) && (
          <Card className="p-3 bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-800">
            <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span className="font-medium">Manual review required</span>
              <span>- Please verify and adjust the nutritional information</span>
            </div>
          </Card>
        )}

        {/* Original Voice Input Display */}
        {foodSuggestion.originalTranscription && (
          <Card className="p-3 bg-muted/30 border border-muted-foreground/20">
            <div className="text-xs text-muted-foreground mb-1">What I heard:</div>
            <div className="text-sm font-medium">
              "{foodSuggestion.originalTranscription}"
            </div>
          </Card>
        )}

        {/* Food Items */}
        <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
          {foodSuggestion.foods.map((food: FoodItem, index: number) => (
            <Card key={index} className="p-3 bg-background">
              {editingFoodIndex === index ? (
                // Inline editing mode
                <div className="space-y-2">
                  <Input
                    value={inlineEditData[index]?.name || ''}
                    onChange={(e) => setInlineEditData(prev => ({
                      ...prev,
                      [index]: { ...prev[index], name: e.target.value }
                    }))}
                    placeholder="Food name"
                    className="h-8 text-sm"
                  />
                  <div className="grid grid-cols-3 gap-1">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                        Weight (g)
                        <span title="Master field - changes will recalculate nutrition">
                          <Calculator className="w-3 h-3 text-primary" />
                        </span>
                      </div>
                      <Input
                        type="number"
                        value={inlineEditData[index]?.portion || ''}
                        onChange={(e) => handleWeightChange(index, e.target.value)}
                        className="h-8 text-sm border-primary/30"
                        placeholder="Weight in grams"
                      />
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                        Calories
                        {isNutritionCalculated(foodSuggestion.foods[index]).calories && (
                          <span title="Auto-calculated from weight">
                            <Calculator className="w-3 h-3 text-green-600" />
                          </span>
                        )}
                      </div>
                      <Input
                        type="number"
                        value={inlineEditData[index]?.calories || ''}
                        onChange={(e) => setInlineEditData(prev => ({
                          ...prev,
                          [index]: { ...prev[index], calories: e.target.value }
                        }))}
                        className="h-8 text-sm"
                        placeholder="Calories"
                      />
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                        Carbs (g)
                        {isNutritionCalculated(foodSuggestion.foods[index]).carbs && (
                          <span title="Auto-calculated from weight">
                            <Calculator className="w-3 h-3 text-green-600" />
                          </span>
                        )}
                      </div>
                      <Input
                        type="number"
                        value={inlineEditData[index]?.carbs || ''}
                        onChange={(e) => setInlineEditData(prev => ({
                          ...prev,
                          [index]: { ...prev[index], carbs: e.target.value }
                        }))}
                        className="h-8 text-sm"
                        placeholder="Carbs in grams"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    {(foodSuggestion.foods[index].calories_manually_set || foodSuggestion.foods[index].carbs_manually_set) && (
                      <div className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                        <Calculator className="w-3 h-3" />
                        <span>Manual values - auto-calculation disabled</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleResetToCalculated(index)}
                          className="h-5 w-5 p-0 ml-auto"
                          title="Reset to calculated values"
                        >
                          <RotateCcw className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        onClick={() => handleSaveInlineEdit(index)}
                        className="h-8 px-3 text-sm flex-1"
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCancelInlineEdit(index)}
                        className="h-8 px-3 text-sm flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                // Display mode
                <div className="flex items-center gap-2">
                  {!foodSuggestion.added && (
                    <Checkbox
                      checked={selectedFoodIds.has(index)}
                      onCheckedChange={(checked) => {
                        const newSelected = new Set(selectedFoodIds);
                        if (checked) {
                          newSelected.add(index);
                        } else {
                          newSelected.delete(index);
                        }
                        onSelectionChange(newSelected);
                      }}
                      className="data-[state=checked]:bg-primary data-[state=checked]:border-primary shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate flex items-center gap-1">
                      {food.name}
                      {(food.calories_manually_set || food.carbs_manually_set) && (
                        <span className="text-xs text-amber-600" title="Manual nutritional values">✏️</span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {food.serving_size}g • {food.calories} cal • {Math.round(food.carbs)}g carbs
                      {(food.calories_per_100g || food.carbs_per_100g) && (
                        <span className="text-green-600 ml-1" title="Auto-calculated nutrition available">🔄</span>
                      )}
                    </div>
                  </div>
                  {!foodSuggestion.added && (
                    <div className="flex gap-1 shrink-0">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => handleInlineEdit(index)}
                        className="h-7 w-7 p-0"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => onFoodRemove(index)}
                        className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>

        {/* Action Bar */}
        {!foodSuggestion.added && (
          <div className="border-t pt-4 bg-background sticky bottom-0">
            <Button
              onClick={handleAddSelectedFoods}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              disabled={isProcessing || selectedFoodIds.size === 0}
            >
              {isProcessing ? 'Adding...' : `Add ${selectedFoodIds.size} Selected Food${selectedFoodIds.size !== 1 ? 's' : ''} (${selectedCalories} cal)`}
            </Button>
          </div>
        )}
      </div>
    </UniversalModal>
  );
};