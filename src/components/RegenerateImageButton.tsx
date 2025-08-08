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
}

export const RegenerateImageButton = ({ 
  prompt, 
  filename, 
  bucket,
  onImageGenerated, 
  disabled = false,
  className = "",
  motivatorId
}: RegenerateImageButtonProps) => {
  const [isRegenerating, setIsRegenerating] = useState(false);
  const { toast } = useToast();

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      // Use a clean, brand-locked monochrome prompt template
      let promptTemplate = "Minimalist vector poster in black and white only. Strict monochrome: white (#ffffff) and near-black (#0a0a0a); absolutely no other colors. Flat vector shapes, bold silhouette, clean geometry, generous negative space. Centered composition with ~10–12% white margin, single focal motif as a visual metaphor for: {title}. Context cue: {content} kept abstract via shapes/icons only. No people, faces, hands. No text/letters/words/logos/watermarks/UI. No gradients, no textures, no gloss, no 3D, no photorealism, no backgrounds/scenes/props/patterns. 1:1 square, crisp, high-contrast, editorial poster quality.";
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
      const enhancedPrompt = promptTemplate
        .replace(/{title}/g, prompt.split('.')[0] || prompt)
        .replace(/{content}/g, prompt.split('.').slice(1).join('.') || '')
        .replace(/{primary_color}/g, primaryColor)
        .replace(/{accent_color}/g, accentColor);
      
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
        
        // Don't update the UI immediately - let the real-time subscription handle it
      } else {
        // Fallback to synchronous generation for backward compatibility
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