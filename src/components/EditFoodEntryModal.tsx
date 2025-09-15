import React, { useState } from 'react';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UniversalModal } from '@/components/ui/universal-modal';
import { useToast } from '@/hooks/use-toast';
import { ImageUpload } from '@/components/ImageUpload';
import { LocalImageUpload } from '@/components/LocalImageUpload';
import { useStandardizedLoading } from '@/hooks/useStandardizedLoading';

interface FoodEntry {
  id: string;
  name: string;
  calories: number;
  carbs: number;
  serving_size: number;
  image_url?: string;
}

interface EditFoodEntryModalProps {
  entry: FoodEntry;
  onUpdate: (updatedEntry: FoodEntry) => Promise<void>;
  isOpen?: boolean;
  onClose?: () => void;
}

export const EditFoodEntryModal = ({ entry, onUpdate, isOpen, onClose }: EditFoodEntryModalProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const [name, setName] = useState(entry.name);
  const [calories, setCalories] = useState(entry.calories.toString());
  const [carbs, setCarbs] = useState(entry.carbs.toString());
  const [servingSize, setServingSize] = useState(entry.serving_size.toString());
  const [imageUrl, setImageUrl] = useState(entry.image_url || '');
  const { isLoading, execute } = useStandardizedLoading();
  const { toast } = useToast();

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
    const servingSizeNum = parseFloat(servingSize);

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

    if (isNaN(servingSizeNum) || servingSizeNum <= 0) {
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
        name: name.trim(),
        calories: caloriesNum,
        carbs: carbsNum,
        serving_size: servingSizeNum,
        image_url: imageUrl || undefined,
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
    setName(entry.name);
    setCalories(entry.calories.toString());
    setCarbs(entry.carbs.toString());
    setServingSize(entry.serving_size.toString());
    setImageUrl(entry.image_url || '');
  };

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
            className="w-full"
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading} className="w-full">
            <Save className="w-4 h-4 mr-2" />
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
            currentImageId={imageUrl}
            onImageUpload={setImageUrl}
            onImageRemove={() => setImageUrl('')}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">Food Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter food name"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="calories">Calories</Label>
            <Input
              id="calories"
              type="number"
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              placeholder="0"
              min="0"
              step="0.1"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="carbs">Carbs (g)</Label>
            <Input
              id="carbs"
              type="number"
              value={carbs}
              onChange={(e) => setCarbs(e.target.value)}
              placeholder="0"
              min="0"
              step="0.1"
            />
          </div>

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
        </div>
      </div>
    </UniversalModal>
  );
};