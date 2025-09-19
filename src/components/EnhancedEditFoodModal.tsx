import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UniversalModal } from '@/components/ui/universal-modal';
import { useToast } from '@/hooks/use-toast';
import { LocalImageUpload } from '@/components/LocalImageUpload';
import { Calculator, RotateCcw, Info, AlertTriangle } from 'lucide-react';
import { 
  updateFoodItemWithRecalculation, 
  resetToCalculatedValues,
  isNutritionCalculated,
  EnhancedFoodItem,
  calculateNutritionFromWeight
} from '@/utils/nutritionCalculations';

interface FoodItem extends EnhancedFoodItem {
  id: string;
  image_url?: string;
}

interface EnhancedEditFoodModalProps {
  food: FoodItem;
  onUpdate: (updates: Partial<FoodItem>) => Promise<void>;
  isOpen: boolean;
  onClose: () => void;
}

export const EnhancedEditFoodModal = ({ food, onUpdate, isOpen, onClose }: EnhancedEditFoodModalProps) => {
  const [formData, setFormData] = useState<EnhancedFoodItem & { image_url?: string }>(food);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Smart field update with recalculation logic
  const handleFieldUpdate = useCallback((field: string, value: any) => {
    if (field === 'serving_size') {
      // Smart recalculation when serving size changes
      const updatedItem = updateFoodItemWithRecalculation(formData, { serving_size: value });
      setFormData(updatedItem);
    } else {
      // Direct field update - mark as manually set if it's a nutritional value
      const updates: Partial<EnhancedFoodItem & { image_url?: string }> = { [field]: value };
      
      if (field === 'calories') {
        updates.calories_manually_set = true;
      } else if (field === 'carbs') {
        updates.carbs_manually_set = true;
      }
      
      setFormData(prev => ({ ...prev, ...updates }));
    }
  }, [formData]);

  const handleResetToCalculated = useCallback(() => {
    const resetData = resetToCalculatedValues(formData);
    setFormData({ ...resetData, image_url: formData.image_url });
    toast({
      title: "Values Reset",
      description: "Nutrition values recalculated from serving size.",
    });
  }, [formData, toast]);

  const handleSave = async () => {
    if (!formData.name?.trim()) {
      toast({
        title: "Error",
        description: "Food name is required",
        variant: "destructive"
      });
      return;
    }

    if (isNaN(formData.calories) || formData.calories < 0) {
      toast({
        title: "Error", 
        description: "Please enter a valid calories value",
        variant: "destructive"
      });
      return;
    }

    if (isNaN(formData.serving_size) || formData.serving_size <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid serving size",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      await onUpdate(formData);
      onClose();
      toast({
        title: "Food Updated",
        description: "Your food entry has been successfully updated.",
      });
    } catch (error) {
      console.error('Failed to update food:', error);
      toast({
        title: "Error",
        description: "Failed to update food entry",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Validate nutritional data for unrealistic values
  const getValidationWarnings = () => {
    const warnings = [];
    const caloriesPerGram = formData.calories / formData.serving_size;
    
    if (caloriesPerGram > 9) {
      warnings.push("Very high calorie density - please verify");
    }
    
    if (formData.carbs > formData.serving_size) {
      warnings.push("Carbs cannot exceed total weight");
    }
    
    return warnings;
  };

  const nutritionStatus = isNutritionCalculated(formData);
  const hasPerHundredGramData = formData.calories_per_100g || formData.carbs_per_100g;
  const validationWarnings = getValidationWarnings();

  return (
    <UniversalModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit ${food.name}`}
      variant="standard"
      size="sm"
      footer={
        <>
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isLoading} 
            variant="action-primary"
            className="flex-1"
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Food Image Upload */}
        <div className="space-y-2">
          <Label>Food Image</Label>
          <LocalImageUpload
            currentImageId={formData.image_url}
            onImageUpload={(url) => handleFieldUpdate('image_url', url)}
            onImageRemove={() => handleFieldUpdate('image_url', '')}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">Food Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => handleFieldUpdate('name', e.target.value)}
            placeholder="Enter food name"
          />
        </div>

        {/* Smart Recalculation Info */}
        {hasPerHundredGramData && (
          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200 text-sm">
              <Info className="w-4 h-4" />
              <span className="font-medium">Smart Nutrition</span>
              {(formData.calories_manually_set || formData.carbs_manually_set) && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleResetToCalculated}
                  className="ml-auto h-6 px-2 text-xs border-blue-300"
                >
                  <RotateCcw className="w-3 h-3 mr-1" />
                  Reset to Calculated
                </Button>
              )}
            </div>
            <div className="text-xs text-blue-700 dark:text-blue-300 mt-1">
              {(formData.calories_manually_set || formData.carbs_manually_set) 
                ? "Manual values - change serving size to auto-recalculate"
                : "Values will auto-recalculate when you change the serving size"
              }
            </div>
          </div>
        )}

        {/* Validation Warnings */}
        {validationWarnings.length > 0 && (
          <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200 text-sm">
              <AlertTriangle className="w-4 h-4" />
              <span className="font-medium">Please Review</span>
            </div>
            {validationWarnings.map((warning, index) => (
              <div key={index} className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                • {warning}
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="serving" className="flex items-center gap-1">
              Serving (g)
              {hasPerHundredGramData && (
                <Calculator className="w-3 h-3 text-primary" />
              )}
            </Label>
            <Input
              id="serving"
              type="number"
              value={formData.serving_size}
              onChange={(e) => handleFieldUpdate('serving_size', parseFloat(e.target.value) || 0)}
              placeholder="0"
              min="0.1"
              step="0.1"
              className={hasPerHundredGramData ? "border-primary/30" : ""}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="calories" className="flex items-center gap-1">
              Calories
              {nutritionStatus.calories && (
                <Calculator className="w-3 h-3 text-green-600" />
              )}
              {formData.calories_manually_set && (
                <span className="text-xs text-amber-600">✏️</span>
              )}
            </Label>
            <Input
              id="calories"
              type="number"
              value={formData.calories}
              onChange={(e) => handleFieldUpdate('calories', parseFloat(e.target.value) || 0)}
              placeholder="0"
              min="0"
              step="0.1"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="carbs" className="flex items-center gap-1">
              Carbs (g)
              {nutritionStatus.carbs && (
                <Calculator className="w-3 h-3 text-green-600" />
              )}
              {formData.carbs_manually_set && (
                <span className="text-xs text-amber-600">✏️</span>
              )}
            </Label>
            <Input
              id="carbs"
              type="number"
              value={formData.carbs}
              onChange={(e) => handleFieldUpdate('carbs', parseFloat(e.target.value) || 0)}
              placeholder="0"
              min="0"
              step="0.1"
            />
          </div>
        </div>

        {/* Per-100g Data Display (if available) */}
        {hasPerHundredGramData && (
          <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">
            <div className="font-medium">Per 100g reference:</div>
            <div className="grid grid-cols-2 gap-2 mt-1">
              {formData.calories_per_100g && (
                <div>Calories: {formData.calories_per_100g}</div>
              )}
              {formData.carbs_per_100g && (
                <div>Carbs: {formData.carbs_per_100g}g</div>
              )}
            </div>
          </div>
        )}
      </div>
    </UniversalModal>
  );
};