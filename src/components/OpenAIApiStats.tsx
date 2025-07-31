import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSpinner } from "@/components/LoadingSpinner";

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
  const [stats, setStats] = useState<ApiStats>({
    totalRequests: 0,
    totalCost: 0,
    requestsToday: 0,
    costToday: 0,
    averageRequestsPerDay: 0,
    mostUsedModel: 'N/A',
    successRate: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApiStats();
  }, []);

  const fetchApiStats = async () => {
    try {
      setLoading(true);
      
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
        setLoading(false);
        return;
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

      setStats({
        totalRequests,
        totalCost,
        requestsToday,
        costToday,
        averageRequestsPerDay,
        mostUsedModel,
        successRate
      });
    } catch (error) {
      console.error('Error calculating API stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Central OpenAI API Statistics</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <LoadingSpinner />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          Central OpenAI API Statistics
        </CardTitle>
        <CardDescription>
          Usage and cost metrics for the shared OpenAI API serving all users (last 30 days)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
              <span className="text-sm text-muted-foreground">Total Requests</span>
              <span className="text-lg font-bold text-primary">{stats.totalRequests.toLocaleString()}</span>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
              <span className="text-sm text-muted-foreground">Requests Today</span>
              <span className="text-lg font-bold text-green-600">{stats.requestsToday.toLocaleString()}</span>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
              <span className="text-sm text-muted-foreground">Daily Average</span>
              <span className="text-lg font-bold text-blue-600">{stats.averageRequestsPerDay.toLocaleString()}</span>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
              <span className="text-sm text-muted-foreground">Total Cost</span>
              <span className="text-lg font-bold text-red-600">${stats.totalCost.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
              <span className="text-sm text-muted-foreground">Today's Cost</span>
              <span className="text-lg font-bold text-orange-600">${stats.costToday.toFixed(2)}</span>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
              <span className="text-sm text-muted-foreground">Success Rate</span>
              <span className="text-lg font-bold text-green-600">{stats.successRate}%</span>
            </div>
          </div>
        </div>

        {/* Most Used Model */}
        <div className="mt-6 p-4 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border border-primary/20">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-foreground">Most Used Model</span>
            <span className="text-lg font-bold text-primary">{stats.mostUsedModel}</span>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-4 text-xs text-muted-foreground text-center">
          Statistics based on AI usage logs from the last 30 days
        </div>
      </CardContent>
    </Card>
  );
};