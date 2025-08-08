import React, { useState } from 'react';
import { Edit, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UniversalModal } from '@/components/ui/universal-modal';
import { useToast } from '@/hooks/use-toast';
import { RegenerateImageButton } from './RegenerateImageButton';
import { ImageUpload } from './ImageUpload';
import { supabase } from '@/integrations/supabase/client';

interface DefaultFood {
  id: string;
  name: string;
  calories_per_100g: number;
  carbs_per_100g: number;
  image_url?: string;
}

interface EditDefaultFoodModalProps {
  food: DefaultFood;
  onUpdate: (foodId: string, updates: Partial<DefaultFood>) => Promise<void>;
}

export const EditDefaultFoodModal = ({ food, onUpdate }: EditDefaultFoodModalProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState(food.name);
  const [caloriesPer100g, setCaloriesPer100g] = useState(food.calories_per_100g.toString());
  const [carbsPer100g, setCarbsPer100g] = useState(food.carbs_per_100g.toString());
  const [imageUrl, setImageUrl] = useState(food.image_url || '');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState<string>('');
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
      console.log('Saving default food with image_url:', imageUrl);
      await onUpdate(food.id, {
        name: name.trim(),
        calories_per_100g: calories,
        carbs_per_100g: carbs,
        image_url: imageUrl || null
      });
      
      setIsOpen(false);
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

  const generatePromptForFood = async (foodName: string) => {
    // Fetch admin prompt settings and color themes
    let promptTemplate = "Professional product photography of {food_name} on a pristine white seamless background surface. Studio lighting, clean minimal composition, isolated subject with no shadows, no other objects, no decorations, no garnishes, no props whatsoever. Only the {food_name} itself, perfectly centered, high resolution, commercial food photography style for product catalog.";
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
    
    // Replace variables in the prompt template - support both {food_name} and {food_item}
    const sanitizedFoodName = foodName.trim();
    return promptTemplate
      .replace(/{food_name}/g, sanitizedFoodName)
      .replace(/{food_item}/g, sanitizedFoodName)
      .replace(/{primary_color}/g, primaryColor)
      .replace(/{accent_color}/g, accentColor);
  };

  const handleGenerateImage = async () => {
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Please enter a food name first",
        variant: "destructive"
      });
      return;
    }

    setIsGeneratingImage(true);
    try {
      console.log('Starting image generation for:', name.trim());
      
      const prompt = await generatePromptForFood(name.trim());
      setCurrentPrompt(prompt); // Store the prompt for regeneration use
      
      const { generateImage } = await import('@/integrations/imageGeneration');
      const filename = `default-food-${Date.now()}.jpg`;
      const newImageUrl = await generateImage(prompt, filename, 'food-images');
      console.log('Generated image URL:', newImageUrl);
      setImageUrl(newImageUrl);
      
      // Auto-save the generated image
      await onUpdate(food.id, { image_url: newImageUrl });
      
      toast({
        title: "✨ Image Generated & Saved!",
        description: "AI-generated image has been automatically saved.",
      });
    } catch (error) {
      console.error('Image generation error:', error);
      toast({
        title: "Generation failed",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleRegenerateImage = async () => {
    if (!name.trim()) return;
    
    setIsGeneratingImage(true);
    try {
      const prompt = await generatePromptForFood(name.trim());
      setCurrentPrompt(prompt);
      
      const { generateImage } = await import('@/integrations/imageGeneration');
      const filename = `default-food-${Date.now()}.jpg`;
      const newImageUrl = await generateImage(prompt, filename, 'food-images');
      setImageUrl(newImageUrl);
      
      // Auto-save the regenerated image
      await onUpdate(food.id, { image_url: newImageUrl });
      
      toast({
        title: "✨ Image Regenerated & Saved!",
        description: "Your new AI-generated image has been automatically saved.",
      });
    } catch (error) {
      toast({
        title: "Regeneration failed",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingImage(false);
    }
  };

  return (
    <>
      {/* Trigger Button */}
      <Button
        variant="ghost"
        size="sm"
        className="p-1 h-6 w-6 hover:bg-primary/10"
        title="Edit default food"
        onClick={() => setIsOpen(true)}
      >
        <Edit className="w-3 h-3 text-muted-foreground" />
      </Button>

      {/* Modal */}
      <UniversalModal
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
          resetForm();
        }}
        title={`Edit ${food.name}`}
        variant="standard"
        size="sm"
        footer={
          <div className="flex gap-2 w-full">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button onClick={handleSave} className="flex-1">
              Save Changes
            </Button>
          </div>
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
              <Label htmlFor="calories">Calories (per 100g)</Label>
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
              <Label htmlFor="carbs">Carbs (per 100g)</Label>
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
            <div className="flex items-center justify-between">
              <Label>Food Image</Label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateImage}
                  disabled={isGeneratingImage}
                  className="text-xs"
                >
                  {isGeneratingImage ? "Generating..." : "Generate AI Image"}
                </Button>
                {imageUrl && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRegenerateImage}
                    disabled={isGeneratingImage}
                    className="h-6 w-6 p-0 opacity-60 hover:opacity-100"
                    title="Regenerate image"
                  >
                    <RotateCcw className={`w-3 h-3 ${isGeneratingImage ? 'animate-spin' : ''}`} />
                  </Button>
                )}
              </div>
            </div>
            <ImageUpload 
              currentImageUrl={imageUrl}
              onImageUpload={setImageUrl}
              onImageRemove={() => setImageUrl('')}
            />
          </div>
        </div>


      </UniversalModal>
    </>
  );
};