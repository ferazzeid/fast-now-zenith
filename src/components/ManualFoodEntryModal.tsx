import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { UniversalModal } from '@/components/ui/universal-modal';
import { X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { calculateNutritionFromWeight } from '@/utils/nutritionCalculations';

interface ManualFoodEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFoodAdded: (foodEntry: any) => void;
}

export const ManualFoodEntryModal = ({ isOpen, onClose, onFoodAdded }: ManualFoodEntryModalProps) => {
  const [productName, setProductName] = useState('');
  const [portionSize, setPortionSize] = useState('');
  const [calories, setCalories] = useState('');
  const [carbs, setCarbs] = useState('');
  const [protein, setProtein] = useState('');
  const [fat, setFat] = useState('');
  const [saving, setSaving] = useState(false);
  const [isPer100gMode, setIsPer100gMode] = useState(true); // Default to per-100g mode
  const { toast } = useToast();

  const resetForm = () => {
    setProductName('');
    setPortionSize('');
    setCalories('');
    setCarbs('');
    setProtein('');
    setFat('');
  };

  const handleSave = async () => {
    if (!productName.trim()) {
      toast({
        title: "Error",
        description: "Product name is required",
        variant: "destructive",
      });
      return;
    }

    const portionSizeValue = parseFloat(portionSize) || 100; // Default 100g
    const inputCaloriesValue = parseFloat(calories) || 0;
    const inputCarbsValue = parseFloat(carbs) || 0;
    const inputProteinValue = parseFloat(protein) || 0;
    const inputFatValue = parseFloat(fat) || 0;

    if (portionSizeValue <= 0) {
      toast({
        title: "Invalid portion size",
        description: "Please enter a valid portion size",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      let finalCalories, finalCarbs, finalProtein, finalFat;
      let finalCaloriesPer100g, finalCarbsPer100g, finalProteinPer100g, finalFatPer100g;

      if (isPer100gMode) {
        // User provided per-100g values, calculate totals
        const calculatedNutrition = calculateNutritionFromWeight(portionSizeValue, {
          calories_per_100g: inputCaloriesValue,
          carbs_per_100g: inputCarbsValue,
          protein_per_100g: inputProteinValue,
          fat_per_100g: inputFatValue
        });
        
        finalCalories = calculatedNutrition.calories;
        finalCarbs = calculatedNutrition.carbs;
        finalProtein = calculatedNutrition.protein;
        finalFat = calculatedNutrition.fat;
        
        finalCaloriesPer100g = inputCaloriesValue;
        finalCarbsPer100g = inputCarbsValue;
        finalProteinPer100g = inputProteinValue;
        finalFatPer100g = inputFatValue;
      } else {
        // User provided total values, calculate per-100g
        finalCalories = inputCaloriesValue;
        finalCarbs = inputCarbsValue;
        finalProtein = inputProteinValue;
        finalFat = inputFatValue;
        
        finalCaloriesPer100g = portionSizeValue > 0 ? (inputCaloriesValue / portionSizeValue) * 100 : undefined;
        finalCarbsPer100g = portionSizeValue > 0 ? (inputCarbsValue / portionSizeValue) * 100 : undefined;
        finalProteinPer100g = portionSizeValue > 0 ? (inputProteinValue / portionSizeValue) * 100 : undefined;
        finalFatPer100g = portionSizeValue > 0 ? (inputFatValue / portionSizeValue) * 100 : undefined;
      }

      const foodEntry = {
        name: productName.trim(),
        serving_size: portionSizeValue,
        calories: finalCalories,
        carbs: finalCarbs,
        protein: finalProtein,
        fat: finalFat,
        consumed: false,
        image_url: null,
        // Store per-100g data for smart editing
        calories_per_100g: finalCaloriesPer100g,
        carbs_per_100g: finalCarbsPer100g,
        protein_per_100g: finalProteinPer100g,
        fat_per_100g: finalFatPer100g,
        // Mark nutrition as manually set
        calories_manually_set: true,
        carbs_manually_set: true,
        protein_manually_set: true,
        fat_manually_set: true
      };

      await onFoodAdded(foodEntry);

      toast({
        title: "Success",
        description: `Added ${productName} to your food log`,
      });

      resetForm();
      onClose();
    } catch (error) {
      console.error('Error saving manual food entry:', error);
      toast({
        title: "Error",
        description: "Failed to save food entry",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <UniversalModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Manual Food Entry"
      variant="standard"
      size="sm"
      showCloseButton={true}
      footer={
        <>
          <Button 
            variant="outline" 
            size="action-secondary"
            onClick={handleClose}
            className="flex-1"
          >
            <X className="w-4 h-4" />
          </Button>
          <Button 
            variant="action-primary"
            size="action-secondary"
            onClick={handleSave}
            disabled={saving || !productName.trim()}
            className="flex-1"
          >
            {saving ? 'Saving...' : 'Add Food'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Input Mode Toggle */}
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div className="space-y-1">
            <div className="text-sm font-medium">
              {isPer100gMode ? "Per 100g Input Mode" : "Total Portion Input Mode"}
            </div>
            <div className="text-xs text-muted-foreground">
              {isPer100gMode 
                ? "Enter nutritional values per 100g (natural for food labels)" 
                : "Enter total nutritional values for this portion"
              }
            </div>
          </div>
          <Switch
            checked={isPer100gMode}
            onCheckedChange={setIsPer100gMode}
          />
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div>
            <Label htmlFor="productName">Food Name *</Label>
            <Input
              id="productName"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="e.g., Banana, Rice, Chicken Breast"
              maxLength={100}
              onClick={(e) => e.stopPropagation()}
              onFocus={(e) => e.stopPropagation()}
              className="bg-muted"
            />
          </div>

          <div>
            <Label htmlFor="portionSize">Portion Size (grams)</Label>
            <Input
              id="portionSize"
              type="number"
              value={portionSize}
              onChange={(e) => setPortionSize(e.target.value)}
              placeholder="100"
              min="0.1"
              step="0.1"
              onClick={(e) => e.stopPropagation()}
              onFocus={(e) => e.stopPropagation()}
              className="bg-muted"
            />
          </div>

          <div>
            <Label htmlFor="calories">
              {isPer100gMode ? "Calories (per 100g)" : "Calories (total for portion)"}
            </Label>
            <Input
              id="calories"
              type="number"
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              placeholder="0"
              min="0"
              step="0.1"
              onClick={(e) => e.stopPropagation()}
              onFocus={(e) => e.stopPropagation()}
              className="bg-muted"
            />
          </div>

          <div>
            <Label htmlFor="carbs">
              {isPer100gMode ? "Carbs (grams per 100g)" : "Carbs (total grams for portion)"}
            </Label>
            <Input
              id="carbs"
              type="number"
              value={carbs}
              onChange={(e) => setCarbs(e.target.value)}
              placeholder="0"
              min="0"
              step="0.1"
              onClick={(e) => e.stopPropagation()}
              onFocus={(e) => e.stopPropagation()}
              className="bg-muted"
            />
          </div>

          <div>
            <Label htmlFor="protein">
              {isPer100gMode ? "Protein (grams per 100g)" : "Protein (total grams for portion)"}
            </Label>
            <Input
              id="protein"
              type="number"
              value={protein}
              onChange={(e) => setProtein(e.target.value)}
              placeholder="0"
              min="0"
              step="0.1"
              onClick={(e) => e.stopPropagation()}
              onFocus={(e) => e.stopPropagation()}
              className="bg-muted"
            />
          </div>

          <div>
            <Label htmlFor="fat">
              {isPer100gMode ? "Fat (grams per 100g)" : "Fat (total grams for portion)"}
            </Label>
            <Input
              id="fat"
              type="number"
              value={fat}
              onChange={(e) => setFat(e.target.value)}
              placeholder="0"
              min="0"
              step="0.1"
              onClick={(e) => e.stopPropagation()}
              onFocus={(e) => e.stopPropagation()}
              className="bg-muted"
            />
          </div>
        </div>
      </div>
    </UniversalModal>
  );
};