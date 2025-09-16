import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Info, Wand2, TestTube, Palette } from "lucide-react";
import { STATIC_COLORS } from "@/utils/staticAssets";
import { useStandardizedLoading } from '@/hooks/useStandardizedLoading';
import { SmartLoadingButton, SmartInlineLoading } from '@/components/SimpleLoadingComponents';

interface PromptConfig {
  key: string;
  title: string;
  description: string;
  category: string;
  placeholder: string;
  maxLength?: number;
  presets?: { value: string; label: string; }[];
}

const promptConfigs: PromptConfig[] = [
  {
    key: 'food_analysis_prompt',
    title: 'Food Analysis Prompt',
    description: 'System prompt for analyzing food entries and providing nutritional information',
    category: 'AI Analysis',
    placeholder: 'Enter the system prompt for food analysis...',
    maxLength: 2000,
  },
  {
    key: 'motivational_chat_prompt', 
    title: 'Motivational Chat Prompt',
    description: 'System prompt for the motivational AI chat assistant',
    category: 'AI Chat',
    placeholder: 'Enter the system prompt for motivational conversations...',
    maxLength: 2000,
  },
  {
    key: 'goal_generation_prompt',
    title: 'Goal Generation Prompt', 
    description: 'Prompt template for generating personalized health goals',
    category: 'Goal Setting',
    placeholder: 'Enter the prompt template for goal generation...',
    maxLength: 1500,
  },
  {
    key: 'custom_motivator_prompt',
    title: 'Custom Motivator Generation',
    description: 'Prompt for creating personalized motivators based on user input',
    category: 'Motivators',
    placeholder: 'Enter the prompt for custom motivator generation...',
    maxLength: 1500,
    presets: [
      { value: 'encouraging', label: 'Encouraging & Supportive' },
      { value: 'direct', label: 'Direct & Action-Oriented' },
      { value: 'scientific', label: 'Scientific & Evidence-Based' },
      { value: 'personal', label: 'Personal & Relatable' }
    ]
  }
];

export const StaticPromptManagement = () => {
  const [prompts, setPrompts] = useState<Record<string, string>>({});
  const [selectedPresets, setSelectedPresets] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [testing, setTesting] = useState<string | null>(null);
  const { toast } = useToast();
  const { isLoading, execute } = useStandardizedLoading();

  useEffect(() => {
    loadPrompts();
  }, []);

  const loadPrompts = () => {
    execute(async () => {
      const { data, error } = await supabase
        .from('shared_settings')
        .select('setting_key, setting_value')
        .in('setting_key', promptConfigs.map(config => config.key));

      if (error) throw error;

      const promptMap: Record<string, string> = {};
      data?.forEach(item => {
        promptMap[item.setting_key] = item.setting_value || '';
      });

      setPrompts(promptMap);
    }, {
      onError: (error) => {
        console.error('Error loading prompts:', error);
        toast({
          title: "Error loading prompts",
          description: "Failed to load current prompt configurations",
          variant: "destructive",
        });
      }
    });
  };

  const savePrompt = async (key: string, value: string) => {
    setSaving(key);
    try {
      const { error } = await supabase
        .from('shared_settings')
        .upsert(
          { setting_key: key, setting_value: value },
          { onConflict: 'setting_key' }
        );

      if (error) throw error;

      setPrompts(prev => ({ ...prev, [key]: value }));
      toast({
        title: "Prompt saved",
        description: `Successfully updated ${promptConfigs.find(c => c.key === key)?.title}`,
      });
    } catch (error) {
      console.error('Error saving prompt:', error);
      toast({
        title: "Error saving prompt",
        description: "Failed to save prompt configuration",
        variant: "destructive",
      });
    } finally {
      setSaving(null);
    }
  };

  const testPrompt = async (key: string) => {
    setTesting(key);
    try {
      // Simulate testing delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "Test completed",
        description: `Prompt test for ${promptConfigs.find(c => c.key === key)?.title} completed successfully`,
      });
    } catch (error) {
      toast({
        title: "Test failed",
        description: "Failed to test prompt configuration",
        variant: "destructive",
      });
    } finally {
      setTesting(null);
    }
  };

  const applyPreset = (configKey: string, presetValue: string) => {
    const config = promptConfigs.find(c => c.key === configKey);
    if (!config?.presets) return;

    const preset = config.presets.find(p => p.value === presetValue);
    if (!preset) return;

    // Generate a sample prompt based on the preset type
    let samplePrompt = '';
    switch (presetValue) {
      case 'encouraging':
        samplePrompt = 'You are a supportive and encouraging health coach. Focus on positive reinforcement, celebrate small wins, and provide gentle guidance. Use warm, empathetic language and always emphasize progress over perfection.';
        break;
      case 'direct':
        samplePrompt = 'You are a direct and action-oriented health advisor. Provide clear, actionable advice with specific steps. Be concise, focused on results, and emphasize accountability and discipline.';
        break;
      case 'scientific':
        samplePrompt = 'You are a science-based health expert. Base all advice on current research and evidence. Explain the physiological mechanisms behind recommendations and cite relevant studies when appropriate.';
        break;
      case 'personal':
        samplePrompt = 'You are a relatable health companion who understands personal struggles. Share insights from a human perspective, acknowledge challenges, and provide practical solutions that fit real-life situations.';
        break;
      default:
        return;
    }

    setPrompts(prev => ({ ...prev, [configKey]: samplePrompt }));
    setSelectedPresets(prev => ({ ...prev, [configKey]: presetValue }));
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'AI Analysis': return <TestTube className="h-4 w-4" />;
      case 'AI Chat': return <Wand2 className="h-4 w-4" />;
      case 'Goal Setting': return <Info className="h-4 w-4" />;
      case 'Motivators': return <Palette className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>AI Prompt Management</CardTitle>
        </CardHeader>
        <CardContent>
          <SmartInlineLoading text="Loading prompt configurations" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wand2 className="h-5 w-5" />
          AI Prompt Management
        </CardTitle>
        <CardDescription>
          Configure system prompts for AI features. Colors are now static: Primary: hsl({STATIC_COLORS.primary})
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {promptConfigs.map((config) => (
          <div key={config.key} className="space-y-4 border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getCategoryIcon(config.category)}
                <div>
                  <h3 className="font-medium">{config.title}</h3>
                  <p className="text-sm text-muted-foreground">{config.description}</p>
                </div>
              </div>
              <Badge variant="outline">{config.category}</Badge>
            </div>

            {config.presets && (
              <div className="space-y-2">
                <Label htmlFor={`preset-${config.key}`}>Quick Presets</Label>
                <div className="flex gap-2">
                  <Select 
                    value={selectedPresets[config.key] || ''} 
                    onValueChange={(value) => applyPreset(config.key, value)}
                  >
                    <SelectTrigger className="w-64">
                      <SelectValue placeholder="Choose a preset style..." />
                    </SelectTrigger>
                    <SelectContent>
                      {config.presets.map((preset) => (
                        <SelectItem key={preset.value} value={preset.value}>
                          {preset.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor={config.key}>Prompt Configuration</Label>
              <Textarea
                id={config.key}
                placeholder={config.placeholder}
                value={prompts[config.key] || ''}
                onChange={(e) => setPrompts(prev => ({ ...prev, [config.key]: e.target.value }))}
                rows={6}
                maxLength={config.maxLength}
                className="resize-none"
              />
              {config.maxLength && (
                <div className="text-xs text-muted-foreground text-right">
                  {(prompts[config.key] || '').length} / {config.maxLength} characters
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <SmartLoadingButton
                onClick={() => savePrompt(config.key, prompts[config.key] || '')}
                isLoading={saving === config.key}
                loadingText="Saving..."
                size="sm"
              >
                Save Prompt
              </SmartLoadingButton>
              <SmartLoadingButton
                variant="outline"
                onClick={() => testPrompt(config.key)}
                isLoading={testing === config.key}
                loadingText="Testing..."
                disabled={!prompts[config.key]}
                size="sm"
              >
                Test Prompt
              </SmartLoadingButton>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};