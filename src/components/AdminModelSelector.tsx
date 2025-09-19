import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useStandardizedLoading } from "@/hooks/useStandardizedLoading";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, Zap, DollarSign, Brain } from "lucide-react";

interface ModelInfo {
  id: string;
  name: string;
  description: string;
  tier: 'flagship' | 'efficient' | 'reasoning' | 'legacy';
  costLevel: 'low' | 'medium' | 'high';
  capabilities: string[];
  parameters: {
    supportsTemperature: boolean;
    tokenParam: 'max_tokens' | 'max_completion_tokens';
    maxTokens: number;
  };
}

const AVAILABLE_MODELS: ModelInfo[] = [
  {
    id: 'gpt-5-2025-08-07',
    name: 'GPT-5',
    description: 'Flagship model with superior reasoning and performance',
    tier: 'flagship',
    costLevel: 'high',
    capabilities: ['Text', 'Vision', 'Advanced Reasoning'],
    parameters: {
      supportsTemperature: false,
      tokenParam: 'max_completion_tokens',
      maxTokens: 16384
    }
  },
  {
    id: 'gpt-5-mini-2025-08-07',
    name: 'GPT-5 Mini',
    description: 'Faster, cost-efficient version of GPT-5',
    tier: 'efficient',
    costLevel: 'medium',
    capabilities: ['Text', 'Vision', 'Fast Processing'],
    parameters: {
      supportsTemperature: false,
      tokenParam: 'max_completion_tokens',
      maxTokens: 16384
    }
  },
  {
    id: 'gpt-5-nano-2025-08-07',
    name: 'GPT-5 Nano',
    description: 'Fastest, most cost-effective GPT-5 variant',
    tier: 'efficient',
    costLevel: 'low',
    capabilities: ['Text', 'Summarization', 'Classification'],
    parameters: {
      supportsTemperature: false,
      tokenParam: 'max_completion_tokens',
      maxTokens: 8192
    }
  },
  {
    id: 'o3-2025-04-16',
    name: 'O3',
    description: 'Advanced reasoning model for complex problems',
    tier: 'reasoning',
    costLevel: 'high',
    capabilities: ['Advanced Reasoning', 'Code Analysis', 'Vision'],
    parameters: {
      supportsTemperature: false,
      tokenParam: 'max_completion_tokens',
      maxTokens: 16384
    }
  },
  {
    id: 'o4-mini-2025-04-16',
    name: 'O4 Mini',
    description: 'Fast reasoning model optimized for coding',
    tier: 'reasoning',
    costLevel: 'medium',
    capabilities: ['Fast Reasoning', 'Coding', 'Vision'],
    parameters: {
      supportsTemperature: false,
      tokenParam: 'max_completion_tokens',
      maxTokens: 8192
    }
  },
  {
    id: 'gpt-4.1-2025-04-14',
    name: 'GPT-4.1',
    description: 'Flagship GPT-4 model with reliable performance',
    tier: 'flagship',
    costLevel: 'high',
    capabilities: ['Text', 'Vision', 'Reliable Results'],
    parameters: {
      supportsTemperature: false,
      tokenParam: 'max_completion_tokens',
      maxTokens: 16384
    }
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    description: 'Fast and cost-effective with vision support',
    tier: 'efficient',
    costLevel: 'low',
    capabilities: ['Text', 'Vision', 'Cost Effective'],
    parameters: {
      supportsTemperature: true,
      tokenParam: 'max_tokens',
      maxTokens: 16384
    }
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    description: 'Powerful model with vision capabilities',
    tier: 'legacy',
    costLevel: 'high',
    capabilities: ['Text', 'Vision', 'High Performance'],
    parameters: {
      supportsTemperature: true,
      tokenParam: 'max_tokens',
      maxTokens: 4096
    }
  }
];

const getTierIcon = (tier: ModelInfo['tier']) => {
  switch (tier) {
    case 'flagship': return <Brain className="w-4 h-4" />;
    case 'reasoning': return <Zap className="w-4 h-4" />;
    case 'efficient': return <DollarSign className="w-4 h-4" />;
    case 'legacy': return <AlertTriangle className="w-4 h-4" />;
  }
};

const getTierColor = (tier: ModelInfo['tier']) => {
  switch (tier) {
    case 'flagship': return 'bg-primary/10 text-primary border-primary/20';
    case 'reasoning': return 'bg-purple-500/10 text-purple-700 border-purple-500/20';
    case 'efficient': return 'bg-green-500/10 text-green-700 border-green-500/20';
    case 'legacy': return 'bg-amber-500/10 text-amber-700 border-amber-500/20';
  }
};

const getCostColor = (costLevel: ModelInfo['costLevel']) => {
  switch (costLevel) {
    case 'low': return 'bg-green-500/10 text-green-700 border-green-500/20';
    case 'medium': return 'bg-amber-500/10 text-amber-700 border-amber-500/20';
    case 'high': return 'bg-red-500/10 text-red-700 border-red-500/20';
  }
};

export function AdminModelSelector() {
  const [selectedModel, setSelectedModel] = useState<string>('gpt-4o-mini');
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const { toast } = useToast();
  const { isLoading, execute } = useStandardizedLoading();

  useEffect(() => {
    execute(async () => {
      const { data, error } = await supabase
        .from('shared_settings')
        .select('setting_value, updated_at')
        .eq('setting_key', 'ai_model_name')
        .maybeSingle();
      
      if (!error && data) {
        if (data.setting_value) setSelectedModel(data.setting_value);
        if (data.updated_at) {
          setLastUpdated(new Date(data.updated_at).toLocaleString());
        }
      }
      return data;
    });
  }, [execute]);

  const save = async () => {
    await execute(async () => {
      const { error } = await supabase
        .from('shared_settings')
        .upsert({ setting_key: 'ai_model_name', setting_value: selectedModel });
      if (error) throw error;
      
      setLastUpdated(new Date().toLocaleString());
      return true;
    }, {
      onSuccess: () => {
        toast({ title: 'Saved', description: 'AI model updated successfully.' });
      },
      onError: (error) => {
        toast({ title: 'Error', description: error.message || 'Failed to save model', variant: 'destructive' });
      }
    });
  };

  const selectedModelInfo = AVAILABLE_MODELS.find(model => model.id === selectedModel);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">AI Model Selection</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="model-select" className="text-sm">Active AI Model</Label>
          <Select value={selectedModel} onValueChange={setSelectedModel} disabled={isLoading}>
            <SelectTrigger id="model-select">
              <SelectValue placeholder="Select a model" />
            </SelectTrigger>
            <SelectContent>
              {AVAILABLE_MODELS.map((model) => (
                <SelectItem key={model.id} value={model.id}>
                  <div className="flex items-center gap-2">
                    {getTierIcon(model.tier)}
                    <span className="font-medium">{model.name}</span>
                    <Badge variant="outline" className={getCostColor(model.costLevel)}>
                      {model.costLevel} cost
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedModelInfo && (
          <div className="p-4 bg-muted/50 rounded-lg space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={getTierColor(selectedModelInfo.tier)}>
                {getTierIcon(selectedModelInfo.tier)}
                {selectedModelInfo.tier}
              </Badge>
              <Badge variant="outline" className={getCostColor(selectedModelInfo.costLevel)}>
                {selectedModelInfo.costLevel} cost
              </Badge>
            </div>
            
            <p className="text-sm text-muted-foreground">{selectedModelInfo.description}</p>
            
            <div className="space-y-2">
              <div className="text-xs font-medium">Capabilities:</div>
              <div className="flex flex-wrap gap-1">
                {selectedModelInfo.capabilities.map((cap) => (
                  <Badge key={cap} variant="secondary" className="text-xs">
                    {cap}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="text-xs space-y-1 text-muted-foreground">
              <div>Max tokens: {selectedModelInfo.parameters.maxTokens.toLocaleString()}</div>
              <div>Temperature support: {selectedModelInfo.parameters.supportsTemperature ? '✅' : '❌'}</div>
              <div>Token parameter: {selectedModelInfo.parameters.tokenParam}</div>
            </div>
          </div>
        )}

        <Button onClick={save} className="w-full sm:w-auto" disabled={isLoading}>
          {isLoading ? "Saving..." : "Update Model"}
        </Button>
        
        {lastUpdated && (
          <div className="text-xs text-muted-foreground">
            Last updated: {lastUpdated}
          </div>
        )}
      </CardContent>
    </Card>
  );
}