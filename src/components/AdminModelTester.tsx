import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useStandardizedLoading } from "@/hooks/useStandardizedLoading";
import { supabase } from "@/integrations/supabase/client";
import { Play, Clock, DollarSign, CheckCircle, XCircle } from "lucide-react";

interface TestResult {
  success: boolean;
  responseTime: number;
  model: string;
  tokens?: number;
  estimatedCost?: number;
  response?: string;
  error?: string;
}

export function AdminModelTester() {
  const [testPrompt, setTestPrompt] = useState("Analyze this food: apple, banana, 2 eggs");
  const [lastResult, setLastResult] = useState<TestResult | null>(null);
  const { toast } = useToast();
  const { isLoading, execute } = useStandardizedLoading();

  const runTest = async () => {
    await execute(async () => {
      const startTime = Date.now();
      
      try {
        // Test the voice analysis function with current model
        const { data, error } = await supabase.functions.invoke('analyze-food-voice', {
          body: { message: testPrompt }
        });
        
        const responseTime = Date.now() - startTime;
        
        if (error) {
          throw new Error(error.message || 'Test failed');
        }
        
        // Extract model info from response or assume current model
        const { data: modelData } = await supabase
          .from('shared_settings')
          .select('setting_value')
          .eq('setting_key', 'ai_model_name')
          .maybeSingle();
        
        const currentModel = modelData?.setting_value || 'gpt-4o-mini';
        
        // Estimate cost based on model (rough estimation)
        const costPerRequest = getCostEstimate(currentModel);
        
        const result: TestResult = {
          success: true,
          responseTime,
          model: currentModel,
          estimatedCost: costPerRequest,
          response: data?.completion || 'Test completed successfully'
        };
        
        setLastResult(result);
        return result;
        
      } catch (error) {
        const responseTime = Date.now() - startTime;
        const result: TestResult = {
          success: false,
          responseTime,
          model: 'unknown',
          error: (error as Error).message
        };
        
        setLastResult(result);
        throw error;
      }
    }, {
      onSuccess: () => {
        toast({ title: 'Test Complete', description: 'Model test completed successfully.' });
      },
      onError: (error) => {
        toast({ 
          title: 'Test Failed', 
          description: error.message || 'Model test failed', 
          variant: 'destructive' 
        });
      }
    });
  };

  const getCostEstimate = (model: string): number => {
    // Rough cost estimates per request (in cents)
    const costs: Record<string, number> = {
      'gpt-5-2025-08-07': 5.0,
      'gpt-5-mini-2025-08-07': 1.5,
      'gpt-5-nano-2025-08-07': 0.8,
      'o3-2025-04-16': 8.0,
      'o4-mini-2025-04-16': 2.0,
      'gpt-4.1-2025-04-14': 3.0,
      'gpt-4o-mini': 0.3,
      'gpt-4o': 1.2
    };
    return costs[model] || 1.0;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Model Testing</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-2">
          <Textarea
            id="test-prompt"
            value={testPrompt}
            onChange={(e) => setTestPrompt(e.target.value)}
            placeholder="Enter a test prompt to validate the current model..."
            rows={2}
            disabled={isLoading}
          />
        </div>

        <Button 
          onClick={runTest} 
          disabled={isLoading || !testPrompt.trim()}
          className="w-full"
        >
          <Play className="w-4 h-4 mr-2" />
          {isLoading ? "Testing..." : "Test Current Model"}
        </Button>

        {lastResult && (
          <div className="p-3 bg-muted/50 rounded-lg space-y-2">
            <div className="flex items-center gap-2">
              {lastResult.success ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <XCircle className="w-4 h-4 text-red-600" />
              )}
              <span className="font-medium text-sm">
                {lastResult.success ? 'Test Successful' : 'Test Failed'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Model</div>
                <Badge variant="outline" className="text-xs">{lastResult.model}</Badge>
              </div>
              
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Response Time</div>
                <div className="flex items-center gap-1 text-xs">
                  <Clock className="w-3 h-3" />
                  {lastResult.responseTime}ms
                </div>
              </div>

              {lastResult.estimatedCost && (
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Est. Cost</div>
                  <div className="flex items-center gap-1 text-xs">
                    <DollarSign className="w-3 h-3" />
                    {lastResult.estimatedCost.toFixed(2)}¢
                  </div>
                </div>
              )}
            </div>

            {lastResult.response && (
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Response</div>
                <div className="text-xs p-2 bg-background rounded border">
                  {lastResult.response.substring(0, 150)}
                  {lastResult.response.length > 150 && '...'}
                </div>
              </div>
            )}

            {lastResult.error && (
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Error</div>
                <div className="text-xs p-2 bg-red-50 text-red-700 rounded border border-red-200">
                  {lastResult.error}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}