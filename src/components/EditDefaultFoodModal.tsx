import React, { useState, useEffect, useRef } from 'react';
import { Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UniversalModal } from '@/components/ui/universal-modal';
import { useToast } from '@/hooks/use-toast';
import { ImageUpload } from './ImageUpload';
import { supabase } from '@/integrations/supabase/client';
import { useProfile } from '@/hooks/useProfile';

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
  is_favorite?: boolean;
  variations?: any;
}

interface EditDefaultFoodModalProps {
  food: DefaultFood | UserFood;
  onUpdate: (foodId: string, updates: Partial<DefaultFood | UserFood>) => Promise<void>;
  isOpen?: boolean;
  onClose?: () => void;
  mode?: 'default' | 'user'; // New prop to determine which table we're editing
}

export const EditDefaultFoodModal = ({ food, onUpdate, isOpen, onClose, mode = 'default' }: EditDefaultFoodModalProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const [name, setName] = useState(food.name);
  const [caloriesPer100g, setCaloriesPer100g] = useState(food.calories_per_100g.toString());
  const [carbsPer100g, setCarbsPer100g] = useState(food.carbs_per_100g.toString());
  const [imageUrl, setImageUrl] = useState(food.image_url || '');
  const foodIdRef = useRef(food.id);
  
  // Only reset form when switching to a completely different food
  useEffect(() => {
    if (food.id !== foodIdRef.current) {
      console.log('EditDefaultFoodModal: Switching to new food:', food.id);
      setName(food.name);
      setCaloriesPer100g(food.calories_per_100g.toString());
      setCarbsPer100g(food.carbs_per_100g.toString());
      setImageUrl(food.image_url || '');
      foodIdRef.current = food.id;
    }
  }, [food.id]);
  const { toast } = useToast();
  const { profile } = useProfile();

  const handleSave = async () => {
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Food name is required",
        variant: "destructive"
      });
      return;
    }

    const calories = parseFloat(caloriesPer100g);
    const carbs = parseFloat(carbsPer100g);

    if (isNaN(calories) || calories < 0) {
      toast({
        title: "Error",
        description: "Please enter a valid calories value",
        variant: "destructive"
      });
      return;
    }

    if (isNaN(carbs) || carbs < 0) {
      toast({
        title: "Error",
        description: "Please enter a valid carbs value",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('🍎 EditDefaultFoodModal: === SAVE PROCESS START ===');
      console.log('🍎 EditDefaultFoodModal: Current form state before save:', {
        foodId: food.id,
        name: name.trim(),
        calories: parseFloat(caloriesPer100g),
        carbs: parseFloat(carbsPer100g),
        imageUrl: imageUrl,
        imageUrlLength: imageUrl?.length || 0
      });
      
      const updateData = {
        name: name.trim(),
        calories_per_100g: calories,
        carbs_per_100g: carbs,
        image_url: imageUrl || null
      };
      
      console.log('🍎 EditDefaultFoodModal: Data being sent to onUpdate:', updateData);
      
      await onUpdate(food.id, updateData);
      
      console.log('🍎 EditDefaultFoodModal: onUpdate completed successfully');
      console.log('🍎 EditDefaultFoodModal: === SAVE PROCESS SUCCESS ===');
      
      if (onClose) onClose(); else setInternalOpen(false);
      toast({
        title: "Success",
        description: "Default food updated successfully"
      });
    } catch (error) {
      console.error('Failed to update default food:', error);
      toast({
        title: "Error",
        description: "Failed to update default food",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setName(food.name);
    setCaloriesPer100g(food.calories_per_100g.toString());
    setCarbsPer100g(food.carbs_per_100g.toString());
    setImageUrl(food.image_url || '');
  };


  return (
    <>
      {/* Trigger Button - only show if no external control */}
      {isOpen === undefined && (
        <Button
          variant="ghost"
          size="sm"
          className="p-1 h-6 w-6 hover:bg-primary/10"
          title="Edit default food"
          onClick={(e) => {
            e.stopPropagation();
            setInternalOpen(true);
          }}
        >
          <Edit className="w-3 h-3 text-muted-foreground" />
        </Button>
      )}

      {/* Modal */}
      <UniversalModal
        isOpen={isOpen !== undefined ? isOpen : internalOpen}
        onClose={() => {
          if (onClose) onClose(); else setInternalOpen(false);
          // Don't reset form on close to preserve user changes including image uploads
        }}
        title={`Edit ${food.name}`}
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
            <Button onClick={handleSave} className="w-full">
              Save
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
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="calories">
                Calories (per 100{profile?.units === 'imperial' ? 'oz' : 'g'})
              </Label>
              <Input
                id="calories"
                type="number"
                value={caloriesPer100g}
                onChange={(e) => setCaloriesPer100g(e.target.value)}
                placeholder="0"
                min="0"
                step="0.1"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="carbs">
                Carbs (per 100{profile?.units === 'imperial' ? 'oz' : 'g'})
              </Label>
              <Input
                id="carbs"
                type="number"
                value={carbsPer100g}
                onChange={(e) => setCarbsPer100g(e.target.value)}
                placeholder="0"
                min="0"
                step="0.1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Food Image</Label>
            <ImageUpload 
              currentImageUrl={imageUrl}
              onImageUpload={(url) => {
                console.log('🖼️ EditDefaultFoodModal: === IMAGE UPLOAD CALLBACK ===');
                console.log('🖼️ EditDefaultFoodModal: Received image URL from upload:', url);
                console.log('🖼️ EditDefaultFoodModal: URL length:', url?.length || 0);
                console.log('🖼️ EditDefaultFoodModal: Previous imageUrl state:', imageUrl);
                setImageUrl(url);
                console.log('🖼️ EditDefaultFoodModal: Updated imageUrl state to:', url);
                console.log('🖼️ EditDefaultFoodModal: === IMAGE UPLOAD CALLBACK END ===');
              }}
              onImageRemove={() => {
                console.log('🗑️ EditDefaultFoodModal: === IMAGE REMOVE CALLBACK ===');
                console.log('🗑️ EditDefaultFoodModal: Previous imageUrl state:', imageUrl);
                setImageUrl('');
                console.log('🗑️ EditDefaultFoodModal: Cleared imageUrl state');
                console.log('🗑️ EditDefaultFoodModal: === IMAGE REMOVE CALLBACK END ===');
              }}
              bucket="food-images"
            />
          </div>
        </div>


      </UniversalModal>
    </>
  );
};