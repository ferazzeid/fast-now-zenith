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
import { useAIImageGeneration } from '@/hooks/useAIImageGeneration';

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
  const { aiImageEnabled } = useAIImageGeneration();

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
      const title = currentMotivator.title;
      const content = currentMotivator.content;

      // Extract concept via edge function
      let concept = title;
      try {
        // Get user's OpenAI API key
        // No longer supporting API keys - use shared service

        const { data: conceptData } = await supabase.functions.invoke('extract-motivator-concept', {
          body: { title, content }
        });
        if (conceptData?.concept) concept = conceptData.concept;
      } catch {}

      // Define style presets
      const STYLE_PRESETS: Record<string, string> = {
        'minimalist_bw': 'Minimalist vector poster in pure black and white only (no other colors). Single bold silhouette or icon as visual metaphor: {concept}. Flat shapes, clean geometry, strong contrast, ample negative space. Centered composition, no people or faces, no text/letters/logos/watermarks/UI. No gradients, no textures, no 3D, no photorealism, no backgrounds/scenes/props/patterns. 1:1 square, crisp, editorial poster quality.',
        'vibrant_color': 'Minimalist poster design of {concept}. Use exactly 2-3 colors maximum: deep red, black, and white only. Clean geometric shapes, bold silhouette, strong contrast. Centered composition, no text, no fonts, no letters, no words, no numbers, no UI elements, no people, no faces. Simple, modern, classic aesthetic. Professional poster quality, 1:1 square format.',
        'photorealistic': 'Professional photography of {concept}. Realistic, natural lighting with soft shadows and depth. High-quality DSLR camera shot, crisp focus, natural colors and textures. Clean composition with subtle background blur. Documentary or editorial photography style, authentic and inspiring mood. No people or faces, no artificial effects, no text/logos. Square format, professional quality.',
        'artistic_painterly': 'Artistic illustration of {concept} in watercolor or oil painting style. Soft brushstrokes, artistic texture, flowing colors that blend naturally. Inspiring and uplifting mood with warm or cool color palette. Hand-painted aesthetic, organic shapes, artistic interpretation rather than literal representation. No people or faces, no text/logos. Square canvas format, fine art quality.'
      };

      // Load primary color and optional admin template
      let primaryColor = "220 35% 45%";
      let adminTemplate: string | undefined;
      let selectedPreset = 'minimalist_bw';
      try {
        const { data: settingsData } = await supabase
          .from('shared_settings')
          .select('setting_key, setting_value')
          .in('setting_key', ['brand_primary_color', 'ai_image_motivator_prompt', 'ai_image_motivator_prompt_preset']);
        settingsData?.forEach((s) => {
          if (s.setting_key === 'brand_primary_color' && s.setting_value) primaryColor = s.setting_value;
          if (s.setting_key === 'ai_image_motivator_prompt' && s.setting_value) adminTemplate = s.setting_value;
          if (s.setting_key === 'ai_image_motivator_prompt_preset' && s.setting_value) selectedPreset = s.setting_value;
        });
      } catch {}

      const defaultConceptTemplate =
        "Create a minimalist illustration in the style of a black and white photograph, using only black, white, and {primary_color}. The subject of the image should be: {concept}. No accent color, no other colors, no background details, no people or faces, no text. Style: simple, modern, and inspiring.";

      // Use preset template or custom admin template
      const templateToUse = (adminTemplate && adminTemplate.includes('{concept}'))
        ? adminTemplate
        : STYLE_PRESETS[selectedPreset] || defaultConceptTemplate;

      const prompt = templateToUse
        .replace(/{concept}/g, concept)
        .replace(/{primary_color}/g, primaryColor);
      
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
                
                {aiImageEnabled && (
                  <>
                    <div className="flex items-center gap-2">
                      <div className="h-px bg-ceramic-rim flex-1" />
                      <span className="text-xs text-muted-foreground">or</span>
                      <div className="h-px bg-ceramic-rim flex-1" />
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="ai"
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
                          mode="motivator"
                        />
                      )}
                    </div>
                  </>
                )}
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