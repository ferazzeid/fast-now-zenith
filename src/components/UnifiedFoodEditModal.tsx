import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StableEditModal } from '@/components/StableEditModal';
import { EnhancedFoodImageUpload } from '@/components/EnhancedFoodImageUpload';
import { useToast } from '@/hooks/use-toast';
import { useAdminRole } from '@/hooks/useAdminRole';

interface FoodEntry {
  id: string;
  name: string;
  calories: number;
  carbs: number;
  serving_size: number;
  image_url?: string;
}

interface DefaultFood {
  id: string;
  name: string;
  calories_per_100g: number;
  carbs_per_100g: number;
  image_url?: string;
}

interface UserFood {
  id: string;
  name: string;
  calories_per_100g: number;
  carbs_per_100g: number;
  image_url?: string;
}

type FoodItem = FoodEntry | DefaultFood | UserFood;

interface UnifiedFoodEditModalProps {
  food: FoodItem;
  onUpdate: (id: string, updatedData: any) => Promise<void>;
  isOpen?: boolean;
  onClose?: () => void;
  mode?: 'entry' | 'default' | 'user';
}

export const UnifiedFoodEditModal = ({ 
  food, 
  onUpdate, 
  isOpen, 
  onClose, 
  mode = 'entry' 
}: UnifiedFoodEditModalProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');
  const [carbs, setCarbs] = useState('');
  const [servingSize, setServingSize] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [imageUploaded, setImageUploaded] = useState(false);
  
  const { toast } = useToast();
  const { isAdmin } = useAdminRole();

  // Determine if this is a food entry or library food
  const isFoodEntry = mode === 'entry' || 'serving_size' in food;
  const isDefaultFood = mode === 'default';
  const canEditDefaultFood = isAdmin && isDefaultFood;

  // Initialize form data based on food type
  useEffect(() => {
    if (isFoodEntry) {
      const entry = food as FoodEntry;
      setName(entry.name);
      setCalories(entry.calories.toString());
      setCarbs(entry.carbs.toString());
      setServingSize(entry.serving_size.toString());
      setImageUrl(entry.image_url || '');
    } else {
      const libraryFood = food as DefaultFood | UserFood;
      setName(libraryFood.name);
      setCalories(libraryFood.calories_per_100g.toString());
      setCarbs(libraryFood.carbs_per_100g.toString());
      setServingSize('100'); // Default for library foods
      setImageUrl(libraryFood.image_url || '');
    }
    setHasUnsavedChanges(false);
    setImageUploaded(false);
  }, [food, isFoodEntry]);

  // Track changes
  useEffect(() => {
    const originalName = food.name;
    const originalImageUrl = food.image_url || '';
    
    let originalCalories, originalCarbs;
    if (isFoodEntry) {
      const entry = food as FoodEntry;
      originalCalories = entry.calories.toString();
      originalCarbs = entry.carbs.toString();
    } else {
      const libraryFood = food as DefaultFood | UserFood;
      originalCalories = libraryFood.calories_per_100g.toString();
      originalCarbs = libraryFood.carbs_per_100g.toString();
    }

    const hasChanges = name !== originalName || 
                      calories !== originalCalories || 
                      carbs !== originalCarbs || 
                      imageUrl !== originalImageUrl ||
                      (isFoodEntry && servingSize !== (food as FoodEntry).serving_size.toString());

    setHasUnsavedChanges(hasChanges);
  }, [name, calories, carbs, servingSize, imageUrl, food, isFoodEntry]);

  const handleImageUpload = (newImageUrl: string) => {
    setImageUrl(newImageUrl);
    setImageUploaded(true);
    
    setTimeout(() => {
      toast({
        title: "Image uploaded successfully",
        description: "Your food image has been updated",
        duration: 3000,
      });
    }, 500);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Food name is required",
        variant: "destructive"
      });
      return;
    }

    const caloriesNum = parseFloat(calories);
    const carbsNum = parseFloat(carbs);

    if (isNaN(caloriesNum) || caloriesNum < 0) {
      toast({
        title: "Error",
        description: "Please enter a valid calories value",
        variant: "destructive"
      });
      return;
    }

    if (isNaN(carbsNum) || carbsNum < 0) {
      toast({
        title: "Error",
        description: "Please enter a valid carbs value",
        variant: "destructive"
      });
      return;
    }

    if (isFoodEntry) {
      const servingSizeNum = parseFloat(servingSize);
      if (isNaN(servingSizeNum) || servingSizeNum <= 0) {
        toast({
          title: "Error",
          description: "Please enter a valid serving size",
          variant: "destructive"
        });
        return;
      }
    }

    if (isDefaultFood && !canEditDefaultFood) {
      toast({
        title: "Permission Denied",
        description: "Only administrators can edit default foods",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      let updateData;
      
      if (isFoodEntry) {
        updateData = {
          name: name.trim(),
          calories: caloriesNum,
          carbs: carbsNum,
          serving_size: parseFloat(servingSize),
          image_url: imageUrl || undefined,
        };
      } else {
        updateData = {
          name: name.trim(),
          calories_per_100g: caloriesNum,
          carbs_per_100g: carbsNum,
          image_url: imageUrl || undefined,
        };
      }

      await onUpdate(food.id, updateData);
      
      if (onClose) onClose(); 
      else setInternalOpen(false);
    } catch (error) {
      console.error('Failed to update food:', error);
      toast({
        title: "Error",
        description: "Failed to update food",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (hasUnsavedChanges) {
      const confirmClose = window.confirm("You have unsaved changes. Are you sure you want to close?");
      if (!confirmClose) return;
    }
    
    if (onClose) onClose(); 
    else setInternalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    if (isFoodEntry) {
      const entry = food as FoodEntry;
      setName(entry.name);
      setCalories(entry.calories.toString());
      setCarbs(entry.carbs.toString());
      setServingSize(entry.serving_size.toString());
      setImageUrl(entry.image_url || '');
    } else {
      const libraryFood = food as DefaultFood | UserFood;
      setName(libraryFood.name);
      setCalories(libraryFood.calories_per_100g.toString());
      setCarbs(libraryFood.carbs_per_100g.toString());
      setServingSize('100');
      setImageUrl(libraryFood.image_url || '');
    }
    setHasUnsavedChanges(false);
    setImageUploaded(false);
  };

  const getModalTitle = () => {
    if (isFoodEntry) return `Edit ${food.name}`;
    if (isDefaultFood) return `Edit Default Food: ${food.name}`;
    return `Edit ${food.name}`;
  };

  const getCaloriesLabel = () => {
    return isFoodEntry ? "Calories" : "Calories per 100g";
  };

  const getCarbsLabel = () => {
    return isFoodEntry ? "Carbs (g)" : "Carbs per 100g";
  };

  return (
    <StableEditModal
      isOpen={isOpen !== undefined ? isOpen : internalOpen}
      onClose={handleClose}
      title={getModalTitle()}
      size="lg"
      footer={
        <>
          <Button
            variant="outline"
            onClick={handleClose}
            className="w-full"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={loading || (isDefaultFood && !canEditDefaultFood)} 
            className={`w-full ${hasUnsavedChanges ? 'bg-primary hover:bg-primary/90' : ''}`}
          >
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Food Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter food name"
            disabled={isDefaultFood && !canEditDefaultFood}
          />
        </div>

        <div className={isFoodEntry ? "grid grid-cols-3 gap-4" : "grid grid-cols-2 gap-4"}>
          <div className="space-y-2">
            <Label htmlFor="calories">{getCaloriesLabel()}</Label>
            <Input
              id="calories"
              type="number"
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              placeholder="0"
              min="0"
              step="0.1"
              disabled={isDefaultFood && !canEditDefaultFood}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="carbs">{getCarbsLabel()}</Label>
            <Input
              id="carbs"
              type="number"
              value={carbs}
              onChange={(e) => setCarbs(e.target.value)}
              placeholder="0"
              min="0"
              step="0.1"
              disabled={isDefaultFood && !canEditDefaultFood}
            />
          </div>

          {isFoodEntry && (
            <div className="space-y-2">
              <Label htmlFor="serving">Serving (g)</Label>
              <Input
                id="serving"
                type="number"
                value={servingSize}
                onChange={(e) => setServingSize(e.target.value)}
                placeholder="0"
                min="0.1"
                step="0.1"
              />
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label>Food Image</Label>
          {imageUrl && (
            <div className="w-full h-32 mb-2">
              <img
                src={imageUrl}
                alt={name}
                className="w-full h-full object-cover rounded-lg"
              />
            </div>
          )}
          {imageUploaded && (
            <div className="text-sm text-green-600 mb-2">
              ✓ Image uploaded successfully!
            </div>
          )}
          <EnhancedFoodImageUpload 
            currentImageUrl={imageUrl}
            onImageUpload={handleImageUpload}
            onImageRemove={() => setImageUrl('')}
          />
        </div>

        {isDefaultFood && !canEditDefaultFood && (
          <div className="p-3 bg-muted rounded-lg text-sm text-muted-foreground">
            Only administrators can edit default foods. You can create a custom version instead.
          </div>
        )}
      </div>
    </StableEditModal>
  );
};