import { useState, useEffect } from 'react';
import { X, Save, Sparkles, Lightbulb, Mic, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { UniversalModal } from '@/components/ui/universal-modal';
import { ImageUpload } from './ImageUpload';
import { useToast } from '@/hooks/use-toast';
import { generate_image } from '@/utils/imageGeneration';
import { useAdminTemplates } from '@/hooks/useAdminTemplates';
import { RegenerateImageButton } from '@/components/RegenerateImageButton';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { SimpleVoiceRecorder } from './SimpleVoiceRecorder';
import { PremiumGate } from '@/components/PremiumGate';

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
      // Fetch admin prompt settings and color themes
      let promptTemplate = "Create a clean, modern cartoon-style illustration with soft colors, rounded edges, and a warm, encouraging aesthetic. Focus on themes of personal growth, motivation, weight loss, and healthy lifestyle. Use gentle pastel colors with light gray and green undertones that complement a ceramic-like design. The style should be simple, uplifting, and relatable to people on a wellness journey. Avoid dark themes, futuristic elements, or overly complex designs.\n\nSubject: {title}. {content}\n\nIncorporate these brand colors naturally: Primary: {primary_color}, Accent: {accent_color}";
      let primaryColor = "220 35% 45%";
      let accentColor = "142 71% 45%";
      
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
    <UniversalModal
      isOpen={true}
      onClose={onClose}
      title={isEditing ? 'Edit Motivator' : 'Create New Motivator'}
      variant="standard"
      size="md"
      showCloseButton={true}
      footer={
        <>
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
        </>
      }
    >

        {/* Admin Templates (only for new motivators) */}
        {!isEditing && templates.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-4 h-4 text-primary" />
              <Label className="text-warm-text font-medium">Get inspired by examples</Label>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-40 overflow-y-auto">
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
        <div className="space-y-2">{/* Further reduced spacing to make content more compact */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="title" className="text-warm-text font-medium">
                Title *
              </Label>
              <PremiumGate feature="Voice Input" showUpgrade={false}>
                <button
                  onClick={() => setShowVoiceRecorder(true)}
                  className="w-6 h-6 rounded-full bg-ai hover:bg-ai/90 text-ai-foreground transition-all duration-200"
                >
                  <Mic className="w-3 h-3 mx-auto" />
                </button>
              </PremiumGate>
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
            <div className="flex items-center justify-between">
              <Label htmlFor="content" className="text-warm-text font-medium">
                Description (Optional)
              </Label>
              <PremiumGate feature="Voice Input" showUpgrade={false}>
                <button
                  onClick={() => setShowVoiceRecorder(true)}
                  className="w-6 h-6 rounded-full bg-ai hover:bg-ai/90 text-ai-foreground transition-all duration-200"
                >
                  <Mic className="w-3 h-3 mx-auto" />
                </button>
              </PremiumGate>
            </div>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="bg-ceramic-base border-ceramic-rim min-h-[40px]"
              placeholder="Optional: Add more details about this motivation..."
            />
          </div>

          <div className="space-y-2">
            {/* Use proper ImageUpload component with regenerate button */}
            <ImageUpload
              currentImageUrl={imageUrl}
              onImageUpload={setImageUrl}
              onImageRemove={() => setImageUrl('')}
              showUploadOptionsWhenImageExists={true}
              regenerateButton={imageUrl ? (
                <RegenerateImageButton
                  prompt={`${title}. ${content}`}
                  filename={`motivator-${Date.now()}.jpg`}
                  onImageGenerated={setImageUrl}
                  disabled={isGeneratingImage}
                />
              ) : undefined}
            />

            {/* Upload and Generate buttons on same line - 50% each */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {}} 
                className="flex-1 bg-ceramic-base border-ceramic-rim"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload New Image
              </Button>
              
              <PremiumGate feature="AI Image Generation">
                <Button
                  variant="ai"
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
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate AI Image
                    </>
                  )}
                </Button>
              </PremiumGate>
            </div>
          </div>
          
          {/* Minimal spacing before footer buttons */}
          <div className="h-2" />
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

    </UniversalModal>
  );
};