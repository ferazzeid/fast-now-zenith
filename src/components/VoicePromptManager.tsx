import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { HelpCircle, Save, Mic } from "lucide-react";

interface PromptSection {
  id: string;
  section: string;
  content: string;
  label: string;
  tooltip: string;
}

export const VoicePromptManager = () => {
  const [prompts, setPrompts] = useState<PromptSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const { toast } = useToast();

  const promptSections = [
    {
      section: 'base_prompt',
      label: 'Base Prompt',
      tooltip: 'Core instructions that lead the system message with fundamental food analysis rules'
    },
    {
      section: 'composite_rules',
      label: 'Composite Food Rules',
      tooltip: 'How to handle compound dishes like omelettes, sandwiches, etc.'
    },
    {
      section: 'portion_estimation', 
      label: 'Portion Estimation',
      tooltip: 'Guidelines for converting descriptions like "handful" to grams'
    },
    {
      section: 'nutrition_calculation',
      label: 'Nutrition Calculation', 
      tooltip: 'Rules for calculating nutrition values and cooking effects'
    },
    {
      section: 'deduplication_logic',
      label: 'Deduplication Logic',
      tooltip: 'When to combine ingredients vs create separate entries'
    },
    {
      section: 'contextual_understanding',
      label: 'Contextual Understanding',
      tooltip: 'How to interpret words like "from", "and", "with" in food descriptions'
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
        .eq('function_name', 'analyze-food-voice')
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
        description: "Failed to load voice prompts",
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
          function_name: 'analyze-food-voice',
          prompt_section: section,
          prompt_content: content
        }, {
          onConflict: 'function_name,prompt_section'
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Voice prompt saved successfully",
      });
    } catch (error) {
      console.error('Error saving prompt:', error);
      toast({
        title: "Error", 
        description: "Failed to save voice prompt",
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
            <Mic className="w-5 h-5" />
            Voice Input Prompts
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
          <Mic className="w-5 h-5" />
          Voice Input Prompts
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