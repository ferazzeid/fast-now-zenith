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
}

export const RegenerateImageButton = ({ 
  prompt, 
  filename, 
  bucket,
  onImageGenerated, 
  disabled = false,
  className = ""
}: RegenerateImageButtonProps) => {
  const [isRegenerating, setIsRegenerating] = useState(false);
  const { toast } = useToast();

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      // Use the same admin settings as EditMotivatorModal
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
      const enhancedPrompt = promptTemplate
        .replace(/{title}/g, prompt.split('.')[0] || prompt)
        .replace(/{content}/g, prompt.split('.').slice(1).join('.') || '')
        .replace(/{primary_color}/g, primaryColor)
        .replace(/{accent_color}/g, accentColor);
      
      const newImageUrl = await generate_image(enhancedPrompt, filename, bucket);
      onImageGenerated(newImageUrl);
      
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