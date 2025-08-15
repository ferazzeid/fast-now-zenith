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
import { useAdminRole } from '@/hooks/useAdminRole';

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
  const [imageUploaded, setImageUploaded] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const foodIdRef = useRef(food.id);
  
  const { toast } = useToast();
  const { profile } = useProfile();
  const { isAdmin, loading: adminLoading } = useAdminRole();
  
  // Admin protection: only allow editing default foods if user is admin
  const canEditDefaultFood = mode === 'user' || isAdmin;
  
  // Only reset form when switching to a completely different food
  useEffect(() => {
    if (food.id !== foodIdRef.current) {
      setName(food.name);
      setCaloriesPer100g(food.calories_per_100g.toString());
      setCarbsPer100g(food.carbs_per_100g.toString());
      setImageUrl(food.image_url || '');
      setImageUploaded(false);
      setHasUnsavedChanges(false);
      foodIdRef.current = food.id;
    }
  }, [food.id]);

  // Track form changes
  useEffect(() => {
    const hasChanges = 
      name !== food.name ||
      caloriesPer100g !== food.calories_per_100g.toString() ||
      carbsPer100g !== food.carbs_per_100g.toString() ||
      imageUrl !== (food.image_url || '');
    setHasUnsavedChanges(hasChanges);
  }, [name, caloriesPer100g, carbsPer100g, imageUrl, food]);
  
  // Prevent rendering if trying to edit default food without admin rights
  if (mode === 'default' && !adminLoading && !isAdmin) {
    console.warn('🚫 Non-admin user attempted to edit default food:', { food: food.id, mode });
    return null;
  }

  // Handle image upload with immediate preview and feedback
  const handleImageUpload = (newImageUrl: string) => {
    console.log('🖼️ Image uploaded successfully:', newImageUrl);
    console.log('🔍 Modal should remain open after upload');
    setImageUrl(newImageUrl);
    setImageUploaded(true);
    
    // Prevent any potential modal closure
    setTimeout(() => {
      toast({
        title: "Image uploaded successfully!",
        description: "Click 'Save Changes' to keep this image",
        duration: 5000,
        variant: "default"
      });
    }, 100);
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
      const updateData = {
        name: name.trim(),
        calories_per_100g: calories,
        carbs_per_100g: carbs,
        image_url: imageUrl || null
      };
      
      console.log('💾 Saving food with data:', updateData);
      await onUpdate(food.id, updateData);
      
      // Reset states after successful save
      setImageUploaded(false);
      setHasUnsavedChanges(false);
      
      // Only close modal after explicit save
      if (onClose) onClose(); else setInternalOpen(false);
      
      toast({
        title: "Food updated successfully",
        description: `${name} has been saved`
      });
    } catch (error) {
      console.error('Failed to update food:', error);
      toast({
        title: "Error",
        description: "Failed to update food",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setName(food.name);
    setCaloriesPer100g(food.calories_per_100g.toString());
    setCarbsPer100g(food.carbs_per_100g.toString());
    setImageUrl(food.image_url || '');
    setImageUploaded(false);
    setHasUnsavedChanges(false);
  };

  const handleClose = () => {
    console.log('🚪 Attempting to close modal, hasUnsavedChanges:', hasUnsavedChanges);
    console.log('🚪 imageUploaded:', imageUploaded);
    
    if (hasUnsavedChanges || imageUploaded) {
      const confirm = window.confirm('You have unsaved changes. Are you sure you want to close?');
      if (!confirm) {
        console.log('🚪 User cancelled close - modal stays open');
        return;
      }
    }
    
    console.log('🚪 Closing modal');
    if (onClose) onClose(); 
    else setInternalOpen(false);
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
        onClose={handleClose}
        title={`Edit ${food.name}`}
        variant="standard"
        size="sm"
        closeOnOverlay={false}
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
              className={`w-full ${hasUnsavedChanges ? 'bg-primary hover:bg-primary/90' : ''}`}
            >
              {hasUnsavedChanges ? 'Save Changes' : 'Save'}
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
              onImageUpload={handleImageUpload}
              onImageRemove={() => {
                setImageUrl('');
                setImageUploaded(false);
              }}
              bucket="food-images"
            />
            
            {imageUploaded && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-700 font-medium">
                  ✅ Image uploaded successfully! Click "Save Changes" to persist it.
                </p>
              </div>
            )}
            
            {mode === 'default' && (
              <p className="text-xs text-muted-foreground">
                ⚠️ Admin mode: Editing default food that affects all users
              </p>
            )}
          </div>
        </div>


      </UniversalModal>
    </>
  );
};