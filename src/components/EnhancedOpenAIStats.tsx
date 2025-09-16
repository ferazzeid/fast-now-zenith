import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useStandardizedLoading } from '@/hooks/useStandardizedLoading';
import { ComponentSpinner } from '@/components/LoadingStates';
import { DollarSign } from 'lucide-react';

interface ApiStats {
  // Current month (calendar month)
  currentMonth: {
    totalRequests: number;
    totalCost: number;
    requestsByModel: Record<string, number>;
    costsByModel: Record<string, number>;
    successRate: number;
    averageCostPerRequest: number;
  };
  // Rolling 30 days
  rolling30Days: {
    totalRequests: number;
    totalCost: number;
    requestsByModel: Record<string, number>;
    costsByModel: Record<string, number>;
    successRate: number;
    dailyAverage: number;
  };
  // Today only
  today: {
    totalRequests: number;
    totalCost: number;
    requestsByModel: Record<string, number>;
    costsByModel: Record<string, number>;
  };
  // Recent 7 days breakdown
  recentDays: Array<{
    date: string;
    requests: number;
    cost: number;
    models: Record<string, number>;
  }>;
}

export const EnhancedOpenAIStats: React.FC = () => {
  const { data: stats, isLoading, execute } = useStandardizedLoading<ApiStats>();

  useEffect(() => {
    fetchEnhancedStats();
  }, []);

  const fetchEnhancedStats = async () => {
    await execute(async () => {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Fetch all usage data for the last 30 days
      const { data: usageData, error } = await supabase
        .from('ai_usage_logs')
        .select('*')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching AI usage stats:', error);
        throw error;
      }

      if (!usageData || usageData.length === 0) {
        return {
          currentMonth: {
            totalRequests: 0,
            totalCost: 0,
            requestsByModel: {},
            costsByModel: {},
            successRate: 0,
            averageCostPerRequest: 0
          },
          rolling30Days: {
            totalRequests: 0,
            totalCost: 0,
            requestsByModel: {},
            costsByModel: {},
            successRate: 0,
            dailyAverage: 0
          },
          today: {
            totalRequests: 0,
            totalCost: 0,
            requestsByModel: {},
            costsByModel: {}
          },
          recentDays: []
        };
      }

      // Helper function to aggregate data
      const aggregateData = (data: any[]) => {
        const requestsByModel: Record<string, number> = {};
        const costsByModel: Record<string, number> = {};
        let totalRequests = 0;
        let totalCost = 0;
        let successfulRequests = 0;

        data.forEach(log => {
          const model = log.model_used || 'unknown';
          const cost = log.estimated_cost || 0;
          
          totalRequests++;
          totalCost += cost;
          
          if (log.success !== false) {
            successfulRequests++;
          }
          
          requestsByModel[model] = (requestsByModel[model] || 0) + 1;
          costsByModel[model] = (costsByModel[model] || 0) + cost;
        });

        const successRate = totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0;
        const averageCostPerRequest = totalRequests > 0 ? totalCost / totalRequests : 0;

        return {
          totalRequests,
          totalCost,
          requestsByModel,
          costsByModel,
          successRate,
          averageCostPerRequest
        };
      };

      // Current month data
      const currentMonthData = usageData.filter(log => 
        new Date(log.created_at) >= currentMonthStart
      );
      const currentMonth = {
        ...aggregateData(currentMonthData),
        averageCostPerRequest: 0
      };
      currentMonth.averageCostPerRequest = currentMonth.totalRequests > 0 ? 
        currentMonth.totalCost / currentMonth.totalRequests : 0;

      // Rolling 30 days data
      const rolling30DaysData = usageData;
      const rolling30Days = {
        ...aggregateData(rolling30DaysData),
        dailyAverage: Math.round(rolling30DaysData.length / 30)
      };

      // Today's data
      const todayData = usageData.filter(log => 
        new Date(log.created_at) >= today
      );
      const todayStats = aggregateData(todayData);

      // Recent 7 days breakdown
      const recentDays: Array<{
        date: string;
        requests: number;
        cost: number;
        models: Record<string, number>;
      }> = [];

      for (let i = 6; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dateStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const dateEnd = new Date(dateStart.getTime() + 24 * 60 * 60 * 1000);
        
        const dayData = usageData.filter(log => {
          const logDate = new Date(log.created_at);
          return logDate >= dateStart && logDate < dateEnd;
        });

        const dayStats = aggregateData(dayData);
        
        recentDays.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          requests: dayStats.totalRequests,
          cost: dayStats.totalCost,
          models: dayStats.requestsByModel
        });
      }

      return {
        currentMonth,
        rolling30Days,
        today: todayStats,
        recentDays
      };
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">
            OpenAI API Usage & Costs
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <ComponentSpinner size={24} />
        </CardContent>
      </Card>
    );
  }

  const getTopModels = (modelData: Record<string, number>) => {
    return Object.entries(modelData)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium">
          OpenAI API Usage & Costs
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="recent-activity" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="recent-activity" className="text-xs">Recent</TabsTrigger>
            <TabsTrigger value="current-month" className="text-xs">This Month</TabsTrigger>
            <TabsTrigger value="rolling-30" className="text-xs">Last 30D</TabsTrigger>
          </TabsList>

          <TabsContent value="current-month" className="mt-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-2 bg-muted/30 rounded">
                <div className="text-xs text-muted-foreground mb-1">Total Requests</div>
                <div className="text-sm font-semibold">{stats?.currentMonth.totalRequests.toLocaleString()}</div>
              </div>
              
              <div className="p-2 bg-muted/30 rounded">
                <div className="text-xs text-muted-foreground mb-1">Total Cost</div>
                <div className="text-sm font-semibold">${stats?.currentMonth.totalCost.toFixed(3)}</div>
              </div>
              
              <div className="p-2 bg-muted/30 rounded">
                <div className="text-xs text-muted-foreground mb-1">Avg/Request</div>
                <div className="text-sm font-semibold">${stats?.currentMonth.averageCostPerRequest.toFixed(4)}</div>
              </div>

              <div className="p-2 bg-muted/30 rounded">
                <div className="text-xs text-muted-foreground mb-1">Success Rate</div>
                <div className="text-sm font-semibold">{stats?.currentMonth.successRate.toFixed(1)}%</div>
              </div>
            </div>

            <div className="mt-4 p-2 bg-blue-50 border border-blue-200 rounded">
              <div className="text-xs text-blue-600 mb-1">Today</div>
              <div className="flex justify-between text-sm">
                <span className="text-blue-700">{stats?.today.totalRequests} requests</span>
                <span className="font-semibold text-blue-800">${stats?.today.totalCost.toFixed(3)}</span>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <div className="text-xs font-medium text-muted-foreground">Top Models</div>
              {getTopModels(stats?.currentMonth.requestsByModel || {}).map(([model, count]) => (
                <div key={model} className="flex justify-between items-center text-xs p-1">
                  <span className="truncate">{model}</span>
                  <div className="flex items-center gap-1">
                    <Badge variant="secondary" className="text-xs px-1 py-0">
                      {count}
                    </Badge>
                    <span className="text-muted-foreground min-w-[2.5rem] text-right">
                      ${((stats?.currentMonth.costsByModel || {})[model] || 0).toFixed(3)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="rolling-30" className="mt-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-2 bg-muted/30 rounded">
                <div className="text-xs text-muted-foreground mb-1">Total Requests</div>
                <div className="text-sm font-semibold">{stats?.rolling30Days.totalRequests.toLocaleString()}</div>
              </div>
              
              <div className="p-2 bg-muted/30 rounded">
                <div className="text-xs text-muted-foreground mb-1">Total Cost</div>
                <div className="text-sm font-semibold">${stats?.rolling30Days.totalCost.toFixed(3)}</div>
              </div>
              
              <div className="p-2 bg-muted/30 rounded col-span-2">
                <div className="text-xs text-muted-foreground mb-1">Daily Average</div>
                <div className="text-sm font-semibold">{stats?.rolling30Days.dailyAverage} req/day</div>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <div className="text-xs font-medium text-muted-foreground">Model Usage</div>
              {getTopModels(stats?.rolling30Days.requestsByModel || {}).map(([model, count]) => (
                <div key={model} className="flex justify-between items-center text-xs p-1">
                  <span className="truncate">{model}</span>
                  <div className="flex items-center gap-1">
                    <Badge variant="outline" className="text-xs px-1 py-0">
                      {count}
                    </Badge>
                    <span className="text-muted-foreground min-w-[2.5rem] text-right">
                      ${((stats?.rolling30Days.costsByModel || {})[model] || 0).toFixed(3)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="recent-activity" className="mt-4">
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-2 bg-muted/30 rounded">
                <div className="text-xs text-muted-foreground mb-1">Today</div>
                <div className="flex justify-between text-sm">
                  <span>{stats?.today.totalRequests} req</span>
                  <span className="font-semibold">${stats?.today.totalCost.toFixed(3)}</span>
                </div>
              </div>
              
              <div className="p-2 bg-muted/30 rounded">
                <div className="text-xs text-muted-foreground mb-1">Success Rate</div>
                <div className="text-sm font-semibold">{stats?.rolling30Days.successRate.toFixed(1)}%</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-medium text-muted-foreground">Most Used Models</div>
              {getTopModels(stats?.rolling30Days.requestsByModel || {}).slice(0, 3).map(([model, count]) => (
                <div key={model} className="flex justify-between items-center text-xs p-1">
                  <span className="truncate">{model}</span>
                  <div className="flex items-center gap-1">
                    <Badge variant="secondary" className="text-xs px-1 py-0">
                      {count}
                    </Badge>
                    <span className="text-muted-foreground min-w-[2.5rem] text-right">
                      ${((stats?.rolling30Days.costsByModel || {})[model] || 0).toFixed(3)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};