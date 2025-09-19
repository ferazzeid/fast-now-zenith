import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface ManualFoodEntryFormProps {
  onFoodAdded?: (foods: any[]) => void;
  onClose: () => void;
}

interface FoodEntry {
  name: string;
  serving_size: number;
  calories: number;
  carbs: number;
}

export const ManualFoodEntryForm = ({ onFoodAdded, onClose }: ManualFoodEntryFormProps) => {
  const [formData, setFormData] = useState<FoodEntry>({
    name: '',
    serving_size: 100,
    calories: 0,
    carbs: 0
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (field: keyof FoodEntry, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: field === 'name' ? value : Number(value)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a food name.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const foodItem = {
        name: formData.name.trim(),
        serving_size: formData.serving_size,
        calories: formData.calories,
        carbs: formData.carbs,
        // Calculate per 100g values for consistency
        calories_per_100g: formData.serving_size > 0 ? (formData.calories * 100) / formData.serving_size : 0,
        carbs_per_100g: formData.serving_size > 0 ? (formData.carbs * 100) / formData.serving_size : 0
      };

      if (onFoodAdded) {
        onFoodAdded([foodItem]);
      }

      toast({
        title: "Food Added",
        description: `"${formData.name}" has been added to your food log.`,
      });

      onClose();
    } catch (error) {
      console.error('Error adding manual food entry:', error);
      toast({
        title: "Error",
        description: "Failed to add food entry. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Form Modal */}
      <div className="relative w-full max-w-md mx-4 p-6 bg-background border border-border rounded-lg shadow-lg">
        <h2 className="text-xl font-semibold mb-4 text-foreground">Manual Food Entry</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name" className="text-sm font-medium text-foreground">
              Food Name *
            </Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="e.g., Apple, Chicken breast"
              className="mt-1"
              autoFocus
              disabled={isSubmitting}
            />
          </div>

          <div>
            <Label htmlFor="serving_size" className="text-sm font-medium text-foreground">
              Serving Size (grams)
            </Label>
            <Input
              id="serving_size"
              type="number"
              min="1"
              value={formData.serving_size}
              onChange={(e) => handleInputChange('serving_size', e.target.value)}
              className="mt-1"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <Label htmlFor="calories" className="text-sm font-medium text-foreground">
              Calories
            </Label>
            <Input
              id="calories"
              type="number"
              min="0"
              value={formData.calories}
              onChange={(e) => handleInputChange('calories', e.target.value)}
              className="mt-1"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <Label htmlFor="carbs" className="text-sm font-medium text-foreground">
              Carbs (grams)
            </Label>
            <Input
              id="carbs"
              type="number"
              min="0"
              step="0.1"
              value={formData.carbs}
              onChange={(e) => handleInputChange('carbs', e.target.value)}
              className="mt-1"
              disabled={isSubmitting}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Adding...' : 'Add Food'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};