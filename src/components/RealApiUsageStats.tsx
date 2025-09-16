import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, DollarSign, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useStandardizedLoading } from '@/hooks/useStandardizedLoading';
import { ComponentSpinner } from '@/components/LoadingStates';

interface ApiUsageData {
  date: string;
  total_requests: number;
  successful_requests: number;
  failed_requests: number;
  cost_estimate: number;
  model_breakdown: Record<string, number>;
}

interface RealApiUsageStatsProps {
  className?: string;
}

export const RealApiUsageStats = ({ className }: RealApiUsageStatsProps) => {
  const [usageData, setUsageData] = useState<ApiUsageData[]>([]);
  const [totalCost, setTotalCost] = useState(0);
  const { isLoading, execute } = useStandardizedLoading();

  useEffect(() => {
    fetchRealUsageData();
  }, []);

  const fetchRealUsageData = async () => {
    await execute(async () => {
      // Fetch actual API usage from ai_usage_logs table
      const { data: usageLogs, error } = await supabase
        .from('ai_usage_logs')
        .select('*')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (usageLogs) {
        // Process the data to create daily summaries
        const dailyData = usageLogs.reduce((acc: Record<string, any>, log) => {
          const date = new Date(log.created_at).toDateString();
          
          if (!acc[date]) {
            acc[date] = {
              date,
              total_requests: 0,
              successful_requests: 0,
              failed_requests: 0,
              cost_estimate: 0,
              model_breakdown: {}
            };
          }
          
          acc[date].total_requests++;
          
          if (log.request_type !== 'error') {
            acc[date].successful_requests++;
            // Use estimated_cost if available, otherwise use tokens_used
            acc[date].cost_estimate += log.estimated_cost || (log.tokens_used * 0.0001);
          } else {
            acc[date].failed_requests++;
          }
          
          // Track model usage
          const model = log.model_used || 'unknown';
          if (!acc[date].model_breakdown[model]) {
            acc[date].model_breakdown[model] = 0;
          }
          acc[date].model_breakdown[model]++;
          
          return acc;
        }, {});

        const processedData = Object.values(dailyData) as ApiUsageData[];
        setUsageData(processedData);
        
        // Calculate total cost
        const total = processedData.reduce((sum, day) => sum + day.cost_estimate, 0);
        setTotalCost(total);
      }
      
      return usageLogs;
    });
  };

  const estimateCost = (model: string, inputTokens: number, outputTokens: number): number => {
    // OpenAI pricing estimates (per 1K tokens)
    const pricing: Record<string, { input: number; output: number }> = {
      'gpt-4o': { input: 0.0025, output: 0.01 },
      'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
      'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
      'whisper-1': { input: 0.006, output: 0 }, // per minute
      'tts-1': { input: 0.015, output: 0 }, // per 1K characters
    };

    const modelPricing = pricing[model] || pricing['gpt-4o-mini'];
    const inputCost = (inputTokens / 1000) * modelPricing.input;
    const outputCost = (outputTokens / 1000) * modelPricing.output;
    
    return inputCost + outputCost;
  };

  const getRecentDaysData = () => {
    return usageData.slice(0, 7); // Last 7 days
  };

  const getTotalRequests = () => {
    return usageData.reduce((sum, day) => sum + day.total_requests, 0);
  };

  const getSuccessRate = () => {
    const total = getTotalRequests();
    const successful = usageData.reduce((sum, day) => sum + day.successful_requests, 0);
    return total > 0 ? ((successful / total) * 100).toFixed(1) : '0';
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <ComponentSpinner size={20} className="mr-2" />
          <span className="text-sm text-muted-foreground">Loading API usage...</span>
        </div>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Compact Summary */}
      <div className="grid grid-cols-2 gap-2">
        <div className="p-3 bg-gray-50 rounded">
          <p className="text-xs text-gray-600">Requests</p>
          <p className="text-sm font-semibold">{getTotalRequests()}</p>
        </div>
        <div className="p-3 bg-gray-50 rounded">
          <p className="text-xs text-gray-600">Success</p>
          <p className="text-sm font-semibold">{getSuccessRate()}%</p>
        </div>
        <div className="p-3 bg-gray-50 rounded">
          <p className="text-xs text-gray-600">Cost (30d)</p>
          <p className="text-sm font-semibold">${totalCost.toFixed(2)}</p>
        </div>
        <div className="p-3 bg-gray-50 rounded">
          <p className="text-xs text-gray-600">Failed</p>
          <p className="text-sm font-semibold">{usageData.reduce((sum, day) => sum + day.failed_requests, 0)}</p>
        </div>
      </div>

      {/* Recent Activity - Compact */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium">Last 7 Days</h4>
        <div className="space-y-1">
          {getRecentDaysData().map((day, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs">
              <span>{new Date(day.date).toLocaleDateString()}</span>
              <div className="flex space-x-2">
                <span>{day.total_requests}req</span>
                <span>${day.cost_estimate.toFixed(3)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Model Usage - Compact */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium">Model Usage</h4>
        <div className="space-y-1">
          {Object.entries(
            usageData.reduce((acc: Record<string, number>, day) => {
              Object.entries(day.model_breakdown).forEach(([model, count]) => {
                acc[model] = (acc[model] || 0) + count;
              });
              return acc;
            }, {})
          )
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([model, count]) => (
              <div key={model} className="flex justify-between items-center text-xs">
                <span>{model}</span>
                <span>{count}</span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};