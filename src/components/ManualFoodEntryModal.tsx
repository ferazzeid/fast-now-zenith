import { useState } from 'react';
import { UniversalModal } from '@/components/ui/universal-modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const resetForm = () => {
    setProductName('');
    setPortionSize('');
    setCalories('');
    setCarbs('');
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

    // Set default values for optional fields
    const portionSizeValue = parseFloat(portionSize) || 100; // Default 100g
    const caloriesValue = parseFloat(calories) || 0;
    const carbsValue = parseFloat(carbs) || 0;

    if (portionSizeValue <= 0) {
      toast({
        title: "Error", 
        description: "Please enter a valid portion size",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const foodEntry = {
        name: productName.trim(),
        serving_size: portionSizeValue,
        calories: caloriesValue,
        carbs: carbsValue,
        consumed: false,
        // Optional fields that can be empty
        protein: 0,
        fat: 0,
        image_url: null,
        // Mark as manually entered (no per-100g data)
        calories_per_100g: null,
        carbs_per_100g: null,
        protein_per_100g: null,
        fat_per_100g: null,
        calories_manually_set: true,
        carbs_manually_set: true,
        protein_manually_set: true,
        fat_manually_set: true,
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
        <div>
          <Label htmlFor="product-name">Product Name *</Label>
          <Input
            id="product-name"
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
          <Label htmlFor="portion-size">Portion Size (grams)</Label>
          <Input
            id="portion-size"
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
          <Label htmlFor="calories">Calories</Label>
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
          <Label htmlFor="carbs">Carbs (grams)</Label>
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
      </div>
    </UniversalModal>
  );
};