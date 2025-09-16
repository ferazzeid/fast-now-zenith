import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useStandardizedLoading } from '@/hooks/useStandardizedLoading';
import { ComponentSpinner } from '@/components/LoadingStates';

interface TodayAnalytics {
  usersToday: number;
  activeFasting: number;
  activeWalking: number;
  activeFoodLogging: number;
}

export const SimpleAnalyticsWidget = () => {
  const { data: analytics, isLoading, execute } = useStandardizedLoading<TodayAnalytics>({
    usersToday: 0,
    activeFasting: 0,
    activeWalking: 0,
    activeFoodLogging: 0
  });

  const fetchTodayAnalytics = async () => {
    await execute(async () => {
      const today = new Date().toISOString().split('T')[0];
      const todayStart = `${today}T00:00:00.000Z`;
      
      // Users active today (profiles with last_activity_at today)
      const { data: todayUsers, error: usersError } = await supabase
        .from('profiles')
        .select('id')
        .gte('last_activity_at', todayStart);

      // Active fasting sessions
      const { data: fastingSessions, error: fastingError } = await supabase
        .from('fasting_sessions')
        .select('id')
        .eq('status', 'active');

      // Active walking sessions
      const { data: walkingSessions, error: walkingError } = await supabase
        .from('walking_sessions')
        .select('id')
        .eq('session_state', 'active');

      // Food entries created today (people actively logging food)
      const { data: foodEntries, error: foodError } = await supabase
        .from('food_entries')
        .select('user_id')
        .gte('created_at', todayStart);

      // Get unique users who logged food today
      const uniqueFoodLoggers = new Set(foodEntries?.map(entry => entry.user_id) || []);

      if (usersError) console.error('Error fetching users:', usersError);
      if (fastingError) console.error('Error fetching fasting sessions:', fastingError);
      if (walkingError) console.error('Error fetching walking sessions:', walkingError);
      if (foodError) console.error('Error fetching food entries:', foodError);

      return {
        usersToday: todayUsers?.length || 0,
        activeFasting: fastingSessions?.length || 0,
        activeWalking: walkingSessions?.length || 0,
        activeFoodLogging: uniqueFoodLoggers.size
      };
    });
  };

  useEffect(() => {
    fetchTodayAnalytics();
    // Set up auto-refresh every 5 minutes for real-time updates
    const interval = setInterval(fetchTodayAnalytics, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <ComponentSpinner size={24} />
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          Real-Time Analytics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="grid grid-cols-4 gap-4 min-w-full">
            
            {/* Users Today */}
            <div className="space-y-3">
              <div className="h-6 flex items-center justify-center">
                <span className="text-sm font-medium text-foreground">Users Today</span>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg text-center">
                <span className="text-2xl font-bold text-foreground">{analytics?.usersToday}</span>
              </div>
            </div>

            {/* Active Fasting */}
            <div className="space-y-3">
              <div className="h-6 flex items-center justify-center">
                <span className="text-sm font-medium text-foreground">Active Fasting</span>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg text-center">
                <span className="text-2xl font-bold text-foreground">{analytics?.activeFasting}</span>
              </div>
            </div>

            {/* Active Walking */}
            <div className="space-y-3">
              <div className="h-6 flex items-center justify-center">
                <span className="text-sm font-medium text-foreground">Active Walking</span>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg text-center">
                <span className="text-2xl font-bold text-foreground">{analytics?.activeWalking}</span>
              </div>
            </div>

            {/* Food Logging */}
            <div className="space-y-3">
              <div className="h-6 flex items-center justify-center">
                <span className="text-sm font-medium text-foreground">Food Logging</span>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg text-center">
                <span className="text-2xl font-bold text-foreground">{analytics?.activeFoodLogging}</span>
              </div>
            </div>

          </div>
        </div>
      </CardContent>
    </Card>
  );
};