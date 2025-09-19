import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useStandardizedLoading } from "@/hooks/useStandardizedLoading";
import { supabase } from "@/integrations/supabase/client";
import { Brain, Zap, DollarSign, AlertTriangle } from "lucide-react";

interface ModelUsage {
  feature: string;
  model: string;
  type: "flagship" | "efficient" | "reasoning" | "legacy" | "audio";
  description: string;
}

const getTierIcon = (type: ModelUsage['type']) => {
  switch (type) {
    case 'flagship': return <Brain className="w-4 h-4" />;
    case 'reasoning': return <Zap className="w-4 h-4" />;
    case 'efficient': return <DollarSign className="w-4 h-4" />;
    case 'legacy': return <AlertTriangle className="w-4 h-4" />;
    case 'audio': return <DollarSign className="w-4 h-4" />;
  }
};

const getTierColor = (type: ModelUsage['type']) => {
  switch (type) {
    case 'flagship': return 'bg-primary/10 text-primary border-primary/20';
    case 'reasoning': return 'bg-purple-500/10 text-purple-700 border-purple-500/20';
    case 'efficient': return 'bg-green-500/10 text-green-700 border-green-500/20';
    case 'legacy': return 'bg-amber-500/10 text-amber-700 border-amber-500/20';
    case 'audio': return 'bg-blue-500/10 text-blue-700 border-blue-500/20';
  }
};

const getModelType = (modelName: string): ModelUsage['type'] => {
  if (modelName.includes('gpt-5') && !modelName.includes('mini') && !modelName.includes('nano')) return 'flagship';
  if (modelName.includes('o3') || modelName.includes('o4')) return 'reasoning';
  if (modelName.includes('mini') || modelName.includes('nano')) return 'efficient';
  if (modelName.includes('tts') || modelName.includes('whisper')) return 'audio';
  return 'legacy';
};

const getModelDescription = (modelName: string): string => {
  const descriptions: Record<string, string> = {
    'gpt-5-2025-08-07': 'Latest flagship model with superior reasoning',
    'gpt-5-mini-2025-08-07': 'Fast and efficient GPT-5 variant',
    'gpt-5-nano-2025-08-07': 'Most cost-effective GPT-5 model',
    'o3-2025-04-16': 'Advanced reasoning for complex problems',
    'o4-mini-2025-04-16': 'Fast reasoning optimized for coding',
    'gpt-4.1-2025-04-14': 'Reliable GPT-4 performance',
    'gpt-4o-mini': 'Cost-effective with vision support',
    'gpt-4o': 'Powerful legacy model with vision',
    'tts-1': 'Text-to-speech synthesis',
    'whisper-1': 'Speech transcription'
  };
  return descriptions[modelName] || 'AI model for various tasks';
};

export function AdminCurrentModels() {
  const [currentModel, setCurrentModel] = useState<string>('gpt-4o-mini');
  const { execute } = useStandardizedLoading();

  useEffect(() => {
    execute(async () => {
      const { data } = await supabase
        .from('shared_settings')
        .select('setting_value')
        .eq('setting_key', 'ai_model_name')
        .maybeSingle();
      
      if (data?.setting_value) {
        setCurrentModel(data.setting_value);
      }
      return data;
    });
  }, [execute]);

  const currentModelInfo: ModelUsage[] = [
    {
      feature: "Voice Food Analysis",
      model: currentModel,
      type: getModelType(currentModel),
      description: getModelDescription(currentModel)
    },
    {
      feature: "Image Food Analysis", 
      model: currentModel,
      type: getModelType(currentModel),
      description: getModelDescription(currentModel)
    },
    {
      feature: "Text-to-Speech",
      model: "tts-1",
      type: "audio",
      description: "Text-to-speech synthesis"
    },
    {
      feature: "Speech Transcription",
      model: "whisper-1", 
      type: "audio",
      description: "Speech transcription"
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Current AI Models in Use</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3">
          {currentModelInfo.map((usage, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="space-y-1">
                <div className="font-medium text-sm">{usage.feature}</div>
                <div className="text-xs text-muted-foreground">{usage.description}</div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={getTierColor(usage.type)}>
                  {getTierIcon(usage.type)}
                  {usage.model}
                </Badge>
              </div>
            </div>
          ))}
        </div>
        
        <div className="text-xs text-muted-foreground p-3 bg-blue-50/50 rounded-lg border border-blue-200/50">
          💡 Text analysis features use the model selected above. Audio models (TTS/Whisper) are fixed for optimal performance.
        </div>
      </CardContent>
    </Card>
  );
}