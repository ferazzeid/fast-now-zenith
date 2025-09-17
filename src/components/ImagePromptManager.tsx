import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { HelpCircle, Save, Camera } from "lucide-react";

interface PromptSection {
  id: string;
  section: string;
  content: string;
  label: string;
  tooltip: string;
}

export const ImagePromptManager = () => {
  const [prompts, setPrompts] = useState<PromptSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const { toast } = useToast();

  const promptSections = [
    {
      section: 'food_identification',
      label: 'Food Identification',
      tooltip: 'Instructions for identifying foods from images and reading labels'
    },
    {
      section: 'nutrition_reading',
      label: 'Nutrition Label Reading',
      tooltip: 'How to read and interpret nutrition labels, especially for dairy variants'
    },
    {
      section: 'fallback_estimation',
      label: 'Fallback Estimation',
      tooltip: 'What to do when no label is visible, barcode handling'
    },
    {
      section: 'output_format',
      label: 'Output Format',
      tooltip: 'Required JSON structure and formatting rules'
    }
  ];

  useEffect(() => {
    loadPrompts();
  }, []);

  const loadPrompts = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_function_prompts')
        .select('*')
        .eq('function_name', 'analyze-food-image')
        .order('prompt_section');

      if (error) throw error;

      const promptsData = promptSections.map(section => {
        const existing = data?.find(p => p.prompt_section === section.section);
        return {
          id: existing?.id || '',
          section: section.section,
          content: existing?.prompt_content || '',
          label: section.label,
          tooltip: section.tooltip
        };
      });

      setPrompts(promptsData);
    } catch (error) {
      console.error('Error loading prompts:', error);
      toast({
        title: "Error",
        description: "Failed to load image prompts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const savePrompt = async (section: string, content: string) => {
    setSaving(section);
    try {
      const { error } = await supabase
        .from('ai_function_prompts')
        .upsert({
          function_name: 'analyze-food-image',
          prompt_section: section,
          prompt_content: content
        }, {
          onConflict: 'function_name,prompt_section'
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Image prompt saved successfully",
      });
    } catch (error) {
      console.error('Error saving prompt:', error);
      toast({
        title: "Error",
        description: "Failed to save image prompt",
        variant: "destructive",
      });
    } finally {
      setSaving(null);
    }
  };

  const updatePromptContent = (section: string, content: string) => {
    setPrompts(prev => prev.map(p => 
      p.section === section ? { ...p, content } : p
    ));
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Image Analysis Prompts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground">Loading prompts...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="w-5 h-5" />
          Image Analysis Prompts
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <TooltipProvider>
          {prompts.map((prompt) => (
            <div key={prompt.section} className="space-y-3">
              <div className="flex items-center gap-2">
                <Label htmlFor={prompt.section} className="text-sm font-medium">
                  {prompt.label}
                </Label>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="w-4 h-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">{prompt.tooltip}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Textarea
                id={prompt.section}
                value={prompt.content}
                onChange={(e) => updatePromptContent(prompt.section, e.target.value)}
                placeholder={`Enter ${prompt.label.toLowerCase()}...`}
                className="min-h-[120px] font-mono text-sm"
              />
              <Button
                size="sm"
                onClick={() => savePrompt(prompt.section, prompt.content)}
                disabled={saving === prompt.section}
                className="ml-auto"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving === prompt.section ? 'Saving...' : 'Save'}
              </Button>
            </div>
          ))}
        </TooltipProvider>
      </CardContent>
    </Card>
  );
};