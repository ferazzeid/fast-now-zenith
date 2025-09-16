import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useStandardizedLoading } from '@/hooks/useStandardizedLoading';
import { ComponentSpinner } from '@/components/LoadingStates';
import { DollarSign, TrendingUp, Activity, Calendar } from 'lucide-react';

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
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
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
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          OpenAI API Usage & Costs
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="current-month" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="current-month" className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              This Month
            </TabsTrigger>
            <TabsTrigger value="rolling-30" className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              Last 30 Days
            </TabsTrigger>
            <TabsTrigger value="recent-activity">Recent Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="current-month" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left Column - Key Metrics */}
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm text-muted-foreground">Total Requests</span>
                  <span className="text-lg font-semibold text-foreground">
                    {stats?.currentMonth.totalRequests.toLocaleString()}
                  </span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm text-muted-foreground">Total Cost</span>
                  <span className="text-lg font-semibold text-foreground">
                    ${stats?.currentMonth.totalCost.toFixed(3)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm text-muted-foreground">Avg Cost/Request</span>
                  <span className="text-lg font-semibold text-foreground">
                    ${stats?.currentMonth.averageCostPerRequest.toFixed(4)}
                  </span>
                </div>

                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm text-muted-foreground">Success Rate</span>
                  <span className="text-lg font-semibold text-foreground">
                    {stats?.currentMonth.successRate.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Right Column - Today & Model Breakdown */}
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-blue-800">Today</span>
                    <DollarSign className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-700">{stats?.today.totalRequests} requests</span>
                    <span className="font-semibold text-blue-800">${stats?.today.totalCost.toFixed(3)}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Top Models (This Month)</h4>
                  {getTopModels(stats?.currentMonth.requestsByModel || {}).map(([model, count]) => (
                    <div key={model} className="flex justify-between items-center text-sm">
                      <span className="truncate">{model}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {count}
                        </Badge>
                        <span className="text-muted-foreground min-w-[3rem] text-right">
                          ${((stats?.currentMonth.costsByModel || {})[model] || 0).toFixed(3)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="rolling-30" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm text-muted-foreground">Total Requests</span>
                  <span className="text-lg font-semibold text-foreground">
                    {stats?.rolling30Days.totalRequests.toLocaleString()}
                  </span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm text-muted-foreground">Total Cost</span>
                  <span className="text-lg font-semibold text-foreground">
                    ${stats?.rolling30Days.totalCost.toFixed(3)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm text-muted-foreground">Daily Average</span>
                  <span className="text-lg font-semibold text-foreground">
                    {stats?.rolling30Days.dailyAverage} req/day
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">Model Usage (30 Days)</h4>
                {getTopModels(stats?.rolling30Days.requestsByModel || {}).map(([model, count]) => (
                  <div key={model} className="flex justify-between items-center text-sm">
                    <span className="truncate">{model}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {count}
                      </Badge>
                      <span className="text-muted-foreground min-w-[3rem] text-right">
                        ${((stats?.rolling30Days.costsByModel || {})[model] || 0).toFixed(3)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="recent-activity" className="mt-4">
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Last 7 Days Activity</h4>
              <div className="space-y-2">
                {stats?.recentDays.map((day, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium min-w-[3rem]">{day.date}</span>
                      <div className="flex gap-1">
                        {Object.entries(day.models).slice(0, 3).map(([model, count]) => (
                        <Badge key={model} variant="outline" className="text-xs px-1">
                          {model.split('-')[0]} ({count.toString()})
                        </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-muted-foreground">{day.requests} req</span>
                      <span className="font-semibold min-w-[4rem] text-right">${day.cost.toFixed(3)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};