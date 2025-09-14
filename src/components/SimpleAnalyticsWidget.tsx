import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useStandardizedLoading } from '@/hooks/useStandardizedLoading';
import { ComponentSpinner } from '@/components/LoadingStates';

// Performance optimized analytics - updates every hour to reduce server load

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
  const { isLoading, execute } = useStandardizedLoading();
  const [gaConfigured, setGaConfigured] = useState(false);

  const fetchAnalyticsData = async () => {
    await execute(async () => {
      // Check if GA is configured by checking for tracking ID
      const { data: gaSettings, error: gaError } = await supabase
        .from('shared_settings')
        .select('setting_value')
        .eq('setting_key', 'ga_tracking_id');

      const hasGaConfig = !gaError && 
        gaSettings?.[0]?.setting_value && 
        gaSettings[0].setting_value.trim() !== '';
      
      setGaConfigured(!!hasGaConfig);

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

      // Note: Google Analytics data is tracked client-side with ga_tracking_id
      // Real-time GA data requires GA Reporting API which needs service account setup
      let gaData = { activeUsers: 0, todayUsers: 0, yesterdayUsers: 0 };

      setData(prev => ({
        ...prev,
        activeFastingSessions: fastingSessions?.length || 0,
        activeWalkingSessions: walkingSessions?.length || 0,
        aiRequestsToday: aiRequests?.length || 0,
        activeUsers: gaData.activeUsers,
        todayUsers: gaData.todayUsers,
        yesterdayUsers: gaData.yesterdayUsers
      }));

      return { fastingSessions, walkingSessions, aiRequests };
    });
  };

  const refreshData = () => {
    fetchAnalyticsData();
  };

  useEffect(() => {
    fetchAnalyticsData();
    // Remove auto-refresh - make it manual only for admin performance
  }, []);

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-16">
          <ComponentSpinner size={20} className="mr-2" />
          <span className="text-muted-foreground">Loading analytics...</span>
        </div>
      </Card>
    );
  }

  const analyticsMetrics = [
    { 
      title: 'Active Users Now',
      items: [
        { label: 'Count', value: data.activeUsers }
      ]
    },
    { 
      title: 'Users Today',
      items: [
        { label: 'Count', value: data.todayUsers }
      ]
    },
    { 
      title: 'Users Yesterday',
      items: [
        { label: 'Count', value: data.yesterdayUsers }
      ]
    },
    { 
      title: 'Active Fasting',
      items: [
        { label: 'Sessions', value: data.activeFastingSessions }
      ]
    },
    { 
      title: 'Active Walking',
      items: [
        { label: 'Sessions', value: data.activeWalkingSessions }
      ]
    },
    { 
      title: 'AI Requests Today',
      items: [
        { label: 'Count', value: data.aiRequestsToday }
      ]
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Real-Time Analytics</CardTitle>
      </CardHeader>
      <CardContent>
        {!gaConfigured && (
          <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <p className="text-xs text-yellow-700 dark:text-yellow-300">
              Google Analytics tracking ID: {gaConfigured ? 'Configured' : 'Not configured'} - Configure in settings below to track pageviews
            </p>
          </div>
        )}
        <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
          {analyticsMetrics.map((metric, index) => (
            <div key={index} className="space-y-3">
              <h4 className="text-xs font-medium text-foreground mb-3 text-center">
                {metric.title}
              </h4>
              <div className="space-y-2">
                {metric.items.map((item, itemIndex) => (
                  <div key={itemIndex} className="flex justify-between items-center p-2 bg-muted/50 rounded-lg">
                    <span className="text-xs text-muted-foreground">{item.label}</span>
                    <span className="text-sm font-semibold text-foreground">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};