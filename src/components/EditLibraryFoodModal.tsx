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

interface UserFood {
  id: string;
  name: string;
  calories_per_100g: number;
  carbs_per_100g: number;
  is_favorite: boolean;
  image_url?: string;
}

interface EditLibraryFoodModalProps {
  food: UserFood;
  onUpdate: (id: string, updates: Partial<UserFood>) => Promise<void>;
  isOpen?: boolean;
  onClose?: () => void;
}

export const EditLibraryFoodModal = ({ food, onUpdate, isOpen, onClose }: EditLibraryFoodModalProps) => {
  const [open, setOpen] = useState(false);
  const modalOpen = isOpen !== undefined ? isOpen : open;
  const [name, setName] = useState(food.name);
  const [calories, setCalories] = useState(food.calories_per_100g.toString());
  const [carbs, setCarbs] = useState(food.carbs_per_100g.toString());
  const [imageUrl, setImageUrl] = useState(food.image_url || '');
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

    setLoading(true);
    try {
      await onUpdate(food.id, {
        name,
        calories_per_100g: parseFloat(calories),
        carbs_per_100g: parseFloat(carbs),
        image_url: imageUrl || null
      });
      
      toast({
        title: "Food updated",
        description: "Food has been updated in your library"
      });
      
      setOpen(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update food in library"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName(food.name);
    setCalories(food.calories_per_100g.toString());
    setCarbs(food.carbs_per_100g.toString());
    setImageUrl(food.image_url || '');
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
      
      // Auto-save the generated image
      await onUpdate(food.id, { image_url: generatedImageUrl });
      
      toast({
        title: "Image generated & saved!",
        description: "AI image generated and automatically saved!"
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
        title="Edit Food in Library"
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
              onClick={() => setOpen(false)}
              disabled={loading || generatingImage}
            >
              <X className="w-8 h-8 mr-2" />
              Cancel
            </Button>
          </div>
        }
      >
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-lib-name">Food Name</Label>
            <Input
              id="edit-lib-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Apple, Chicken Breast"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-lib-calories">Calories per 100g</Label>
              <Input
                id="edit-lib-calories"
                type="number"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                placeholder="per 100g"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-lib-carbs">Carbs per 100g (g)</Label>
              <Input
                id="edit-lib-carbs"
                type="number"
                value={carbs}
                onChange={(e) => setCarbs(e.target.value)}
                placeholder="grams per 100g"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-warm-text font-medium">
              Food Image (Optional)
            </Label>
            
            <div className="space-y-3">
              {/* Use proper ImageUpload component with upload options always visible */}
              <ImageUpload
                currentImageUrl={imageUrl}
                onImageUpload={setImageUrl}
                onImageRemove={() => setImageUrl('')}
                showUploadOptionsWhenImageExists={true}
              />

              {/* AI Generation button */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleGenerateImage}
                  disabled={loading || generatingImage}
                  className="flex-1"
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
                
                {imageUrl && currentPrompt && (
                  <RegenerateImageButton
                    prompt={currentPrompt} // Use the admin prompt that was stored
                    filename={`food-${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.jpg`}
                    onImageGenerated={async (newImageUrl) => {
                      setImageUrl(newImageUrl);
                      await onUpdate(food.id, { image_url: newImageUrl });
                      toast({
                        title: "Image regenerated & saved!",
                        description: "New AI image automatically saved!"
                      });
                    }}
                    disabled={loading || generatingImage}
                  />
                )}
              </div>

            </div>
          </div>
        </div>
      </UniversalModal>
    </>
  );
};