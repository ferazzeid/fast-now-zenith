import { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { generate_image } from '@/utils/imageGeneration';

interface RegenerateImageButtonProps {
  prompt: string;
  filename: string;
  onImageGenerated: (imageUrl: string) => void;
  disabled?: boolean;
  className?: string;
}

export const RegenerateImageButton = ({ 
  prompt, 
  filename, 
  onImageGenerated, 
  disabled = false,
  className = ""
}: RegenerateImageButtonProps) => {
  const [isRegenerating, setIsRegenerating] = useState(false);
  const { toast } = useToast();

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      const newImageUrl = await generate_image(prompt, filename);
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
      variant="ghost"
      size="sm"
      onClick={handleRegenerate}
      disabled={disabled || isRegenerating}
      className={`h-6 w-6 p-0 opacity-60 hover:opacity-100 ${className}`}
      title="Regenerate image"
    >
      <RotateCcw className={`w-3 h-3 ${isRegenerating ? 'animate-spin' : ''}`} />
    </Button>
  );
};