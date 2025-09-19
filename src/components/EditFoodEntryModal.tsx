import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UniversalModal } from '@/components/ui/universal-modal';
import { useToast } from '@/hooks/use-toast';
import { ImageUpload } from '@/components/ImageUpload';
import { LocalImageUpload } from '@/components/LocalImageUpload';
import { useStandardizedLoading } from '@/hooks/useStandardizedLoading';
import { Calculator, RotateCcw, Info } from 'lucide-react';
import { 
  updateFoodItemWithRecalculation, 
  resetToCalculatedValues,
  isNutritionCalculated,
  EnhancedFoodItem
} from '@/utils/nutritionCalculations';

interface FoodEntry extends EnhancedFoodItem {
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

interface EditFoodEntryModalProps {
  entry: FoodEntry;
  onUpdate: (updatedEntry: FoodEntry) => Promise<void>;
  isOpen?: boolean;
  onClose?: () => void;
}

export const EditFoodEntryModal = ({ entry, onUpdate, isOpen, onClose }: EditFoodEntryModalProps) => {
  console.log('EditFoodEntryModal rendered with entry:', entry, 'isOpen:', isOpen);
  const [internalOpen, setInternalOpen] = useState(false);
  const [formData, setFormData] = useState<EnhancedFoodItem & { image_url?: string }>({
    name: entry.name,
    calories: entry.calories,
    carbs: entry.carbs,
    serving_size: entry.serving_size,
    image_url: entry.image_url || '',
    calories_per_100g: entry.calories_per_100g,
    carbs_per_100g: entry.carbs_per_100g,
    calories_manually_set: entry.calories_manually_set || false,
    carbs_manually_set: entry.carbs_manually_set || false,
  });
  const { isLoading, execute } = useStandardizedLoading();
  const { toast } = useToast();

  // Reset form when entry changes
  useEffect(() => {
    setFormData({
      name: entry.name,
      calories: entry.calories,
      carbs: entry.carbs,
      serving_size: entry.serving_size,
      image_url: entry.image_url || '',
      calories_per_100g: entry.calories_per_100g,
      carbs_per_100g: entry.carbs_per_100g,
      calories_manually_set: entry.calories_manually_set || false,
      carbs_manually_set: entry.carbs_manually_set || false,
    });
  }, [entry.id]);

  const handleFieldUpdate = (field: string, value: any) => {
    if (field === 'serving_size') {
      // Smart recalculation when serving size changes
      const updatedItem = updateFoodItemWithRecalculation(formData, { serving_size: value });
      setFormData(updatedItem);
    } else {
      // Direct field update - mark as manually set if it's a nutritional value
      const updates: Partial<EnhancedFoodItem> = { [field]: value };
      
      if (field === 'calories') {
        updates.calories_manually_set = true;
      } else if (field === 'carbs') {
        updates.carbs_manually_set = true;
      }
      
      setFormData(prev => ({ ...prev, ...updates }));
    }
  };

  const handleResetToCalculated = () => {
    const resetData = resetToCalculatedValues(formData);
    setFormData(resetData);
    toast({
      title: "Values Reset",
      description: "Nutrition values recalculated from serving size.",
    });
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
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
      const updatedEntry: FoodEntry = {
        ...entry,
        ...formData,
        name: formData.name.trim(),
      };

      await onUpdate(updatedEntry);
      
      if (onClose) onClose(); else setInternalOpen(false);
    }, {
      onError: (error) => {
        console.error('Failed to update food entry:', error);
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
      name: entry.name,
      calories: entry.calories,
      carbs: entry.carbs,
      serving_size: entry.serving_size,
      image_url: entry.image_url || '',
      calories_per_100g: entry.calories_per_100g,
      carbs_per_100g: entry.carbs_per_100g,
      calories_manually_set: entry.calories_manually_set || false,
      carbs_manually_set: entry.carbs_manually_set || false,
    });
  };

  const nutritionStatus = isNutritionCalculated(formData);
  const hasPerHundredGramData = formData.calories_per_100g || formData.carbs_per_100g;

  return (
    <UniversalModal
      isOpen={isOpen !== undefined ? isOpen : internalOpen}
      onClose={() => {
        if (onClose) onClose(); else setInternalOpen(false);
        resetForm();
      }}
      title={`Edit ${entry.name}`}
      variant="standard"
      size="sm"
      footer={
        <>
          <Button
            variant="outline"
            onClick={() => {
              if (onClose) onClose(); else setInternalOpen(false);
            }}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isLoading} 
            variant="action-primary"
            className="flex-1"
          >
            {isLoading ? 'Saving...' : 'Save'}
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
            className=""
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
              className=""
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
              className=""
            />
          </div>
        </div>
      </div>
    </UniversalModal>
  );
};