import { useState } from 'react';
import { Edit, Save, X, Sparkles } from 'lucide-react';
import { UniversalModal } from '@/components/ui/universal-modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ImageUpload } from '@/components/ImageUpload';
import { generate_image } from '@/utils/imageGeneration';
import { RegenerateImageButton } from '@/components/RegenerateImageButton';
import { supabase } from '@/integrations/supabase/client';

// Unified interfaces for both types
interface FoodEntry {
  id: string;
  name: string;
  calories: number;
  carbs: number;
  serving_size: number;
  image_url?: string;
}

interface UserFood {
  id: string;
  name: string;
  calories_per_100g: number;
  carbs_per_100g: number;
  is_favorite: boolean;
  image_url?: string;
}

interface UnifiedFoodEditModalProps {
  food?: UserFood;
  entry?: FoodEntry;
  onUpdate: (id: string, updates: any) => Promise<void>;
  isOpen?: boolean;
  onClose?: () => void;
  mode?: 'library' | 'entry';
}

export const UnifiedFoodEditModal = ({ 
  food, 
  entry, 
  onUpdate, 
  isOpen, 
  onClose,
  mode = 'library'
}: UnifiedFoodEditModalProps) => {
  const [open, setOpen] = useState(false);
  const modalOpen = isOpen !== undefined ? isOpen : open;
  
  // Get current values based on mode
  const currentItem = food || entry;
  const isLibraryMode = mode === 'library' || !!food;
  
  const [name, setName] = useState(currentItem?.name || '');
  const [calories, setCalories] = useState(
    isLibraryMode 
      ? (food?.calories_per_100g?.toString() || '') 
      : (entry?.calories?.toString() || '')
  );
  const [carbs, setCarbs] = useState(
    isLibraryMode 
      ? (food?.carbs_per_100g?.toString() || '') 
      : (entry?.carbs?.toString() || '')
  );
  const [servingSize, setServingSize] = useState(entry?.serving_size?.toString() || '');
  const [imageUrl, setImageUrl] = useState(currentItem?.image_url || '');
  const [loading, setLoading] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState<string>('');
  const { toast } = useToast();

  const handleSave = async () => {
    if (!name || !calories || !carbs) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please fill in all required fields"
      });
      return;
    }

    if (!isLibraryMode && !servingSize) {
      toast({
        variant: "destructive",
        title: "Missing serving size",
        description: "Please enter a serving size"
      });
      return;
    }

    setLoading(true);
    try {
      const updates = isLibraryMode ? {
        name,
        calories_per_100g: parseFloat(calories),
        carbs_per_100g: parseFloat(carbs),
        image_url: imageUrl || null
      } : {
        name,
        calories: parseFloat(calories),
        carbs: parseFloat(carbs),
        serving_size: parseFloat(servingSize),
        image_url: imageUrl || null
      };

      await onUpdate(currentItem!.id, updates);
      
      toast({
        title: isLibraryMode ? "Food updated" : "Entry updated",
        description: isLibraryMode ? "Food has been updated in your library" : "Food entry has been updated successfully"
      });
      
      setOpen(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: isLibraryMode ? "Failed to update food in library" : "Failed to update food entry"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    if (!currentItem) return;
    setName(currentItem.name);
    setCalories(
      isLibraryMode 
        ? (food?.calories_per_100g?.toString() || '') 
        : (entry?.calories?.toString() || '')
    );
    setCarbs(
      isLibraryMode 
        ? (food?.carbs_per_100g?.toString() || '') 
        : (entry?.carbs?.toString() || '')
    );
    setServingSize(entry?.serving_size?.toString() || '');
    setImageUrl(currentItem.image_url || '');
  };

  const generatePromptForFood = async (foodName: string) => {
    // Fetch admin prompt settings and color themes
    let promptTemplate = "A high-quality photo of {food_name} on a white background, no other items or decorative elements, clean food photography, well-lit, appetizing";
    let primaryColor = "220 35% 45%";
    let accentColor = "142 71% 45%";
    
    try {
      const { data: settingsData } = await supabase
        .from('shared_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['ai_image_food_prompt', 'brand_primary_color', 'brand_accent_color']);
      
      settingsData?.forEach(setting => {
        if (setting.setting_key === 'ai_image_food_prompt' && setting.setting_value) {
          promptTemplate = setting.setting_value;
        } else if (setting.setting_key === 'brand_primary_color' && setting.setting_value) {
          primaryColor = setting.setting_value;
        } else if (setting.setting_key === 'brand_accent_color' && setting.setting_value) {
          accentColor = setting.setting_value;
        }
      });
    } catch (error) {
      console.log('Using default prompt template as fallback');
    }
    
    // Replace variables in the prompt template
    return promptTemplate
      .replace(/{food_name}/g, foodName.trim())
      .replace(/{primary_color}/g, primaryColor)
      .replace(/{accent_color}/g, accentColor);
  };

  const handleGenerateImage = async () => {
    if (!name) {
      toast({
        variant: "destructive",
        title: "Missing food name",
        description: "Please enter a food name before generating an image"
      });
      return;
    }

    setGeneratingImage(true);
    try {
      const prompt = await generatePromptForFood(name);
      setCurrentPrompt(prompt); // Store for regeneration
      const filename = `food-${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.jpg`;
      const generatedImageUrl = await generate_image(prompt, filename);
      setImageUrl(generatedImageUrl);
      
      toast({
        title: "Image generated!",
        description: "AI image generated successfully!"
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Generation failed",
        description: "Failed to generate image. Please try again."
      });
    } finally {
      setGeneratingImage(false);
    }
  };

  const createRegenerateButton = () => {
    if (!imageUrl || !currentPrompt) return null;

    return (
      <RegenerateImageButton
        prompt={currentPrompt}
        filename={`food-${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.jpg`}
        onImageGenerated={setImageUrl}
        disabled={loading || generatingImage}
      />
    );
  };

  if (!currentItem) return null;

  return (
    <>
      {/* Trigger Button - only show if no external control */}
      {isOpen === undefined && (
        <div 
          className="flex items-center w-full px-2 py-1.5 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground rounded-sm relative select-none outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50" 
          onClick={() => setOpen(true)}
          role="menuitem"
        >
          <Edit className="w-4 h-4 mr-2" />
          Edit Food
        </div>
      )}

      {/* Modal */}
      <UniversalModal
        isOpen={modalOpen}
        onClose={() => {
          if (onClose) {
            onClose();
          } else {
            setOpen(false);
          }
          resetForm();
        }}
        title={isLibraryMode ? "Edit Food in Library" : "Edit Food Entry"}
        variant="standard"
        size="md"
        footer={
          <div className="flex space-x-2 w-full">
            <Button onClick={handleSave} disabled={loading || generatingImage} className="flex-1">
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                if (onClose) {
                  onClose();
                } else {
                  setOpen(false);
                }
                resetForm();
              }}
              disabled={loading || generatingImage}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          </div>
        }
      >
        
        <div className="space-y-4">
          {/* Food Name and Serving Size - Two columns when serving size is needed */}
          {!isLibraryMode ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Food Name</Label>
                <Input
                  id="edit-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Apple, Chicken Breast"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-serving">Serving Size (g)</Label>
                <Input
                  id="edit-serving"
                  type="number"
                  value={servingSize}
                  onChange={(e) => setServingSize(e.target.value)}
                  placeholder="100"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="edit-name">Food Name</Label>
              <Input
                id="edit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Apple, Chicken Breast"
              />
            </div>
          )}

          {/* Calories and Carbs */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-calories">
                {isLibraryMode ? 'Calories per 100g' : 'Calories'}
              </Label>
              <Input
                id="edit-calories"
                type="number"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                placeholder={isLibraryMode ? "per 100g" : "per serving"}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-carbs">
                {isLibraryMode ? 'Carbs per 100g (g)' : 'Carbs (g)'}
              </Label>
              <Input
                id="edit-carbs"
                type="number"
                value={carbs}
                onChange={(e) => setCarbs(e.target.value)}
                placeholder={isLibraryMode ? "grams per 100g" : "grams"}
              />
            </div>
          </div>

          <div className="space-y-3">
            {/* Image Upload - No label, just the component */}
            <ImageUpload
              currentImageUrl={imageUrl}
              onImageUpload={setImageUrl}
              onImageRemove={() => setImageUrl('')}
              showUploadOptionsWhenImageExists={false}
              regenerateButton={createRegenerateButton()}
            />

            {/* Upload and Generate buttons side by side */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  // Trigger the hidden file input from ImageUpload
                  const fileInput = document.querySelector('input[type="file"][accept="image/*"]:not([capture])') as HTMLInputElement;
                  if (fileInput) fileInput.click();
                }}
                disabled={loading || generatingImage}
                className="w-full"
              >
                Upload New Image
              </Button>
              
              <Button
                variant="ai"
                onClick={handleGenerateImage}
                disabled={loading || generatingImage}
                className="w-full"
              >
                {generatingImage ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate AI Image
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </UniversalModal>
    </>
  );
};