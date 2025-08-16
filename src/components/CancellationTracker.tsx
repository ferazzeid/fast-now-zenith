import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSpinner } from "@/components/LoadingSpinner";

interface UserActivityData {
  trialEndingsToday: number;
  trialEndingsMonth: number;
  cancellationsToday: number;
  cancellationsMonth: number;
  upgradestoday: number;
  upgradesMonth: number;
}

export const CancellationTracker = () => {
  const [data, setData] = useState<UserActivityData>({
    trialEndingsToday: 0,
    trialEndingsMonth: 0,
    cancellationsToday: 0,
    cancellationsMonth: 0,
    upgradestoday: 0,
    upgradesMonth: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchUserActivityData = async () => {
    try {
      setLoading(true);
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

      // Fetch trial endings (free users whose trial ends today/this month)
      const { data: todayTrialEnds } = await supabase
        .from('profiles')
        .select('id')
        .gte('trial_ends_at', startOfDay.toISOString())
        .lt('trial_ends_at', endOfDay.toISOString())
        .eq('subscription_status', 'free');

      const { data: monthTrialEnds } = await supabase
        .from('profiles')
        .select('id')
        .gte('trial_ends_at', startOfMonth.toISOString())
        .eq('subscription_status', 'free');

      // Fetch subscription cancellations
      const { data: todayCancellations } = await supabase
        .from('usage_analytics')
        .select('id')
        .eq('event_type', 'subscription_cancelled')
        .gte('created_at', startOfDay.toISOString());

      const { data: monthCancellations } = await supabase
        .from('usage_analytics')
        .select('id')
        .eq('event_type', 'subscription_cancelled')
        .gte('created_at', startOfMonth.toISOString());

      // Fetch users who upgraded to paid (trial users who became paid)
      const { data: todayUpgrades } = await supabase
        .from('profiles')
        .select('id')
        .in('subscription_status', ['active', 'trialing'])
        .gte('trial_started_at', startOfDay.toISOString())
        .lt('trial_started_at', endOfDay.toISOString());

      const { data: monthUpgrades } = await supabase
        .from('profiles')
        .select('id')
        .in('subscription_status', ['active', 'trialing'])
        .gte('trial_started_at', startOfMonth.toISOString());

      setData({
        trialEndingsToday: todayTrialEnds?.length || 0,
        trialEndingsMonth: monthTrialEnds?.length || 0,
        cancellationsToday: todayCancellations?.length || 0,
        cancellationsMonth: monthCancellations?.length || 0,
        upgradestoday: todayUpgrades?.length || 0,
        upgradesMonth: monthUpgrades?.length || 0
      });
    } catch (error) {
      console.error('Error fetching user activity data:', error);
      setData({
        trialEndingsToday: 0,
        trialEndingsMonth: 0,
        cancellationsToday: 0,
        cancellationsMonth: 0,
        upgradestoday: 0,
        upgradesMonth: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    await fetchUserActivityData();
  };

  useEffect(() => {
    fetchUserActivityData();
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          User Activity Tracking
          <Button variant="outline" size="sm" onClick={refreshData}>
            Refresh
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Trial Endings */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-foreground mb-3 text-center">
              Trial Endings
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center p-2 bg-muted/50 rounded-lg">
                <span className="text-xs text-muted-foreground">Today</span>
                <span className="text-sm font-semibold text-foreground">{data.trialEndingsToday}</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-muted/50 rounded-lg">
                <span className="text-xs text-muted-foreground">This Month</span>
                <span className="text-sm font-semibold text-foreground">{data.trialEndingsMonth}</span>
              </div>
            </div>
          </div>

          {/* Cancellations */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-foreground mb-3 text-center">
              Cancellations
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center p-2 bg-muted/50 rounded-lg">
                <span className="text-xs text-muted-foreground">Today</span>
                <span className="text-sm font-semibold text-foreground">{data.cancellationsToday}</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-muted/50 rounded-lg">
                <span className="text-xs text-muted-foreground">This Month</span>
                <span className="text-sm font-semibold text-foreground">{data.cancellationsMonth}</span>
              </div>
            </div>
          </div>

          {/* Upgrades to Paid */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-foreground mb-3 text-center">
              Upgrades to Paid
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center p-2 bg-muted/50 rounded-lg">
                <span className="text-xs text-muted-foreground">Today</span>
                <span className="text-sm font-semibold text-foreground">{data.upgradestoday}</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-muted/50 rounded-lg">
                <span className="text-xs text-muted-foreground">This Month</span>
                <span className="text-sm font-semibold text-foreground">{data.upgradesMonth}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};