import { useState } from 'react';
import { X, Save, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ImageUpload } from './ImageUpload';
import { useToast } from '@/hooks/use-toast';
import { generate_image } from '@/utils/imageGeneration';
import { supabase } from '@/integrations/supabase/client';

interface Motivator {
  id: string;
  title: string;
  content?: string; // Changed from description to match other components
  imageUrl?: string;
  createdAt?: Date;
}

interface EditMotivatorModalProps {
  motivator: Motivator;
  onSave: (motivator: Motivator) => void;
  onClose: () => void;
}

export const EditMotivatorModal = ({ motivator, onSave, onClose }: EditMotivatorModalProps) => {
  const [title, setTitle] = useState(motivator.title);
  const [content, setContent] = useState(motivator.content || '');
  const [imageUrl, setImageUrl] = useState(motivator.imageUrl || '');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const { toast } = useToast();

  const handleGenerateImage = async () => {
    if (!title.trim() && !content.trim()) {
      toast({
        title: "Add some content first",
        description: "Please add a title or description before generating an image.",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingImage(true);
    try {
      // Fetch admin image generation settings
      let stylePrompt = "Create a clean, modern cartoon-style illustration with soft colors, rounded edges, and a warm, encouraging aesthetic. Focus on themes of personal growth, motivation, weight loss, and healthy lifestyle. Use gentle pastel colors with light gray and green undertones that complement a ceramic-like design. The style should be simple, uplifting, and relatable to people on a wellness journey. Avoid dark themes, futuristic elements, or overly complex designs.";
      
      try {
        const { data: settingsData } = await supabase
          .from('shared_settings')
          .select('setting_value')
          .eq('setting_key', 'image_gen_style_prompt')
          .single();
        
        if (settingsData?.setting_value) {
          stylePrompt = settingsData.setting_value;
        }
      } catch (error) {
        console.log('Using default style prompt as fallback');
      }
      
      // Create a prompt for image generation based on the motivator and admin style
      const prompt = `${stylePrompt}\n\nSpecific subject: ${title}. ${content}`;
      
      const newImageUrl = await generate_image(prompt, `motivator-${Date.now()}.jpg`);
      setImageUrl(newImageUrl);
      
      toast({
        title: "✨ Image Generated!",
        description: "Your AI-generated motivator image is ready.",
      });
    } catch (error) {
      toast({
        title: "Image generation failed",
        description: "Please try again or add your own image.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleSave = () => {
    onSave({
      ...motivator,
      title,
      content: content || undefined,
      imageUrl: imageUrl || undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-ceramic-plate rounded-3xl p-6 w-full max-w-md border border-ceramic-rim shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-warm-text">Edit Motivator</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="hover:bg-ceramic-rim"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Form */}
        <div className="space-y-4 mb-6">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-warm-text font-medium">
              Title
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-ceramic-base border-ceramic-rim"
              placeholder="Enter motivator title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content" className="text-warm-text font-medium">
              Description (Optional)
            </Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="bg-ceramic-base border-ceramic-rim min-h-[100px]"
              placeholder="Optional: Add more details about this motivation..."
            />
          </div>

          <div className="space-y-2">
            <Label className="text-warm-text font-medium">
              Motivator Image (Optional)
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
                disabled={isGeneratingImage}
                className="w-full"
              >
                {isGeneratingImage ? (
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
              {isGeneratingImage && (
                <div className="bg-muted/50 border border-border p-2 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Creating your motivational image<span className="animate-pulse">...</span>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 bg-ceramic-base border-ceramic-rim"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
};