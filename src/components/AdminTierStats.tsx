import { useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useStandardizedLoading } from '@/hooks/useStandardizedLoading';
import { ComponentSpinner } from '@/components/LoadingStates';

interface UserTierStats {
  free: { total: number; active: number; inactive: number };
  trial: { total: number; active: number; inactive: number };
  paid: { total: number; active: number; inactive: number };
}

export const AdminTierStats = () => {
  const { data: stats, isLoading, execute } = useStandardizedLoading<UserTierStats>({
    free: { total: 0, active: 0, inactive: 0 },
    trial: { total: 0, active: 0, inactive: 0 },
    paid: { total: 0, active: 0, inactive: 0 }
  });

  useEffect(() => {
    fetchTierStats();
  }, []);

  const fetchTierStats = async () => {
    await execute(async () => {
      // Get user data with access levels and trial information
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          access_level,
          trial_ends_at,
          subscription_status,
          last_activity_at
        `);

      if (error) throw error;

      const now = new Date();
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      // Initialize counters
      const tierStats: UserTierStats = {
        free: { total: 0, active: 0, inactive: 0 },
        trial: { total: 0, active: 0, inactive: 0 },
        paid: { total: 0, active: 0, inactive: 0 }
      };

      data?.forEach(profile => {
        const isActive = profile.last_activity_at && new Date(profile.last_activity_at) > sevenDaysAgo;
        
        // Determine user tier based on access_level system
        let userTier: 'free' | 'trial' | 'paid';
        
        if (profile.access_level === 'admin') {
          // Admin users are always considered paid
          userTier = 'paid';
        } else if (profile.subscription_status === 'active' || profile.subscription_status === 'trialing') {
          // Users with active subscriptions
          userTier = 'paid';
        } else if (profile.trial_ends_at && new Date(profile.trial_ends_at) > now) {
          // Users currently in trial period
          userTier = 'trial';
        } else {
          // Free users (trial ended or never started)
          userTier = 'free';
        }

        // Update counters
        tierStats[userTier].total++;
        if (isActive) {
          tierStats[userTier].active++;
        } else {
          tierStats[userTier].inactive++;
        }
      });

      return tierStats;
    });
  };

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
          User Tiers Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="grid grid-cols-4 gap-4 min-w-full">
            {/* Stats Labels Column */}
            <div className="space-y-3">
              <div className="h-6 flex items-center justify-center">
                <span className="text-sm font-medium text-foreground">Stats</span>
              </div>
              <div className="space-y-2">
                <div className="p-2 bg-muted/50 rounded-lg">
                  <span className="text-xs text-muted-foreground">Active Users</span>
                </div>
                <div className="p-2 bg-muted/50 rounded-lg">
                  <span className="text-xs text-muted-foreground">Inactive Users</span>
                </div>
                <div className="p-2 bg-muted/50 rounded-lg">
                  <span className="text-xs text-muted-foreground">Total</span>
                </div>
              </div>
            </div>

            {/* Free Users Column */}
            <div className="space-y-3">
              <div className="h-6 flex items-center justify-center">
                <span className="text-sm font-medium text-foreground">Free</span>
              </div>
              <div className="space-y-2">
                <div className="p-2 bg-muted/50 rounded-lg text-center">
                  <span className="text-sm font-semibold text-foreground">{stats?.free.active}</span>
                </div>
                <div className="p-2 bg-muted/50 rounded-lg text-center">
                  <span className="text-sm font-semibold text-foreground">{stats?.free.inactive}</span>
                </div>
                <div className="p-2 bg-muted/50 rounded-lg text-center">
                  <span className="text-sm font-semibold text-foreground">{stats?.free.total}</span>
                </div>
              </div>
            </div>

            {/* Trial Users Column */}
            <div className="space-y-3">
              <div className="h-6 flex items-center justify-center">
                <span className="text-sm font-medium text-foreground">Trial</span>
              </div>
              <div className="space-y-2">
                <div className="p-2 bg-muted/50 rounded-lg text-center">
                  <span className="text-sm font-semibold text-foreground">{stats?.trial.active}</span>
                </div>
                <div className="p-2 bg-muted/50 rounded-lg text-center">
                  <span className="text-sm font-semibold text-foreground">{stats?.trial.inactive}</span>
                </div>
                <div className="p-2 bg-muted/50 rounded-lg text-center">
                  <span className="text-sm font-semibold text-foreground">{stats?.trial.total}</span>
                </div>
              </div>
            </div>

            {/* Paid Users Column */}
            <div className="space-y-3">
              <div className="h-6 flex items-center justify-center">
                <span className="text-sm font-medium text-foreground">Paid</span>
              </div>
              <div className="space-y-2">
                <div className="p-2 bg-muted/50 rounded-lg text-center">
                  <span className="text-sm font-semibold text-foreground">{stats?.paid.active}</span>
                </div>
                <div className="p-2 bg-muted/50 rounded-lg text-center">
                  <span className="text-sm font-semibold text-foreground">{stats?.paid.inactive}</span>
                </div>
                <div className="p-2 bg-muted/50 rounded-lg text-center">
                  <span className="text-sm font-semibold text-foreground">{stats?.paid.total}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};