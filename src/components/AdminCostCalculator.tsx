import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calculator, TrendingUp, DollarSign } from "lucide-react";

interface CostData {
  model: string;
  inputCost: number; // per 1K tokens
  outputCost: number; // per 1K tokens
  category: 'flagship' | 'efficient' | 'reasoning' | 'legacy';
}

const MODEL_COSTS: CostData[] = [
  { model: 'gpt-5-2025-08-07', inputCost: 5.0, outputCost: 20.0, category: 'flagship' },
  { model: 'gpt-5-mini-2025-08-07', inputCost: 0.35, outputCost: 1.4, category: 'efficient' },
  { model: 'gpt-5-nano-2025-08-07', inputCost: 0.2, outputCost: 0.8, category: 'efficient' },
  { model: 'o3-2025-04-16', inputCost: 15.0, outputCost: 60.0, category: 'reasoning' },
  { model: 'o4-mini-2025-04-16', inputCost: 3.0, outputCost: 12.0, category: 'reasoning' },
  { model: 'gpt-4.1-2025-04-14', inputCost: 2.5, outputCost: 10.0, category: 'flagship' },
  { model: 'gpt-4o-mini', inputCost: 0.15, outputCost: 0.6, category: 'efficient' },
  { model: 'gpt-4o', inputCost: 2.5, outputCost: 10.0, category: 'legacy' }
];

const getCategoryColor = (category: CostData['category']) => {
  switch (category) {
    case 'flagship': return 'bg-primary/10 text-primary border-primary/20';
    case 'reasoning': return 'bg-purple-500/10 text-purple-700 border-purple-500/20';
    case 'efficient': return 'bg-green-500/10 text-green-700 border-green-500/20';
    case 'legacy': return 'bg-amber-500/10 text-amber-700 border-amber-500/20';
  }
};

export function AdminCostCalculator() {
  const [selectedModel, setSelectedModel] = useState<string>('gpt-4o-mini');
  const [requestsPerDay, setRequestsPerDay] = useState<string>('100');
  const [avgInputTokens, setAvgInputTokens] = useState<string>('500');
  const [avgOutputTokens, setAvgOutputTokens] = useState<string>('200');

  const [calculations, setCalculations] = useState({
    dailyCost: 0,
    monthlyCost: 0,
    yearlyCart: 0,
    requestCost: 0
  });

  useEffect(() => {
    const modelData = MODEL_COSTS.find(m => m.model === selectedModel);
    if (!modelData) return;

    const requests = parseInt(requestsPerDay) || 0;
    const inputTokens = parseInt(avgInputTokens) || 0;
    const outputTokens = parseInt(avgOutputTokens) || 0;

    // Calculate cost per request
    const inputCostPerRequest = (inputTokens / 1000) * (modelData.inputCost / 100); // Convert cents to dollars
    const outputCostPerRequest = (outputTokens / 1000) * (modelData.outputCost / 100);
    const totalCostPerRequest = inputCostPerRequest + outputCostPerRequest;

    // Calculate daily, monthly, yearly costs
    const dailyCost = requests * totalCostPerRequest;
    const monthlyCost = dailyCost * 30;
    const yearlyCost = dailyCost * 365;

    setCalculations({
      dailyCost,
      monthlyCost,
      yearlyCart: yearlyCost,
      requestCost: totalCostPerRequest
    });
  }, [selectedModel, requestsPerDay, avgInputTokens, avgOutputTokens]);

  const selectedModelData = MODEL_COSTS.find(m => m.model === selectedModel);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Calculator className="w-5 h-5" />
          Cost Calculator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Model Selection */}
        <div className="space-y-2">
          <Label>AI Model</Label>
          <Select value={selectedModel} onValueChange={setSelectedModel}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MODEL_COSTS.map((model) => (
                <SelectItem key={model.model} value={model.model}>
                  <div className="flex items-center gap-2">
                    <span>{model.model}</span>
                    <Badge variant="outline" className={getCategoryColor(model.category)}>
                      {model.category}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Usage Parameters */}
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="requests">Requests/Day</Label>
            <Input
              id="requests"
              type="number"
              value={requestsPerDay}
              onChange={(e) => setRequestsPerDay(e.target.value)}
              min="0"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="input-tokens">Avg Input Tokens</Label>
            <Input
              id="input-tokens"
              type="number"
              value={avgInputTokens}
              onChange={(e) => setAvgInputTokens(e.target.value)}
              min="0"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="output-tokens">Avg Output Tokens</Label>
            <Input
              id="output-tokens"
              type="number"
              value={avgOutputTokens}
              onChange={(e) => setAvgOutputTokens(e.target.value)}
              min="0"
            />
          </div>
        </div>

        {/* Model Details */}
        {selectedModelData && (
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="text-sm font-medium mb-2">Pricing Details</div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Input: </span>
                <span>${(selectedModelData.inputCost / 100).toFixed(4)}/1K tokens</span>
              </div>
              <div>
                <span className="text-muted-foreground">Output: </span>
                <span>${(selectedModelData.outputCost / 100).toFixed(4)}/1K tokens</span>
              </div>
            </div>
          </div>
        )}

        {/* Cost Breakdown */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Per Request</span>
            </div>
            <div className="text-xl font-bold text-primary">
              ${calculations.requestCost.toFixed(6)}
            </div>
          </div>

          <div className="p-4 bg-green-500/5 rounded-lg border border-green-500/20">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium">Daily Cost</span>
            </div>
            <div className="text-xl font-bold text-green-600">
              ${calculations.dailyCost.toFixed(2)}
            </div>
          </div>

          <div className="p-4 bg-blue-500/5 rounded-lg border border-blue-500/20">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium">Monthly Cost</span>
            </div>
            <div className="text-xl font-bold text-blue-600">
              ${calculations.monthlyCost.toFixed(2)}
            </div>
          </div>

          <div className="p-4 bg-purple-500/5 rounded-lg border border-purple-500/20">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium">Yearly Cost</span>
            </div>
            <div className="text-xl font-bold text-purple-600">
              ${calculations.yearlyCart.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Savings Comparison */}
        {selectedModel !== 'gpt-4o-mini' && (
          <div className="p-3 bg-amber-50/50 rounded-lg border border-amber-200/50">
            <div className="text-xs font-medium text-amber-700 mb-1">💡 Cost Comparison</div>
            <div className="text-xs text-amber-600">
              {(() => {
                const baselineModel = MODEL_COSTS.find(m => m.model === 'gpt-4o-mini')!;
                const baselineCost = (parseInt(avgInputTokens) / 1000 * baselineModel.inputCost + 
                                   parseInt(avgOutputTokens) / 1000 * baselineModel.outputCost) / 100;
                const currentCost = calculations.requestCost;
                const difference = ((currentCost - baselineCost) / baselineCost * 100);
                
                if (difference > 0) {
                  return `This model costs ${difference.toFixed(0)}% more than gpt-4o-mini (${(difference * calculations.monthlyCost / 100).toFixed(2)}$/month extra)`;
                } else {
                  return `This model saves ${Math.abs(difference).toFixed(0)}% vs gpt-4o-mini (${Math.abs(difference * calculations.monthlyCost / 100).toFixed(2)}$/month savings)`;
                }
              })()}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}