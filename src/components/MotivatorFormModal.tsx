import { useState, useEffect } from 'react';
import { X, Save, Sparkles, Lightbulb, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ImageUpload } from './ImageUpload';
import { useToast } from '@/hooks/use-toast';
import { generate_image } from '@/utils/imageGeneration';
import { useAdminTemplates } from '@/hooks/useAdminTemplates';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { SimpleVoiceRecorder } from './SimpleVoiceRecorder';

interface Motivator {
  id?: string;
  title: string;
  content: string;
  category?: string;
  imageUrl?: string;
}

interface MotivatorFormModalProps {
  motivator?: Motivator | null;
  onSave: (motivator: Motivator) => void;
  onClose: () => void;
}

export const MotivatorFormModal = ({ motivator, onSave, onClose }: MotivatorFormModalProps) => {
  const [title, setTitle] = useState(motivator?.title || '');
  const [content, setContent] = useState(motivator?.content || '');
  const [imageUrl, setImageUrl] = useState(motivator?.imageUrl || '');
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const { toast } = useToast();
  const { templates, loading: templatesLoading } = useAdminTemplates();

  const isEditing = !!motivator?.id;

  useEffect(() => {
    if (motivator) {
      setTitle(motivator.title || '');
      setContent(motivator.content || '');
      setImageUrl(motivator.imageUrl || '');
    }
  }, [motivator]);

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
    if (!title.trim()) {
      toast({
        title: "Title required",
        description: "Please add a title for your motivator.",
        variant: "destructive",
      });
      return;
    }

    const motivatorData: Motivator = {
      id: motivator?.id || '', // Ensure ID is always included for editing
      title: title.trim(),
      content: content.trim(),
      imageUrl: imageUrl || undefined
    };

    console.log('MotivatorFormModal: Saving motivator data:', motivatorData);
    onSave(motivatorData);
  };

  const handleVoiceTranscription = (transcription: string) => {
    // If short (likely a title), put in title field
    // If longer, put in content field
    if (transcription.length < 50) {
      setTitle(transcription);
    } else {
      setContent(transcription);
    }
    setShowVoiceRecorder(false);
  };

  const useTemplate = (template: any) => {
    setTitle(template.title);
    setContent(template.description);
    if (template.imageUrl) {
      setImageUrl(template.imageUrl);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-ceramic-plate rounded-3xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto border border-ceramic-rim shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-warm-text">
            {isEditing ? 'Edit Motivator' : 'Create New Motivator'}
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="hover:bg-ceramic-rim"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Admin Templates (only for new motivators) */}
        {!isEditing && templates.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-4 h-4 text-primary" />
              <Label className="text-warm-text font-medium">Get inspired by examples</Label>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto">
              {templates.map((template) => (
                <Card 
                  key={template.id} 
                  className="p-3 cursor-pointer hover:bg-ceramic-base border-ceramic-rim transition-colors"
                  onClick={() => useTemplate(template)}
                >
                  <div className="space-y-1">
                    <p className="font-medium text-sm text-warm-text">{template.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{template.description}</p>
                    <Badge variant="secondary" className="text-xs">
                      {template.category}
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              💡 Click any example to use as a starting point (you can edit it afterwards)
            </p>
          </div>
        )}

        {/* Form */}
        <div className="space-y-4 mb-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="title" className="text-warm-text font-medium">
                Title *
              </Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowVoiceRecorder(true)}
                className="h-6 px-2"
              >
                <Mic className="w-3 h-3 mr-1" />
                <span className="text-xs">Voice</span>
              </Button>
            </div>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-ceramic-base border-ceramic-rim"
              placeholder="What motivates you to fast?"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="content" className="text-warm-text font-medium">
                Description (Optional)
              </Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowVoiceRecorder(true)}
                className="h-6 px-2 text-xs border border-ceramic-rim hover:bg-ceramic-base"
              >
                <Mic className="w-3 h-3 mr-1" />
                <span className="text-xs">Voice</span>
              </Button>
            </div>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="bg-ceramic-base border-ceramic-rim min-h-[80px]"
              placeholder="Optional: Add more details about this motivation..."
            />
          </div>

          <div className="space-y-2">
            <Label className="text-warm-text font-medium">
              Motivator Image (Optional)
            </Label>
            
            <div className="space-y-3">
              {/* Two button approach like food page */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    // Trigger file input for upload/camera
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.capture = 'environment'; // This allows camera on mobile
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) {
                        // Convert to base64 or upload logic here
                        const reader = new FileReader();
                        reader.onload = (e) => {
                          setImageUrl(e.target?.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    };
                    input.click();
                  }}
                  className="flex-1"
                >
                  Upload Image
                </Button>
                
                <Button
                  variant="outline"
                  onClick={handleGenerateImage}
                  disabled={isGeneratingImage}
                  className="flex-1"
                >
                  {isGeneratingImage ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2" />
                      Generating...
                    </>
                  ) : (
                    'Generate Image'
                  )}
                </Button>
              </div>

              {/* Image Preview */}
              {imageUrl && (
                <div className="relative">
                  <img 
                    src={imageUrl} 
                    alt="Motivator preview" 
                    className="w-full h-32 object-cover rounded-lg border border-ceramic-rim"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setImageUrl('')}
                    className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}

              {/* Loading state info */}
              {isGeneratingImage && (
                <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-lg">
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    ⏳ Generating your motivational image... This may take a moment. Please be patient!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Voice Recorder Modal */}
        {showVoiceRecorder && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60]">
            <div className="bg-ceramic-plate rounded-2xl p-6 w-full max-w-sm">
              <div className="text-center mb-4">
                <h4 className="font-semibold text-warm-text mb-2">Voice Input</h4>
                <p className="text-sm text-muted-foreground">
                  Speak your motivator title or description
                </p>
              </div>
              
              <div className="space-y-4">
                <SimpleVoiceRecorder
                  onTranscription={handleVoiceTranscription}
                />
                
                <Button
                  variant="outline"
                  onClick={() => setShowVoiceRecorder(false)}
                  className="w-full"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

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
            disabled={!title.trim()}
            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Save className="w-4 h-4 mr-2" />
            {isEditing ? 'Save Changes' : 'Create Motivator'}
          </Button>
        </div>
      </div>
    </div>
  );
};