import { useState } from 'react';
import { RotateCcw, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { generate_image } from '@/utils/imageGeneration';
import { supabase } from '@/integrations/supabase/client';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

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
  const [conceptOverride, setConceptOverride] = useState('');
  const [detectedConcept, setDetectedConcept] = useState('');
  const [finalPrompt, setFinalPrompt] = useState('');
  const { toast } = useToast();
  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      // Derive title/content from provided prompt
      const rawTitle = prompt.split('.')[0] || prompt;
      const rawContent = prompt.split('.').slice(1).join('.').trim();

      // Brand colors and style preset
      let primaryColor = "220 35% 45%";
      let adminTemplate: string | undefined;
      let selectedPreset = 'minimalist_bw';
      try {
        const { data: settingsData } = await supabase
          .from('shared_settings')
          .select('setting_key, setting_value')
          .in('setting_key', ['ai_image_motivator_prompt', 'ai_image_motivator_prompt_preset', 'brand_primary_color']);
        settingsData?.forEach((s) => {
          if (s.setting_key === 'brand_primary_color' && s.setting_value) primaryColor = s.setting_value;
          if (s.setting_key === 'ai_image_motivator_prompt' && s.setting_value) adminTemplate = s.setting_value;
          if (s.setting_key === 'ai_image_motivator_prompt_preset' && s.setting_value) selectedPreset = s.setting_value;
        });
      } catch (e) {
        console.log('Using default settings for image prompt');
      }

      // Define style presets
      const STYLE_PRESETS: Record<string, string> = {
        'minimalist_bw': 'Minimalist vector poster in pure black and white only (no other colors). Single bold silhouette or icon as visual metaphor: {concept}. Flat shapes, clean geometry, strong contrast, ample negative space. Centered composition, no people or faces, no text/letters/logos/watermarks/UI. No gradients, no textures, no 3D, no photorealism, no backgrounds/scenes/props/patterns. 1:1 square, crisp, editorial poster quality.',
        'vibrant_color': 'Bold, vibrant poster design featuring {concept}. Rich saturated colors with deep reds, electric blues, or golden yellows as primary palette. Strong visual impact with dramatic lighting and contrast. Modern graphic design style, clean composition, powerful and inspiring mood. Centered subject, no people or faces, no text/letters/logos. Professional poster quality, 1:1 square format.',
        'photorealistic': 'Professional photography of {concept}. Realistic, natural lighting with soft shadows and depth. High-quality DSLR camera shot, crisp focus, natural colors and textures. Clean composition with subtle background blur. Documentary or editorial photography style, authentic and inspiring mood. No people or faces, no artificial effects, no text/logos. Square format, professional quality.',
        'artistic_painterly': 'Artistic illustration of {concept} in watercolor or oil painting style. Soft brushstrokes, artistic texture, flowing colors that blend naturally. Inspiring and uplifting mood with warm or cool color palette. Hand-painted aesthetic, organic shapes, artistic interpretation rather than literal representation. No people or faces, no text/logos. Square canvas format, fine art quality.'
      };

      // Default concept-based template (simple black & white)
      const defaultConceptTemplate = "Simple black and white icon of {concept}";

      // Resolve concept and final prompt
      let enhancedPrompt = '';
      if (mode === 'motivator') {
        let concept = rawTitle;
        try {
          // Get user's OpenAI API key
          const { data: profile } = await supabase
            .from('profiles')
            .select('openai_api_key, use_own_api_key')
            .maybeSingle();

          let apiKey = profile?.use_own_api_key ? (profile.openai_api_key || undefined) : undefined;
          if (!apiKey && typeof window !== 'undefined' && profile?.use_own_api_key) {
            const localKey = localStorage.getItem('openai_api_key');
            if (localKey) apiKey = localKey;
          }

          const { data: conceptData } = await supabase.functions.invoke('extract-motivator-concept', {
            body: { title: rawTitle, content: rawContent, apiKey }
          });
          if (conceptData?.concept) concept = conceptData.concept;
        } catch (e) {
          console.log('Concept extraction failed, falling back to title');
        }
        // Apply manual override if provided
        const override = conceptOverride.trim();
        if (override) concept = override.toLowerCase();

        // Use preset template or custom admin template
        const templateToUse = (adminTemplate && adminTemplate.includes('{concept}'))
          ? adminTemplate
          : STYLE_PRESETS[selectedPreset] || defaultConceptTemplate;
        enhancedPrompt = templateToUse
          .replace(/{concept}/g, concept)
          .replace(/{primary_color}/g, 'black and white');

        setDetectedConcept(concept);
        setFinalPrompt(enhancedPrompt);
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
        setFinalPrompt(enhancedPrompt);
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
    <div className={`flex items-center gap-1`}>
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

      {mode === 'motivator' && (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              title="Concept & prompt"
            >
              <Info className="w-4 h-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-2">
              <div>
                <Label htmlFor="concept-override">Manual concept override</Label>
                <Input
                  id="concept-override"
                  placeholder="e.g., hourglass, target, footprint"
                  value={conceptOverride}
                  onChange={(e) => setConceptOverride(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">Detected: {detectedConcept || '—'}</p>
              </div>
              <div>
                <Label>Final prompt</Label>
                <Textarea value={finalPrompt} readOnly rows={5} />
              </div>
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
};