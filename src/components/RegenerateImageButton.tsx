import { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { generate_image } from '@/utils/imageGeneration';
import { supabase } from '@/integrations/supabase/client';


interface RegenerateImageButtonProps {
  prompt: string;
  filename: string;
  bucket?: string;
  onImageGenerated: (imageUrl: string) => void;
  disabled?: boolean;
  className?: string;
  motivatorId?: string;
  mode?: 'generic' | 'motivator';
}

export const RegenerateImageButton = ({ 
  prompt, 
  filename, 
  bucket,
  onImageGenerated, 
  disabled = false,
  className = "",
  motivatorId,
  mode = 'generic'
}: RegenerateImageButtonProps) => {
  const [isRegenerating, setIsRegenerating] = useState(false);
  const { toast } = useToast();

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      // Derive title/content from provided prompt
      const rawTitle = prompt.split('.')[0] || prompt;
      const rawContent = prompt.split('.').slice(1).join('.').trim();

      // Brand colors
      let primaryColor = "220 35% 45%";
      let adminTemplate: string | undefined;
      try {
        const { data: settingsData } = await supabase
          .from('shared_settings')
          .select('setting_key, setting_value')
          .in('setting_key', ['ai_image_motivator_prompt', 'brand_primary_color']);
        settingsData?.forEach((s) => {
          if (s.setting_key === 'brand_primary_color' && s.setting_value) primaryColor = s.setting_value;
          if (s.setting_key === 'ai_image_motivator_prompt' && s.setting_value) adminTemplate = s.setting_value;
        });
      } catch (e) {
        console.log('Using default settings for image prompt');
      }

      // Default concept-based template
      const defaultConceptTemplate =
        "Create a minimalist illustration in the style of a black and white photograph, using only black, white, and {primary_color}. The subject of the image should be: {concept}. No accent color, no other colors, no background details, no people or faces, no text. Style: simple, modern, and inspiring.";

      // Resolve concept and final prompt
      let enhancedPrompt = '';
      if (mode === 'motivator') {
        let concept = rawTitle;
        try {
          const { data: conceptData } = await supabase.functions.invoke('extract-motivator-concept', {
            body: { title: rawTitle, content: rawContent }
          });
          if (conceptData?.concept) concept = conceptData.concept;
        } catch (e) {
          console.log('Concept extraction failed, falling back to title');
        }
        const templateToUse = adminTemplate && adminTemplate.includes('{concept}')
          ? adminTemplate
          : defaultConceptTemplate;
        enhancedPrompt = templateToUse
          .replace(/{concept}/g, concept)
          .replace(/{primary_color}/g, primaryColor);
      } else {
        // Backward-compatible template using title/content if not in motivator mode
        let genericTemplate = adminTemplate ||
          "Create a simple, clean illustration that represents: {title}. {content}. Style: minimalist, modern, inspiring. Colors: {primary_color} and {accent_color}";
        let accentColor = '142 71% 45%';
        enhancedPrompt = genericTemplate
          .replace(/{title}/g, rawTitle)
          .replace(/{content}/g, rawContent)
          .replace(/{primary_color}/g, primaryColor)
          .replace(/{accent_color}/g, accentColor);
      }

      // If we have a motivatorId, use background generation
      if (motivatorId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error('User not authenticated');
        }

        // Resolve API key from profile or localStorage (for API-user mode)
        const { data: profile } = await supabase
          .from('profiles')
          .select('use_own_api_key, openai_api_key')
          .maybeSingle();
        const apiKey = profile?.use_own_api_key
          ? (profile.openai_api_key || localStorage.getItem('openai_api_key') || undefined)
          : undefined;

        // Call the edge function with tracking info for background processing
        const { data, error } = await supabase.functions.invoke('generate-image', {
          body: { 
            prompt: enhancedPrompt,
            filename,
            bucket,
            motivatorId,
            userId: user.id,
            apiKey
          }
        });

        if (error) {
          throw error;
        }

        toast({
          title: "🎨 Image Generation Started",
          description: "Your image is being generated in the background. It will appear automatically when ready.",
        });
        // Let realtime subscription update the UI
      } else {
        // Synchronous generation
        const newImageUrl = await generate_image(enhancedPrompt, filename, bucket);
        onImageGenerated(newImageUrl);
        toast({
          title: "✨ Image Regenerated!",
          description: "Your new AI-generated image is ready.",
        });
      }
    } catch (error) {
      toast({
        title: "Regeneration failed",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <Button
      variant="ai"
      size="sm"
      onClick={handleRegenerate}
      disabled={disabled || isRegenerating}
      className={`h-8 w-8 p-0 ${className}`}
      title="Regenerate image"
    >
      <RotateCcw className={`w-4 h-4 ${isRegenerating ? 'animate-spin' : ''}`} />
    </Button>
  );
};