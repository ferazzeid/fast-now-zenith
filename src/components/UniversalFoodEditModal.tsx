import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UniversalModal } from '@/components/ui/universal-modal';
import { useToast } from '@/hooks/use-toast';
import { LocalImageUpload } from '@/components/LocalImageUpload';
import { useStandardizedLoading } from '@/hooks/useStandardizedLoading';
import { Calculator, RotateCcw, Info, AlertTriangle } from 'lucide-react';
import { 
  updateFoodItemWithRecalculation, 
  resetToCalculatedValues,
  isNutritionCalculated,
  EnhancedFoodItem
} from '@/utils/nutritionCalculations';

// Generic food item interface that can handle different food types
interface FoodItem extends EnhancedFoodItem {
  id: string;
  user_id?: string;
  created_at?: string;
  consumed?: boolean;
  image_url?: string;
  protein?: number;
  fat?: number;
  protein_per_100g?: number;
  fat_per_100g?: number;
  protein_manually_set?: boolean;
  fat_manually_set?: boolean;
}

interface UniversalFoodEditModalProps {
  food: FoodItem;
  onUpdate: (updatedFood: FoodItem) => Promise<void>;
  isOpen?: boolean;
  onClose?: () => void;
  title?: string;
}

export const UniversalFoodEditModal = ({ 
  food, 
  onUpdate, 
  isOpen, 
  onClose,
  title 
}: UniversalFoodEditModalProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const [formData, setFormData] = useState<EnhancedFoodItem & { image_url?: string }>({
    name: food.name,
    calories: food.calories,
    carbs: food.carbs,
    serving_size: food.serving_size,
    image_url: food.image_url || '',
    calories_per_100g: food.calories_per_100g,
    carbs_per_100g: food.carbs_per_100g,
    calories_manually_set: food.calories_manually_set || false,
    carbs_manually_set: food.carbs_manually_set || false,
  });
  
  const { isLoading, execute } = useStandardizedLoading();
  const { toast } = useToast();

  // Reset form when food ID changes
  useEffect(() => {
    setFormData({
      name: food.name,
      calories: food.calories,
      carbs: food.carbs,
      serving_size: food.serving_size,
      image_url: food.image_url || '',
      // Calculate per-100g data if missing but we have serving data
      calories_per_100g: food.calories_per_100g || (food.serving_size > 0 ? (food.calories / food.serving_size) * 100 : undefined),
      carbs_per_100g: food.carbs_per_100g || (food.serving_size > 0 ? (food.carbs / food.serving_size) * 100 : undefined),
      calories_manually_set: food.calories_manually_set || false,
      carbs_manually_set: food.carbs_manually_set || false,
    });
  }, [food.id]);

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

    if (isNaN(formData.carbs) || formData.carbs < 0) {
      toast({
        title: "Error",
        description: "Please enter a valid carbs value",
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

    await execute(async () => {
      const updatedFood: FoodItem = {
        ...food,
        ...formData,
        name: formData.name.trim(),
      };

      await onUpdate(updatedFood);
      
      if (onClose) onClose(); else setInternalOpen(false);
      toast({
        title: "Food Updated",
        description: "Your food entry has been successfully updated.",
      });
    }, {
      onError: (error) => {
        console.error('Failed to update food:', error);
        toast({
          title: "Error",
          description: "Failed to update food entry",
          variant: "destructive"
        });
      }
    });
  };

  const resetForm = () => {
    setFormData({
      name: food.name,
      calories: food.calories,
      carbs: food.carbs,
      serving_size: food.serving_size,
      image_url: food.image_url || '',
      // Calculate per-100g data if missing but we have serving data
      calories_per_100g: food.calories_per_100g || (food.serving_size > 0 ? (food.calories / food.serving_size) * 100 : undefined),
      carbs_per_100g: food.carbs_per_100g || (food.serving_size > 0 ? (food.carbs / food.serving_size) * 100 : undefined),
      calories_manually_set: food.calories_manually_set || false,
      carbs_manually_set: food.carbs_manually_set || false,
    });
  };

  const nutritionStatus = isNutritionCalculated(formData);
  const hasPerHundredGramData = formData.calories_per_100g || formData.carbs_per_100g;
  const validationWarnings = getValidationWarnings();

  return (
    <UniversalModal
      isOpen={isOpen !== undefined ? isOpen : internalOpen}
      onClose={() => {
        if (onClose) onClose(); else setInternalOpen(false);
        resetForm();
      }}
      title={title || `Edit ${food.name}`}
      variant="standard"
      size="sm"
      footer={
        <>
          <Button
            variant="outline"
            onClick={() => {
              if (onClose) onClose(); else setInternalOpen(false);
              resetForm();
            }}
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
          <div className="p-3 bg-info/5 dark:bg-info/10 border border-info/20 dark:border-info/30 rounded-lg">
            <div className="flex items-center gap-2 text-info-foreground dark:text-info-foreground text-sm">
              <Info className="w-4 h-4" />
              <span className="font-medium">Smart Nutrition</span>
              {(formData.calories_manually_set || formData.carbs_manually_set) && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleResetToCalculated}
                  className="ml-auto h-6 px-2 text-xs border-info/30"
                >
                  <RotateCcw className="w-3 h-3 mr-1" />
                  Reset to Calculated
                </Button>
              )}
            </div>
            <div className="text-xs text-info-foreground dark:text-info-foreground mt-1">
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