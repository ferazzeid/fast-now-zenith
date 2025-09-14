import React, { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useStandardizedLoading } from '@/hooks/useStandardizedLoading';
import { ComponentSpinner } from '@/components/LoadingStates';

interface ApiStats {
  totalRequests: number;
  totalCost: number;
  requestsToday: number;
  costToday: number;
  averageRequestsPerDay: number;
  mostUsedModel: string;
  successRate: number;
}

export const OpenAIApiStats: React.FC = () => {
  const { data: stats, isLoading, execute } = useStandardizedLoading<ApiStats>({
    totalRequests: 0,
    totalCost: 0,
    requestsToday: 0,
    costToday: 0,
    averageRequestsPerDay: 0,
    mostUsedModel: 'N/A',
    successRate: 0
  });

  useEffect(() => {
    fetchApiStats();
  }, []);

  const fetchApiStats = async () => {
    await execute(async () => {
      
      // Get usage data from the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data: usageData, error } = await supabase
        .from('ai_usage_logs')
        .select('*')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching API stats:', error);
        return;
      }

      if (!usageData || usageData.length === 0) {
        return {
          totalRequests: 0,
          totalCost: 0,
          requestsToday: 0,
          costToday: 0,
          averageRequestsPerDay: 0,
          mostUsedModel: 'N/A',
          successRate: 0
        };
      }

      // Calculate statistics
      const totalRequests = usageData.length;
      const totalCost = usageData.reduce((sum, log) => sum + (log.estimated_cost || 0), 0);
      
      // Today's stats
      const todayData = usageData.filter(log => 
        new Date(log.created_at) >= today
      );
      const requestsToday = todayData.length;
      const costToday = todayData.reduce((sum, log) => sum + (log.estimated_cost || 0), 0);
      
      // Average requests per day (last 30 days)
      const averageRequestsPerDay = Math.round(totalRequests / 30);
      
      // Most used model
      const modelCounts: Record<string, number> = {};
      usageData.forEach(log => {
        if (log.model_used) {
          modelCounts[log.model_used] = (modelCounts[log.model_used] || 0) + 1;
        }
      });
      
      const mostUsedModel = Object.keys(modelCounts).length > 0 
        ? Object.entries(modelCounts).sort(([,a], [,b]) => b - a)[0][0]
        : 'N/A';
      
      // Success rate (assuming no errors means success)
      const successfulRequests = usageData.filter(log => !log.request_type?.includes('error')).length;
      const successRate = totalRequests > 0 ? Math.round((successfulRequests / totalRequests) * 100) : 0;

      return {
        totalRequests,
        totalCost,
        requestsToday,
        costToday,
        averageRequestsPerDay,
        mostUsedModel,
        successRate
      };
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>OpenAI API Statistics</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <ComponentSpinner size={24} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          OpenAI API Statistics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left Column */}
          <div className="space-y-3">
            <div className="flex justify-between items-center p-2 bg-muted/50 rounded-lg">
              <span className="text-xs text-muted-foreground">Total Requests</span>
              <span className="text-sm font-semibold text-foreground">{stats?.totalRequests.toLocaleString()}</span>
            </div>
            
            <div className="flex justify-between items-center p-2 bg-muted/50 rounded-lg">
              <span className="text-xs text-muted-foreground">Requests Today</span>
              <span className="text-sm font-semibold text-foreground">{stats?.requestsToday.toLocaleString()}</span>
            </div>
            
            <div className="flex justify-between items-center p-2 bg-muted/50 rounded-lg">
              <span className="text-xs text-muted-foreground">Daily Average</span>
              <span className="text-sm font-semibold text-foreground">{stats?.averageRequestsPerDay.toLocaleString()}</span>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-3">
            <div className="flex justify-between items-center p-2 bg-muted/50 rounded-lg">
              <span className="text-xs text-muted-foreground">Total Cost</span>
              <span className="text-sm font-semibold text-foreground">${stats?.totalCost.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between items-center p-2 bg-muted/50 rounded-lg">
              <span className="text-xs text-muted-foreground whitespace-nowrap">Today's Cost</span>
              <span className="text-sm font-semibold text-foreground">${stats?.costToday.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between items-center p-2 bg-muted/50 rounded-lg">
              <span className="text-xs text-muted-foreground">Success Rate</span>
              <span className="text-sm font-semibold text-foreground">{stats?.successRate}%</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};