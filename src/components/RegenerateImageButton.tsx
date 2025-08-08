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
  const [previewPrompt, setPreviewPrompt] = useState('');
  const { toast } = useToast();

  // Preview prompt generation function
  const generatePreviewPrompt = async (manualConcept?: string) => {
    if (mode !== 'motivator') return;

    const rawTitle = prompt.split('.')[0] || prompt;
    const rawContent = prompt.split('.').slice(1).join('.').trim();

    // Get settings
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
      console.log('Using default settings for preview');
    }

      // Style presets
      const STYLE_PRESETS: Record<string, string> = {
        'minimalist_bw': 'Artistic interpretation of {concept} as a flowing black and white minimalist symbol. Organic shapes and curves that capture the essence and emotion of the concept. Hand-drawn quality with natural, flowing lines rather than rigid geometry. Strong contrast with expressive negative space. No text, no letters, no words. Artistic representation that conveys feeling and meaning through abstract organic forms. Centered composition, 1:1 square format.',
        'vibrant_color': 'Abstract artistic interpretation of {concept} using flowing vibrant colors and organic shapes. Expressive brushstrokes and natural forms that capture the emotional essence of the concept. Warm, inspiring color palette with smooth gradients and artistic texture. No geometric constraints, no rigid shapes, no literal objects. Pure emotional and artistic expression through color and form. Square format, fine art quality.',
        'photorealistic': 'Conceptual atmospheric photography representing the essence of {concept}. Moody cinematic lighting with dramatic perspective and depth. Contemporary artistic interpretation through environmental elements, textures, and atmospheric conditions. Focus on mood and feeling rather than literal objects. Dynamic composition with interesting angles, modern aesthetic. Professional fine art photography quality. No people, no text. Square format.',
        'artistic_painterly': 'Artistic illustration of {concept} in watercolor or oil painting style. Soft brushstrokes, artistic texture, flowing colors that blend naturally. Inspiring and uplifting mood with warm or cool color palette. Hand-painted aesthetic, organic shapes, artistic interpretation rather than literal representation. No people or faces, no text/logos. Square canvas format, fine art quality.'
      };

    const defaultConceptTemplate = "Simple black and white icon of {concept}";

    // Determine concept
    let concept = manualConcept || rawTitle;
    if (!manualConcept) {
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
    }

    setDetectedConcept(concept);

    // Generate template
    const templateToUse = (adminTemplate && adminTemplate.includes('{concept}'))
      ? adminTemplate
      : STYLE_PRESETS[selectedPreset] || defaultConceptTemplate;
    
    const preview = templateToUse
      .replace(/{concept}/g, concept)
      .replace(/{primary_color}/g, 'black and white');

    setPreviewPrompt(preview);
    return preview;
  };
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
        'minimalist_bw': 'Artistic interpretation of {concept} as a flowing black and white minimalist symbol. Organic shapes and curves that capture the essence and emotion of the concept. Hand-drawn quality with natural, flowing lines rather than rigid geometry. Strong contrast with expressive negative space. No text, no letters, no words. Artistic representation that conveys feeling and meaning through abstract organic forms. Centered composition, 1:1 square format.',
        'vibrant_color': 'Abstract artistic interpretation of {concept} using flowing vibrant colors and organic shapes. Expressive brushstrokes and natural forms that capture the emotional essence of the concept. Warm, inspiring color palette with smooth gradients and artistic texture. No geometric constraints, no rigid shapes, no literal objects. Pure emotional and artistic expression through color and form. Square format, fine art quality.',
        'photorealistic': 'Conceptual atmospheric photography representing the essence of {concept}. Moody cinematic lighting with dramatic perspective and depth. Contemporary artistic interpretation through environmental elements, textures, and atmospheric conditions. Focus on mood and feeling rather than literal objects. Dynamic composition with interesting angles, modern aesthetic. Professional fine art photography quality. No people, no text. Square format.',
        'artistic_painterly': 'Artistic illustration of {concept} in watercolor or oil painting style. Soft brushstrokes, artistic texture, flowing colors that blend naturally. Inspiring and uplifting mood with warm or cool color palette. Hand-painted aesthetic, organic shapes, artistic interpretation rather than literal representation. No people or faces, no text/logos. Square canvas format, fine art quality.'
      };

      // Default concept-based template (simple black & white)
      const defaultConceptTemplate = "Simple black and white icon of {concept}";

      // Resolve concept and final prompt
      let enhancedPrompt = '';
      if (mode === 'motivator') {
        let concept = rawTitle;
        
        // Use manual override if provided, otherwise try AI extraction
        const override = conceptOverride.trim();
        if (override) {
          concept = override.toLowerCase();
          console.log('Using manual concept override:', concept);
        } else {
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
        }

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
        // Don't call onImageGenerated here - let the realtime subscription handle it
        return;
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
          <PopoverContent className="w-96">
            <div className="space-y-3">
              <div>
                <Label htmlFor="concept-override">Manual concept override</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="concept-override"
                    placeholder="e.g., hourglass, target, footprint"
                    value={conceptOverride}
                    onChange={(e) => setConceptOverride(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => generatePreviewPrompt(conceptOverride.trim() || undefined)}
                    disabled={isRegenerating}
                  >
                    Preview
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {detectedConcept ? `Detected: ${detectedConcept}` : 'Click Preview to see detected concept'}
                  {conceptOverride.trim() && ` → Override: ${conceptOverride.trim()}`}
                </p>
              </div>
              <div>
                <Label>Preview prompt</Label>
                <Textarea 
                  value={previewPrompt || finalPrompt || 'Click Preview to see the prompt'} 
                  readOnly 
                  rows={4} 
                  className="text-xs"
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
};