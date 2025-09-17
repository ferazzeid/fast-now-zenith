import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { UniversalModal } from '@/components/ui/universal-modal';
import { Edit, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FoodItem {
  name: string;
  serving_size: number;
  calories: number;
  carbs: number;
}

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
      const updates = {
        name: editData.name || foodSuggestion.foods[index].name,
        serving_size: parseFloat(editData.portion || '0') || foodSuggestion.foods[index].serving_size,
        calories: parseFloat(editData.calories || '0') || foodSuggestion.foods[index].calories,
        carbs: parseFloat(editData.carbs || '0') || foodSuggestion.foods[index].carbs
      };
      
      onFoodUpdate(index, updates);
      
      setEditingFoodIndex(null);
      setInlineEditData(prev => {
        const updated = { ...prev };
        delete updated[index];
        return updated;
      });
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

        {/* Original Voice Input Display */}
        {foodSuggestion.originalTranscription && (
          <Card className="p-3 bg-blue-50 border-blue-200">
            <div className="text-xs text-muted-foreground mb-1">What I heard:</div>
            <div className="text-sm text-blue-800 italic">
              "{foodSuggestion.originalTranscription}"
            </div>
          </Card>
        )}

        {/* Food Items */}
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
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
                      <div className="text-xs text-muted-foreground mb-1">Weight (g)</div>
                      <Input
                        type="number"
                        value={inlineEditData[index]?.portion || ''}
                        onChange={(e) => setInlineEditData(prev => ({
                          ...prev,
                          [index]: { ...prev[index], portion: e.target.value }
                        }))}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Calories</div>
                      <Input
                        type="number"
                        value={inlineEditData[index]?.calories || ''}
                        onChange={(e) => setInlineEditData(prev => ({
                          ...prev,
                          [index]: { ...prev[index], calories: e.target.value }
                        }))}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">Carbs (g)</div>
                      <Input
                        type="number"
                        value={inlineEditData[index]?.carbs || ''}
                        onChange={(e) => setInlineEditData(prev => ({
                          ...prev,
                          [index]: { ...prev[index], carbs: e.target.value }
                        }))}
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
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
                    <div className="text-sm font-medium truncate">{food.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {food.serving_size}g • {food.calories} cal • {Math.round(food.carbs)}g carbs
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
          <div className="border-t pt-3">
            <Button
              size="sm"
              onClick={handleAddSelectedFoods}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              disabled={isProcessing || selectedFoodIds.size === 0}
            >
              {isProcessing ? 'Adding...' : `Add ${selectedFoodIds.size} Selected Food${selectedFoodIds.size !== 1 ? 's' : ''}`}
            </Button>
          </div>
        )}
      </div>
    </UniversalModal>
  );
};