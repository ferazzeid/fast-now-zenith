import { useState } from 'react';
import { ArrowLeft, ArrowRight, Sparkles, Camera, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ImageUpload } from './ImageUpload';
import { useToast } from '@/hooks/use-toast';
import { generate_image } from '@/utils/imageGeneration';
import { RegenerateImageButton } from '@/components/RegenerateImageButton';
import { supabase } from '@/integrations/supabase/client';

interface MotivatorTemplate {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: React.ElementType;
  examples: string[];
  imagePrompt: string;
}

interface CreatedMotivator {
  title: string;
  content: string;
  category: string;
  imageUrl?: string;
}

interface MotivatorCreationWizardProps {
  templates: MotivatorTemplate[];
  onComplete: (motivators: CreatedMotivator[]) => void;
  onCancel: () => void;
}

export const MotivatorCreationWizard = ({ templates, onComplete, onCancel }: MotivatorCreationWizardProps) => {
  const [currentTemplateIndex, setCurrentTemplateIndex] = useState(0);
  const [createdMotivators, setCreatedMotivators] = useState<CreatedMotivator[]>([]);
  const [currentMotivator, setCurrentMotivator] = useState({
    title: '',
    content: '',
    imageUrl: ''
  });
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const { toast } = useToast();

  const currentTemplate = templates[currentTemplateIndex];
  const isLastTemplate = currentTemplateIndex === templates.length - 1;

  const handleGenerateImage = async () => {
    if (!currentMotivator.title && !currentMotivator.content) {
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
        .replace(/{title}/g, currentMotivator.title)
        .replace(/{content}/g, currentMotivator.content)
        .replace(/{primary_color}/g, primaryColor)
        .replace(/{accent_color}/g, accentColor);
      
      const imageUrl = await generate_image(prompt, `motivator-${Date.now()}.jpg`);
      setCurrentMotivator(prev => ({ ...prev, imageUrl }));
      
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

  const handleNext = () => {
    if (!currentMotivator.title.trim()) {
      toast({
        title: "Title required",
        description: "Please add a title for your motivator.",
        variant: "destructive",
      });
      return;
    }

    const motivator: CreatedMotivator = {
      title: currentMotivator.title,
      content: currentMotivator.content || '',
      category: currentTemplate.category,
      imageUrl: currentMotivator.imageUrl || undefined
    };

    const newCreatedMotivators = [...createdMotivators, motivator];
    setCreatedMotivators(newCreatedMotivators);

    if (isLastTemplate) {
      onComplete(newCreatedMotivators);
    } else {
      setCurrentTemplateIndex(prev => prev + 1);
      setCurrentMotivator({ title: '', content: '', imageUrl: '' });
    }
  };

  const handlePrevious = () => {
    if (currentTemplateIndex > 0) {
      setCurrentTemplateIndex(prev => prev - 1);
      // Restore previous motivator data
      const previousMotivator = createdMotivators[currentTemplateIndex - 1];
      if (previousMotivator) {
        setCurrentMotivator({
          title: previousMotivator.title,
          content: previousMotivator.content,
          imageUrl: previousMotivator.imageUrl || ''
        });
        // Remove it from created list since we're editing
        setCreatedMotivators(prev => prev.slice(0, -1));
      }
    }
  };

  const Icon = currentTemplate.icon;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="bg-ceramic-plate p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto border-ceramic-rim">
        <div className="space-y-6">
          {/* Progress Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-warm-text">{currentTemplate.title}</h2>
                <p className="text-sm text-muted-foreground">
                  Step {currentTemplateIndex + 1} of {templates.length}
                </p>
              </div>
            </div>
            <Badge variant="outline">
              {currentTemplate.category}
            </Badge>
          </div>

          {/* Template Description & Examples */}
          <div className="bg-ceramic-base p-4 rounded-lg space-y-3">
            <p className="text-sm text-muted-foreground">{currentTemplate.description}</p>
            <div>
              <p className="text-xs font-medium text-warm-text mb-2">Example ideas:</p>
              <div className="flex flex-wrap gap-1">
                {currentTemplate.examples.map((example, idx) => (
                  <Badge 
                    key={idx} 
                    variant="secondary" 
                    className="text-xs cursor-pointer hover:bg-primary hover:text-primary-foreground"
                    onClick={() => setCurrentMotivator(prev => ({ ...prev, title: example }))}
                  >
                    {example}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-warm-text font-medium">
                Motivator Title *
              </Label>
              <Input
                id="title"
                value={currentMotivator.title}
                onChange={(e) => setCurrentMotivator(prev => ({ ...prev, title: e.target.value }))}
                placeholder="What motivates you to fast?"
                className="bg-ceramic-base border-ceramic-rim"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content" className="text-warm-text font-medium">
                Description (optional)
              </Label>
              <Textarea
                id="content"
                value={currentMotivator.content}
                onChange={(e) => setCurrentMotivator(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Add more details about this motivation..."
                className="bg-ceramic-base border-ceramic-rim min-h-[80px]"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-warm-text font-medium">
                Motivator Image
              </Label>
              
              <div className="space-y-3">
                <ImageUpload
                  currentImageUrl={currentMotivator.imageUrl}
                  onImageUpload={(url) => setCurrentMotivator(prev => ({ ...prev, imageUrl: url }))}
                  onImageRemove={() => setCurrentMotivator(prev => ({ ...prev, imageUrl: '' }))}
                />
                
                <div className="flex items-center gap-2">
                  <div className="h-px bg-ceramic-rim flex-1" />
                  <span className="text-xs text-muted-foreground">or</span>
                  <div className="h-px bg-ceramic-rim flex-1" />
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleGenerateImage}
                    disabled={isGeneratingImage}
                    className="flex-1"
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
                  
                  {currentMotivator.imageUrl && (
                    <RegenerateImageButton
                      prompt={`${currentMotivator.title}. ${currentMotivator.content}`}
                      filename={`motivator-${Date.now()}.jpg`}
                      onImageGenerated={(url) => setCurrentMotivator(prev => ({ ...prev, imageUrl: url }))}
                      disabled={isGeneratingImage}
                    />
                  )}
                </div>
              </div>
              
              <p className="text-xs text-muted-foreground">
                💡 <strong>Pro tip:</strong> Personal photos (loved ones, goal outfits, progress pics) 
                are usually more motivating than AI-generated images.
              </p>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            
            {currentTemplateIndex > 0 && (
              <Button variant="outline" onClick={handlePrevious}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
            )}
            
            <Button 
              onClick={handleNext} 
              disabled={!currentMotivator.title.trim()}
              className="flex-1 bg-primary"
            >
              {isLastTemplate ? (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Create Motivators
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};