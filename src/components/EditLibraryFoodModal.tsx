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
}

export const EditLibraryFoodModal = ({ food, onUpdate }: EditLibraryFoodModalProps) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(food.name);
  const [calories, setCalories] = useState(food.calories_per_100g.toString());
  const [carbs, setCarbs] = useState(food.carbs_per_100g.toString());
  const [imageUrl, setImageUrl] = useState(food.image_url || '');
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
      const prompt = `A lightly cartoony and semi-realistic illustration of ${name}, food illustration style, clean background, appetizing, vibrant colors`;
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
        <DialogHeader>
          <DialogTitle>Edit Food in Library</DialogTitle>
        </DialogHeader>
        
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
              {/* Use proper ImageUpload component */}
              <ImageUpload
                currentImageUrl={imageUrl}
                onImageUpload={setImageUrl}
                onImageRemove={() => setImageUrl('')}
              />

              {/* AI Generation button */}
              <Button
                variant="outline"
                onClick={handleGenerateImage}
                disabled={loading || generatingImage}
                className="w-full"
              >
                {generatingImage ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" />
                    Generating AI Image...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate AI Image
                  </>
                )}
              </Button>

              {/* Loading state info */}
              {generatingImage && (
                <div className="bg-muted/50 border border-border p-2 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Creating your food image<span className="animate-pulse">...</span>
                  </p>
                </div>
              )}
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
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};