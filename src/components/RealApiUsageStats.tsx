import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, DollarSign, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRealUsageData();
  }, []);

  const fetchRealUsageData = async () => {
    try {
      setLoading(true);
      
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
    } catch (error) {
      console.error('Error fetching real API usage:', error);
    } finally {
      setLoading(false);
    }
  };

  const estimateCost = (model: string, inputTokens: number, outputTokens: number): number => {
    // OpenAI pricing estimates (per 1K tokens)
    const pricing: Record<string, { input: number; output: number }> = {
      'gpt-4o': { input: 0.0025, output: 0.01 },
      'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
      'gpt-4-turbo': { input: 0.01, output: 0.03 },
      'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
      'whisper-1': { input: 0.006, output: 0 }, // per minute
      'tts-1': { input: 0.015, output: 0 }, // per 1K characters
      'dall-e-3': { input: 0.04, output: 0 } // per image
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

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-8 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-blue-500" />
            <div>
              <p className="text-sm font-medium">Total Requests</p>
              <p className="text-2xl font-bold">{getTotalRequests().toLocaleString()}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-green-500" />
            <div>
              <p className="text-sm font-medium">Success Rate</p>
              <p className="text-2xl font-bold">{getSuccessRate()}%</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <DollarSign className="w-5 h-5 text-yellow-500" />
            <div>
              <p className="text-sm font-medium">Est. Cost (30d)</p>
              <p className="text-2xl font-bold">${totalCost.toFixed(2)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <div>
              <p className="text-sm font-medium">Failed Requests</p>
              <p className="text-2xl font-bold">
                {usageData.reduce((sum, day) => sum + day.failed_requests, 0)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Recent API Activity (Last 7 Days)</h3>
        <div className="space-y-3">
          {getRecentDaysData().map((day, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">{new Date(day.date).toLocaleDateString()}</p>
                <div className="flex space-x-4 text-sm text-gray-600">
                  <span>{day.total_requests} requests</span>
                  <span>${day.cost_estimate.toFixed(3)} cost</span>
                </div>
              </div>
              <div className="flex space-x-2">
                <Badge variant="outline" className="text-green-600">
                  {day.successful_requests} success
                </Badge>
                {day.failed_requests > 0 && (
                  <Badge variant="destructive">
                    {day.failed_requests} failed
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Model Usage Breakdown */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Model Usage Breakdown</h3>
        <div className="space-y-2">
          {Object.entries(
            usageData.reduce((acc: Record<string, number>, day) => {
              Object.entries(day.model_breakdown).forEach(([model, count]) => {
                acc[model] = (acc[model] || 0) + count;
              });
              return acc;
            }, {})
          )
            .sort(([, a], [, b]) => b - a)
            .map(([model, count]) => (
              <div key={model} className="flex justify-between items-center">
                <span className="font-medium">{model}</span>
                <Badge variant="secondary">{count} requests</Badge>
              </div>
            ))}
        </div>
      </Card>
    </div>
  );
};