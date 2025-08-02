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
    description: 'Controls how AI generates images for motivational content, personal motivators, and goal templates.',
    defaultPrompt: 'Create a clean, modern cartoon-style illustration with soft colors, rounded edges, and a warm, encouraging aesthetic. Focus on themes of personal growth, motivation, weight loss, and healthy lifestyle. Use gentle pastel colors with light gray and green undertones that complement a ceramic-like design. The style should be simple, uplifting, and relatable to people on a wellness journey. Avoid dark themes, futuristic elements, or overly complex designs.\n\nSubject: {title}. {content}\n\nIncorporate these brand colors naturally: Primary: {primary_color}, Accent: {accent_color}',
    variables: ['{title}', '{content}', '{primary_color}', '{accent_color}']
  },
  {
    key: 'ai_image_food_prompt',
    title: 'Food Image Generation',
    description: 'Controls how AI generates images for food items in the food tracking system.',
    defaultPrompt: 'A lightly cartoony and semi-realistic illustration of {food_name}, food illustration style, clean background, appetizing, vibrant colors. Style should match this color theme: {primary_color} primary, {accent_color} accent. Clean, professional food photography style with soft lighting.',
    variables: ['{food_name}', '{primary_color}', '{accent_color}']
  },
  {
    key: 'ai_food_assistant_system_prompt',
    title: 'Food Assistant System Behavior',
    description: 'Controls how the AI Food Assistant behaves when helping users add food entries.',
    defaultPrompt: 'You are a helpful nutrition assistant helping users track their food intake. Your goal is to help users add complete food entries with all required information: name, portion size (in grams), calories, and carbs. Ask clarifying questions if information is missing. Provide reasonable estimates for calories and carbs based on food type and portion. Be conversational and helpful. When the user provides food information, always use the add_food_entry function to add it to their log.',
    variables: []
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
        '{food_name}': 'grilled chicken breast',
        '{goal_title}': 'Lose 10 pounds',
        '{goal_description}': 'Achieve a healthier weight through consistent exercise and nutrition',
        '{primary_color}': colorSettings.primary_color || '220 35% 45%',
        '{accent_color}': colorSettings.accent_color || '262 83% 58%'
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
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="w-5 h-5" />
            AI Prompt Configuration
          </CardTitle>
          <CardDescription>Loading AI prompts...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Wand2 className="w-6 h-6 text-primary" />
        <h2 className="text-2xl font-semibold text-foreground">AI Prompt Configuration</h2>
      </div>
      
      <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-2">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800 dark:text-blue-200">
            <p className="font-medium mb-1">How AI Prompt Variables Work:</p>
            <p>Variables like <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">{'{title}'}</code> get automatically replaced with actual content when generating images. Your brand colors are injected automatically to maintain consistent theming.</p>
          </div>
        </div>
      </div>

      {PROMPT_CONFIGS.map((config) => (
        <Card key={config.key}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">{config.title}</CardTitle>
                <CardDescription className="mt-1">{config.description}</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => testPrompt(config)}
                  disabled={testing === config.key}
                  className="flex items-center gap-1"
                >
                  <TestTube className="w-4 h-4" />
                  {testing === config.key ? 'Testing...' : 'Test'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => resetToDefault(config.key)}
                >
                  Reset to Default
                </Button>
              </div>
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
                  <Badge key={variable} variant="secondary" className="font-mono text-xs">
                    {variable}
                  </Badge>
                ))}
              </div>
            </div>
            
            <Button 
              onClick={() => savePrompt(config.key)}
              disabled={saving === config.key}
              className="w-full sm:w-auto"
            >
              {saving === config.key ? 'Saving...' : `Save ${config.title} Prompt`}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};