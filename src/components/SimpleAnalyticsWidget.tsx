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
      
      // Get users who performed any activity today
      const [foodEntries, walkingSessions, fastingSessions] = await Promise.all([
        supabase.from('food_entries')
          .select('user_id')
          .gte('created_at', todayStart),
        supabase.from('walking_sessions')
          .select('user_id')
          .gte('created_at', todayStart),
        supabase.from('fasting_sessions')
          .select('user_id')
          .gte('created_at', todayStart)
      ]);

      // Get active sessions counts
      const [activeFasting, activeWalking] = await Promise.all([
        supabase.from('fasting_sessions')
          .select('id')
          .eq('status', 'active'),
        supabase.from('walking_sessions')
          .select('id')
          .eq('session_state', 'active')
      ]);

      // Calculate unique users active today from any activity
      const activeUsersToday = new Set([
        ...(foodEntries.data?.map(entry => entry.user_id) || []),
        ...(walkingSessions.data?.map(session => session.user_id) || []),
        ...(fastingSessions.data?.map(session => session.user_id) || [])
      ]);

      // Get unique users who logged food today
      const uniqueFoodLoggers = new Set(foodEntries.data?.map(entry => entry.user_id) || []);

      // Log any errors
      if (foodEntries.error) console.error('Error fetching food entries:', foodEntries.error);
      if (walkingSessions.error) console.error('Error fetching walking sessions:', walkingSessions.error);
      if (fastingSessions.error) console.error('Error fetching fasting sessions:', fastingSessions.error);
      if (activeFasting.error) console.error('Error fetching active fasting:', activeFasting.error);
      if (activeWalking.error) console.error('Error fetching active walking:', activeWalking.error);

      return {
        usersToday: activeUsersToday.size,
        activeFasting: activeFasting.data?.length || 0,
        activeWalking: activeWalking.data?.length || 0,
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
              <div className="p-2 bg-muted/50 rounded-lg text-center">
                <span className="text-sm font-semibold text-foreground">{analytics?.usersToday}</span>
              </div>
            </div>

            {/* Active Fasting */}
            <div className="space-y-3">
              <div className="h-6 flex items-center justify-center">
                <span className="text-sm font-medium text-foreground">Active Fasting</span>
              </div>
              <div className="p-2 bg-muted/50 rounded-lg text-center">
                <span className="text-sm font-semibold text-foreground">{analytics?.activeFasting}</span>
              </div>
            </div>

            {/* Active Walking */}
            <div className="space-y-3">
              <div className="h-6 flex items-center justify-center">
                <span className="text-sm font-medium text-foreground">Active Walking</span>
              </div>
              <div className="p-2 bg-muted/50 rounded-lg text-center">
                <span className="text-sm font-semibold text-foreground">{analytics?.activeWalking}</span>
              </div>
            </div>

            {/* Food Logging */}
            <div className="space-y-3">
              <div className="h-6 flex items-center justify-center">
                <span className="text-sm font-medium text-foreground">Food Logging</span>
              </div>
              <div className="p-2 bg-muted/50 rounded-lg text-center">
                <span className="text-sm font-semibold text-foreground">{analytics?.activeFoodLogging}</span>
              </div>
            </div>

          </div>
        </div>
      </CardContent>
    </Card>
  );
};