import { useState } from 'react';
import { Save, Sparkles, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { UniversalModal } from '@/components/ui/universal-modal';
import { ImageUpload } from './ImageUpload';
import { useToast } from '@/hooks/use-toast';
import { generate_image } from '@/utils/imageGeneration';
import { supabase } from '@/integrations/supabase/client';
import { RegenerateImageButton } from '@/components/RegenerateImageButton';

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
      // Fetch admin prompt settings and color themes
      let promptTemplate = "Create a clean, modern cartoon-style illustration with soft colors, rounded edges, and a warm, encouraging aesthetic. Focus on themes of personal growth, motivation, weight loss, and healthy lifestyle. Use gentle pastel colors with light gray and green undertones that complement a ceramic-like design. The style should be simple, uplifting, and relatable to people on a wellness journey. Avoid dark themes, futuristic elements, or overly complex designs.\n\nSubject: {title}. {content}\n\nIncorporate these brand colors naturally: Primary: {primary_color}, Accent: {accent_color}";
      let primaryColor = "220 35% 45%";
      let accentColor = "262 83% 58%";
      
      try {
        const { data: settingsData } = await supabase
          .from('shared_settings')
          .select('setting_key, setting_value')
          .in('setting_key', ['ai_image_motivator_prompt', 'brand_primary_color', 'brand_accent_color']);
        
        settingsData?.forEach(setting => {
          if (setting.setting_key === 'ai_image_motivator_prompt' && setting.setting_value) {
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
        .replace(/{title}/g, title)
        .replace(/{content}/g, content)
        .replace(/{primary_color}/g, primaryColor)
        .replace(/{accent_color}/g, accentColor);
      
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
    <UniversalModal
      isOpen={true}
      onClose={onClose}
      title="Edit Motivator"
      variant="standard"
      size="md"
      showCloseButton={false}
      footer={
        <div className="flex gap-2 w-full">
          <Button onClick={handleSave} className="flex-1">
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
        </div>
      }
    >

        {/* Form */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="font-medium">
              Title
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter motivator title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content" className="font-medium">
              Description (Optional)
            </Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[100px]"
              placeholder="Optional: Add more details about this motivation..."
            />
          </div>

          <div className="space-y-2">
            <Label className="font-medium">
              Motivator Image (Optional)
            </Label>
            
            <div className="space-y-3">
              {/* Use proper ImageUpload component */}
            <ImageUpload
              currentImageUrl={imageUrl}
              onImageUpload={setImageUrl}
              onImageRemove={() => setImageUrl('')}
              showUploadOptionsWhenImageExists={true}
            />

              {/* AI Generation buttons */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleGenerateImage}
                  disabled={isGeneratingImage}
                  className="flex-1 hover:bg-gray-50"
                >
                  {isGeneratingImage ? (
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
                  <Button
                    variant="outline"
                    onClick={async () => {
                      setIsGeneratingImage(true);
                      try {
                        const newImageUrl = await generate_image(`${title}. ${content}`, `motivator-${Date.now()}.jpg`);
                        setImageUrl(newImageUrl);
                        toast({
                          title: "✨ Image Regenerated!",
                          description: "Your new AI-generated image is ready.",
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
                    }}
                    disabled={isGeneratingImage}
                    className="px-4 hover:bg-gray-50"
                    title="Regenerate image"
                  >
                    <RotateCcw className={`w-4 h-4 ${isGeneratingImage ? 'animate-spin' : ''}`} />
                  </Button>
                )}
              </div>

            </div>
          </div>
        </div>
    </UniversalModal>
  );
};