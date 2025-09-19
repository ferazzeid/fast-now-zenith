import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Zap, DollarSign, AlertTriangle, Clock, Gauge } from "lucide-react";

interface ModelComparisonData {
  model: string;
  category: 'flagship' | 'efficient' | 'reasoning' | 'legacy';
  speed: 'fast' | 'medium' | 'slow';
  cost: 'low' | 'medium' | 'high';
  accuracy: 'good' | 'excellent' | 'superior';
  capabilities: string[];
  bestFor: string[];
  pricing: {
    input: number; // per 1K tokens in cents
    output: number; // per 1K tokens in cents
  };
}

const MODELS: ModelComparisonData[] = [
  {
    model: 'gpt-5-2025-08-07',
    category: 'flagship',
    speed: 'medium',
    cost: 'high',
    accuracy: 'superior',
    capabilities: ['Advanced Reasoning', 'Complex Analysis', 'Vision', 'Multimodal'],
    bestFor: ['Complex problem solving', 'Research tasks', 'Advanced analysis'],
    pricing: { input: 5.0, output: 20.0 }
  },
  {
    model: 'gpt-5-mini-2025-08-07',
    category: 'efficient',
    speed: 'fast',
    cost: 'medium',
    accuracy: 'excellent',
    capabilities: ['Fast Processing', 'Vision', 'Cost Effective'],
    bestFor: ['General tasks', 'Food analysis', 'User interactions'],
    pricing: { input: 0.35, output: 1.4 }
  },
  {
    model: 'gpt-5-nano-2025-08-07',
    category: 'efficient',
    speed: 'fast',
    cost: 'low',
    accuracy: 'good',
    capabilities: ['Ultra Fast', 'Classification', 'Summarization'],
    bestFor: ['Simple tasks', 'Classification', 'High-volume processing'],
    pricing: { input: 0.2, output: 0.8 }
  },
  {
    model: 'o3-2025-04-16',
    category: 'reasoning',
    speed: 'slow',
    cost: 'high',
    accuracy: 'superior',
    capabilities: ['Deep Reasoning', 'Multi-step Analysis', 'Code Analysis'],
    bestFor: ['Complex reasoning', 'Research problems', 'Technical analysis'],
    pricing: { input: 15.0, output: 60.0 }
  },
  {
    model: 'gpt-4o-mini',
    category: 'efficient',
    speed: 'fast',
    cost: 'low',
    accuracy: 'good',
    capabilities: ['Vision', 'Temperature Control', 'Legacy Support'],
    bestFor: ['Cost optimization', 'Simple food analysis', 'Basic tasks'],
    pricing: { input: 0.15, output: 0.6 }
  }
];

const getCategoryIcon = (category: ModelComparisonData['category']) => {
  switch (category) {
    case 'flagship': return <Brain className="w-4 h-4" />;
    case 'reasoning': return <Zap className="w-4 h-4" />;
    case 'efficient': return <DollarSign className="w-4 h-4" />;
    case 'legacy': return <AlertTriangle className="w-4 h-4" />;
  }
};

const getCategoryColor = (category: ModelComparisonData['category']) => {
  switch (category) {
    case 'flagship': return 'bg-primary/10 text-primary border-primary/20';
    case 'reasoning': return 'bg-purple-500/10 text-purple-700 border-purple-500/20';
    case 'efficient': return 'bg-green-500/10 text-green-700 border-green-500/20';
    case 'legacy': return 'bg-amber-500/10 text-amber-700 border-amber-500/20';
  }
};

const getSpeedColor = (speed: ModelComparisonData['speed']) => {
  switch (speed) {
    case 'fast': return 'text-green-600';
    case 'medium': return 'text-amber-600';
    case 'slow': return 'text-red-600';
  }
};

const getCostColor = (cost: ModelComparisonData['cost']) => {
  switch (cost) {
    case 'low': return 'text-green-600';
    case 'medium': return 'text-amber-600';
    case 'high': return 'text-red-600';
  }
};

const getAccuracyColor = (accuracy: ModelComparisonData['accuracy']) => {
  switch (accuracy) {
    case 'good': return 'text-amber-600';
    case 'excellent': return 'text-blue-600';
    case 'superior': return 'text-purple-600';
  }
};

export function AdminModelComparison() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Model Comparison</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4">
          {MODELS.map((model) => (
            <div key={model.model} className="p-4 border rounded-lg space-y-4">
              {/* Model Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold">{model.model}</h3>
                  <Badge variant="outline" className={getCategoryColor(model.category)}>
                    {getCategoryIcon(model.category)}
                    {model.category}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  ${(model.pricing.input / 100).toFixed(3)}/${(model.pricing.output / 100).toFixed(3)} per 1K tokens
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="grid grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">Speed:</span>
                  <span className={`text-sm font-medium ${getSpeedColor(model.speed)}`}>
                    {model.speed}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">Cost:</span>
                  <span className={`text-sm font-medium ${getCostColor(model.cost)}`}>
                    {model.cost}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">Accuracy:</span>
                  <span className={`text-sm font-medium ${getAccuracyColor(model.accuracy)}`}>
                    {model.accuracy}
                  </span>
                </div>
              </div>

              {/* Capabilities */}
              <div className="space-y-2">
                <div className="text-sm font-medium">Capabilities:</div>
                <div className="flex flex-wrap gap-1">
                  {model.capabilities.map((cap) => (
                    <Badge key={cap} variant="secondary" className="text-xs">
                      {cap}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Best For */}
              <div className="space-y-2">
                <div className="text-sm font-medium">Best for:</div>
                <div className="text-sm text-muted-foreground">
                  {model.bestFor.join(' • ')}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Recommendation */}
        <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-200/50">
          <div className="text-sm font-medium text-blue-700 mb-2">💡 Recommendations</div>
          <div className="text-xs text-blue-600 space-y-1">
            <div><strong>For most users:</strong> gpt-5-mini offers the best balance of performance and cost</div>
            <div><strong>For cost optimization:</strong> gpt-4o-mini or gpt-5-nano for high-volume basic tasks</div>
            <div><strong>For complex analysis:</strong> gpt-5 or o3 for research and advanced reasoning tasks</div>
            <div><strong>For production apps:</strong> Start with gpt-5-mini and upgrade based on specific needs</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}