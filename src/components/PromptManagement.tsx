import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Info, Wand2, TestTube } from "lucide-react";
import { useColorTheme } from "@/hooks/useColorTheme";

interface PromptConfig {
  key: string;
  title: string;
  description: string;
  defaultPrompt: string;
  variables: string[];
}

const PROMPT_CONFIGS: PromptConfig[] = [
  {
    key: 'ai_image_motivator_prompt',
    title: 'Motivator Image Generation',
    description: 'Concept-driven, monochrome brand prompt using {concept} and {primary_color}.',
    defaultPrompt: 'Create a minimalist illustration in the style of a black and white photograph, using only black, white, and {primary_color}. The subject of the image should be: {concept}. No accent color, no other colors, no background details, no people or faces, no text. Style: simple, modern, and inspiring.',
    variables: ['{concept}', '{primary_color}']
  },
  {
    key: 'ai_image_food_prompt',
    title: 'Food Image Generation',
    description: 'Product packshot on white — single item, close-up, no props or background.',
    defaultPrompt: 'Professional product photograph of {food_name} only, isolated on pure white seamless background. Shot from 45-degree angle, tight close-up composition, subject fills 85% of frame. Studio lighting setup with soft diffused key light, minimal shadow directly beneath. Commercial packshot quality, sharp focus, natural colors. Zero props: no plates, no bowls, no cutting boards, no utensils, no hands, no garnishes, no herbs, no spices, no crumbs, no napkins, no decorative elements whatsoever. Single food item only, nothing else visible. E-commerce product photography style.',
    variables: ['{food_name}', '{primary_color}', '{accent_color}']
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
  {
    key: 'ai_high_carb_food_guidance',
    title: 'High-Carb Food Response Template',
    description: 'How to respond when users log high-carbohydrate foods.',
    defaultPrompt: 'I\'ve logged your {food_name}! Since this contains about {carbs}g of carbs, you might want to consider pairing it with some protein or healthy fats to help balance your blood sugar. Some great lower-carb alternatives for next time could be {alternatives}. This would take approximately {walking_time} of walking to burn off.',
    variables: ['{food_name}', '{carbs}', '{alternatives}', '{walking_time}']
  }
];

export const PromptManagement: React.FC = () => {
  const [prompts, setPrompts] = useState<Record<string, string>>({});
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
      const { data, error } = await supabase
        .from('shared_settings')
        .select('setting_key, setting_value')
        .in('setting_key', promptKeys);

      if (error) {
        console.error('Error loading prompts:', error);
        return;
      }

      const loadedPrompts: Record<string, string> = {};
      PROMPT_CONFIGS.forEach(config => {
        const setting = data?.find(s => s.setting_key === config.key);
        loadedPrompts[config.key] = setting?.setting_value || config.defaultPrompt;
      });

      setPrompts(loadedPrompts);
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
      const { error } = await supabase
        .from('shared_settings')
        .upsert({
          setting_key: key,
          setting_value: prompts[key],
        }, {
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
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
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