import { useState } from 'react';
import { Edit, Save, X, Sparkles } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ImageUpload } from '@/components/ImageUpload';
import { generate_image } from '@/utils/imageGeneration';
import { RegenerateImageButton } from '@/components/RegenerateImageButton';
import { supabase } from '@/integrations/supabase/client';

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
  onUpdate: (id: string, updates: Partial<FoodEntry>) => Promise<void>;
}

export const EditFoodEntryModal = ({ entry, onUpdate }: EditFoodEntryModalProps) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(entry.name);
  const [calories, setCalories] = useState(entry.calories.toString());
  const [carbs, setCarbs] = useState(entry.carbs.toString());
  const [servingSize, setServingSize] = useState(entry.serving_size.toString());
  const [imageUrl, setImageUrl] = useState(entry.image_url || '');
  const [loading, setLoading] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
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
      await onUpdate(entry.id, {
        name,
        calories: parseFloat(calories),
        carbs: parseFloat(carbs),
        serving_size: parseFloat(servingSize),
        image_url: imageUrl || null
      });
      
      toast({
        title: "Entry updated",
        description: "Food entry has been updated successfully"
      });
      
      setOpen(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update food entry"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName(entry.name);
    setCalories(entry.calories.toString());
    setCarbs(entry.carbs.toString());
    setServingSize(entry.serving_size.toString());
    setImageUrl(entry.image_url || '');
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
      // Fetch admin prompt settings and color themes
      let promptTemplate = "A lightly cartoony and semi-realistic illustration of {food_name}, food illustration style, clean background, appetizing, vibrant colors. Style should match this color theme: {primary_color} primary, {accent_color} accent. Clean, professional food photography style with soft lighting.";
      let primaryColor = "220 35% 45%";
      let accentColor = "262 83% 58%";
      
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
      const prompt = promptTemplate
        .replace(/{food_name}/g, name)
        .replace(/{primary_color}/g, primaryColor)
        .replace(/{accent_color}/g, accentColor);
      const filename = `food-${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.jpg`;
      const generatedImageUrl = await generate_image(prompt, filename);
      setImageUrl(generatedImageUrl);
      
      toast({
        title: "Image generated",
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

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen);
      if (!newOpen) resetForm();
    }}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Edit className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b border-border p-4">
          <DialogTitle className="text-lg font-semibold">Edit Food Entry</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Food Name</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Apple, Chicken Breast"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-calories">Calories</Label>
              <Input
                id="edit-calories"
                type="number"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                placeholder="per serving"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-carbs">Carbs (g)</Label>
              <Input
                id="edit-carbs"
                type="number"
                value={carbs}
                onChange={(e) => setCarbs(e.target.value)}
                placeholder="grams"
              />
            </div>
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

          <div className="space-y-2">
            <Label className="text-warm-text font-medium">
              Food Image (Optional)
            </Label>
            
            <div className="space-y-3">
              <ImageUpload
                currentImageUrl={imageUrl}
                onImageUpload={setImageUrl}
                onImageRemove={() => setImageUrl('')}
                showUploadOptionsWhenImageExists={true}
              />

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
                
                {imageUrl && (
                  <RegenerateImageButton
                    prompt={`Food photography of ${name}, appetizing, high quality, well-lit`}
                    filename={`food-${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.jpg`}
                    onImageGenerated={setImageUrl}
                    disabled={loading || generatingImage}
                  />
                )}
              </div>

            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button onClick={handleSave} disabled={loading || generatingImage} className="flex-1">
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setOpen(false)}
              disabled={loading || generatingImage}
            >
              <X className="w-6 h-6 mr-2" />
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};