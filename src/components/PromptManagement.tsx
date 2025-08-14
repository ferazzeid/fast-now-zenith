import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Info, Wand2, TestTube, Palette } from "lucide-react";
import { useColorTheme } from "@/hooks/useColorTheme";

interface PromptConfig {
  key: string;
  title: string;
  description: string;
  defaultPrompt: string;
  variables: string[];
  hasStylePresets?: boolean;
}

interface StylePreset {
  key: string;
  name: string;
  description: string;
  prompt: string;
}

const STYLE_PRESETS: StylePreset[] = [
  {
    key: 'minimalist_bw',
    name: 'Minimalist B&W',
    description: 'Clean black and white geometric design',
    prompt: 'Minimalist vector poster in pure black and white only (no other colors). Single bold silhouette or icon as visual metaphor: {concept}. Flat shapes, clean geometry, strong contrast, ample negative space. Centered composition, no people or faces, no text/letters/logos/watermarks/UI. No gradients, no textures, no 3D, no photorealism, no backgrounds/scenes/props/patterns. 1:1 square, crisp, editorial poster quality.'
  },
  {
    key: 'vibrant_color',
    name: 'Vibrant Color',
    description: 'Clean 2-3 color design with powerful visual impact',
    prompt: 'Minimalist poster design of {concept}. Use exactly 2-3 colors maximum: deep red, black, and white only. Clean geometric shapes, bold silhouette, strong contrast. Centered composition, no text, no fonts, no letters, no words, no numbers, no UI elements, no people, no faces. Simple, modern, classic aesthetic. Professional poster quality, 1:1 square format.'
  },
  {
    key: 'photorealistic',
    name: 'Photorealistic',
    description: 'Natural photography style with realistic lighting',
    prompt: 'Professional photography of {concept}. Realistic, natural lighting with soft shadows and depth. High-quality DSLR camera shot, crisp focus, natural colors and textures. Clean composition with subtle background blur. Documentary or editorial photography style, authentic and inspiring mood. No people or faces, no artificial effects, no text/logos. Square format, professional quality.'
  },
  {
    key: 'artistic_painterly',
    name: 'Artistic/Painterly',
    description: 'Watercolor, oil painting, or artistic illustration',
    prompt: 'Artistic illustration of {concept} in watercolor or oil painting style. Soft brushstrokes, artistic texture, flowing colors that blend naturally. Inspiring and uplifting mood with warm or cool color palette. Hand-painted aesthetic, organic shapes, artistic interpretation rather than literal representation. No people or faces, no text/logos. Square canvas format, fine art quality.'
  }
];

const PROMPT_CONFIGS: PromptConfig[] = [
  {
    key: 'ai_image_motivator_prompt',
    title: 'Motivator Image Generation',
    description: 'Visual style for motivational images. Uses {concept} only.',
    defaultPrompt: 'Minimalist vector poster in pure black and white only (no other colors). Single bold silhouette or icon as visual metaphor: {concept}. Flat shapes, clean geometry, strong contrast, ample negative space. Centered composition, no people or faces, no text/letters/logos/watermarks/UI. No gradients, no textures, no 3D, no photorealism, no backgrounds/scenes/props/patterns. 1:1 square, crisp, editorial poster quality.',
    variables: ['{concept}'],
    hasStylePresets: true
  },
  {
    key: 'ai_food_response_template',
    title: 'Food Entry Response Format',
    description: 'Controls how the AI formats responses when presenting food entry details to users.',
    defaultPrompt: 'I\'ve prepared a food entry for you:\n\n**Food:** {food_name}\n**Portion:** {serving_size}g\n**Calories:** {calories} cal\n**Carbs:** {carbs}g\n\nThis looks good for your nutrition tracking! Would you like me to add this to your food log?',
    variables: ['{food_name}', '{serving_size}', '{calories}', '{carbs}']
  },
  {
    key: 'ai_food_estimation_prompt',
    title: 'Nutrition Estimation Guidelines',
    description: 'Guidelines for the AI when estimating nutritional values for foods.',
    defaultPrompt: 'When estimating nutrition values, use these guidelines: Provide realistic estimates based on common food databases. For proteins like chicken/fish, estimate ~165-200 calories and 0-2g carbs per 100g. For fruits, estimate 40-80 calories and 10-20g carbs per 100g. For vegetables, estimate 20-50 calories and 3-10g carbs per 100g. Always ask for clarification if the food description is vague.',
    variables: []
  },
];

export const PromptManagement: React.FC = () => {
  const [prompts, setPrompts] = useState<Record<string, string>>({});
  const [selectedPresets, setSelectedPresets] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [testing, setTesting] = useState<string | null>(null);
  const { toast } = useToast();
  const { colorSettings } = useColorTheme();

  useEffect(() => {
    loadPrompts();
  }, []);

  const loadPrompts = async () => {
    try {
      const promptKeys = PROMPT_CONFIGS.map(config => config.key);
      const presetKeys = PROMPT_CONFIGS.filter(c => c.hasStylePresets).map(c => `${c.key}_preset`);
      const allKeys = [...promptKeys, ...presetKeys];
      
      const { data, error } = await supabase
        .from('shared_settings')
        .select('setting_key, setting_value')
        .in('setting_key', allKeys);

      if (error) {
        console.error('Error loading prompts:', error);
        return;
      }

      const loadedPrompts: Record<string, string> = {};
      const loadedPresets: Record<string, string> = {};
      
      PROMPT_CONFIGS.forEach(config => {
        const setting = data?.find(s => s.setting_key === config.key);
        loadedPrompts[config.key] = setting?.setting_value || config.defaultPrompt;
        
        if (config.hasStylePresets) {
          const presetSetting = data?.find(s => s.setting_key === `${config.key}_preset`);
          loadedPresets[config.key] = presetSetting?.setting_value || 'minimalist_bw';
        }
      });

      setPrompts(loadedPrompts);
      setSelectedPresets(loadedPresets);
    } catch (error) {
      console.error('Error loading prompts:', error);
      toast({
        title: "Error",
        description: "Failed to load AI prompts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const savePrompt = async (key: string) => {
    setSaving(key);
    try {
      const updates = [{
        setting_key: key,
        setting_value: prompts[key],
      }];

      // Also save the preset selection if this config has style presets
      const config = PROMPT_CONFIGS.find(c => c.key === key);
      if (config?.hasStylePresets && selectedPresets[key]) {
        updates.push({
          setting_key: `${key}_preset`,
          setting_value: selectedPresets[key],
        });
      }

      const { error } = await supabase
        .from('shared_settings')
        .upsert(updates, {
          onConflict: 'setting_key'
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "AI prompt saved successfully",
      });
    } catch (error) {
      console.error('Error saving prompt:', error);
      toast({
        title: "Error",
        description: "Failed to save AI prompt",
        variant: "destructive",
      });
    } finally {
      setSaving(null);
    }
  };

  const applyStylePreset = (configKey: string, presetKey: string) => {
    const preset = STYLE_PRESETS.find(p => p.key === presetKey);
    if (preset) {
      setPrompts(prev => ({
        ...prev,
        [configKey]: preset.prompt
      }));
      setSelectedPresets(prev => ({
        ...prev,
        [configKey]: presetKey
      }));
    }
  };

  const testPrompt = async (config: PromptConfig) => {
    setTesting(config.key);
    try {
      // Replace variables with sample data for testing
      let testPrompt = prompts[config.key] || config.defaultPrompt;
      
      // Sample replacements
      const replacements: Record<string, string> = {
        '{title}': 'Sample Motivator Title',
        '{content}': 'This is sample motivational content for testing.',
        '{concept}': 'mountain',
        '{food_name}': 'grilled chicken breast',
        '{goal_title}': 'Lose 10 pounds',
        '{goal_description}': 'Achieve a healthier weight through consistent exercise and nutrition',
        '{primary_color}': colorSettings.primary_color || '220 35% 45%',
        '{accent_color}': colorSettings.accent_color || '142 71% 45%'
      };

      config.variables.forEach(variable => {
        if (replacements[variable]) {
          testPrompt = testPrompt.replace(new RegExp(variable.replace(/[{}]/g, '\\$&'), 'g'), replacements[variable]);
        }
      });

      // Copy the processed prompt to clipboard for testing
      await navigator.clipboard.writeText(testPrompt);
      
      toast({
        title: "Test Prompt Copied",
        description: "The processed prompt has been copied to your clipboard. You can paste it into any AI image generator to test how it looks.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process test prompt",
        variant: "destructive",
      });
    } finally {
      setTesting(null);
    }
  };

  const resetToDefault = (key: string) => {
    const config = PROMPT_CONFIGS.find(c => c.key === key);
    if (config) {
      setPrompts(prev => ({
        ...prev,
        [key]: config.defaultPrompt
      }));
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent>Loading...</CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      

      {PROMPT_CONFIGS.map((config) => (
        <Card key={config.key}>
          <CardHeader>
            <div className="space-y-2">
                <CardTitle className="text-lg">{config.title}</CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
                  {config.description}
                </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {config.hasStylePresets && (
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  Style Preset
                </Label>
                <Select
                  value={selectedPresets[config.key] || 'minimalist_bw'}
                  onValueChange={(value) => applyStylePreset(config.key, value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a style preset" />
                  </SelectTrigger>
                  <SelectContent>
                    {STYLE_PRESETS.map((preset) => (
                      <SelectItem key={preset.key} value={preset.key}>
                        <div className="flex flex-col items-start">
                          <span className="font-medium">{preset.name}</span>
                          <span className="text-xs text-muted-foreground">{preset.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor={config.key} className="text-sm font-medium">
                Prompt Template
              </Label>
              <Textarea
                id={config.key}
                value={prompts[config.key] || ''}
                onChange={(e) => setPrompts(prev => ({
                  ...prev,
                  [config.key]: e.target.value
                }))}
                placeholder={config.defaultPrompt}
                className="min-h-[120px] font-mono text-sm"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium">Available Variables</Label>
              <div className="flex flex-wrap gap-1">
                {config.variables.map(variable => (
                  <Badge key={variable} variant="outline" className="font-mono text-xs rounded-sm">
                    {variable}
                  </Badge>
                ))}
              </div>
            </div>
            
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button 
                size="sm"
                onClick={() => savePrompt(config.key)}
                disabled={saving === config.key}
                className="w-full sm:w-auto"
              >
                {saving === config.key ? 'Saving...' : 'Save'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => testPrompt(config)}
                disabled={testing === config.key}
                className="w-full sm:w-auto flex items-center gap-1"
              >
                <TestTube className="w-4 h-4" />
                {testing === config.key ? 'Testing...' : 'Test'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => resetToDefault(config.key)}
                className="w-full sm:w-auto"
              >
                Reset to Default
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};