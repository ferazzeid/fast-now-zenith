import React, { useState } from 'react';
import { Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { RegenerateImageButton } from './RegenerateImageButton';
import { ImageUpload } from './ImageUpload';

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
      const { generateImage } = await import('@/integrations/imageGeneration');
      const prompt = `A high-quality, appetizing photo of ${name.trim()}, food photography, clean background, well-lit`;
      const filename = `default-food-${Date.now()}.jpg`;
      const newImageUrl = await generateImage(prompt, filename, 'food-images');
      console.log('Generated image URL:', newImageUrl);
      setImageUrl(newImageUrl);
      toast({
        title: "✨ Image Generated!",
        description: "AI-generated image ready for your default food.",
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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) {
        resetForm();
      }
    }}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="p-1 h-6 w-6 hover:bg-primary/10"
          title="Edit default food"
        >
          <Edit className="w-3 h-3 text-muted-foreground" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Default Food</DialogTitle>
        </DialogHeader>
        
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
                  <RegenerateImageButton 
                    prompt={`A high-quality, appetizing photo of ${name.trim()}, food photography, clean background, well-lit`}
                    filename={`default-food-${Date.now()}.jpg`}
                    bucket="food-images"
                    onImageGenerated={setImageUrl}
                    disabled={isGeneratingImage}
                  />
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

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};