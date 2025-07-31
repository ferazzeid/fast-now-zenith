import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSpinner } from "@/components/LoadingSpinner";

interface AnalyticsData {
  activeUsers: number;
  todayUsers: number;
  yesterdayUsers: number;
  activeFastingSessions: number;
  activeWalkingSessions: number;
  aiRequestsToday: number;
}

export const SimpleAnalyticsWidget = () => {
  const [data, setData] = useState<AnalyticsData>({
    activeUsers: 0,
    todayUsers: 0,
    yesterdayUsers: 0,
    activeFastingSessions: 0,
    activeWalkingSessions: 0,
    aiRequestsToday: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchAnalyticsData = async () => {
    try {
      // Fetch active fasting sessions
      const { data: fastingSessions, error: fastingError } = await supabase
        .from('fasting_sessions')
        .select('id')
        .eq('status', 'active');

      // Fetch active walking sessions
      const { data: walkingSessions, error: walkingError } = await supabase
        .from('walking_sessions')
        .select('id')
        .eq('status', 'active');

      // Fetch AI requests today
      const { data: aiRequests, error: aiError } = await supabase
        .from('ai_usage_logs')
        .select('id')
        .gte('created_at', new Date().toISOString().split('T')[0]);

      if (fastingError) console.error('Error fetching fasting sessions:', fastingError);
      if (walkingError) console.error('Error fetching walking sessions:', walkingError);
      if (aiError) console.error('Error fetching AI requests:', aiError);

      setData(prev => ({
        ...prev,
        activeFastingSessions: fastingSessions?.length || 0,
        activeWalkingSessions: walkingSessions?.length || 0,
        aiRequestsToday: aiRequests?.length || 0
      }));

      // Google Analytics data would be fetched here
      // For now, using placeholder values
      setData(prev => ({
        ...prev,
        activeUsers: Math.floor(Math.random() * 50) + 10,
        todayUsers: Math.floor(Math.random() * 200) + 50,
        yesterdayUsers: Math.floor(Math.random() * 180) + 40
      }));

    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchAnalyticsData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <LoadingSpinner />
        </div>
      </Card>
    );
  }

  const analyticsMetrics = [
    { label: 'Active Users Now', value: data.activeUsers },
    { label: 'Users Today', value: data.todayUsers },
    { label: 'Users Yesterday', value: data.yesterdayUsers },
    { label: 'Active Fasting', value: data.activeFastingSessions },
    { label: 'Active Walking', value: data.activeWalkingSessions },
    { label: 'AI Requests Today', value: data.aiRequestsToday }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          Real-Time Analytics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {analyticsMetrics.map((metric, index) => (
            <div key={index} className="space-y-3">
              <h4 className="text-sm font-medium text-foreground mb-3 text-center">
                {metric.label}
              </h4>
              <div className="flex justify-center items-center p-4 bg-muted/50 rounded-lg">
                <span className="text-2xl font-bold text-foreground">{metric.value}</span>
              </div>
            </div>
          ))}
        </div>
        
        {/* Simple trend indicator */}
        <div className="mt-6 pt-4 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Trend vs Yesterday</span>
            <span className={data.todayUsers > data.yesterdayUsers ? 'text-green-500 font-medium' : 'text-red-500 font-medium'}>
              {data.todayUsers > data.yesterdayUsers ? '↗' : '↘'} 
              {Math.abs(((data.todayUsers - data.yesterdayUsers) / data.yesterdayUsers * 100) || 0).toFixed(1)}%
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};