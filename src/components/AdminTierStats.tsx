import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { LoadingSpinner } from '@/components/LoadingSpinner';

interface TierStats {
  tier: string;
  total: number;
  active: number;
  inactive: number;
}

export const AdminTierStats = () => {
  const [stats, setStats] = useState<TierStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTierStats();
  }, []);

  const fetchTierStats = async () => {
    try {
      setLoading(true);
      
      // Get tier counts with activity status
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          user_tier,
          last_activity_at
        `);

      if (error) throw error;

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      // Process data to calculate stats
      const tierCounts: Record<string, { total: number; active: number; inactive: number }> = {
        paid_user: { total: 0, active: 0, inactive: 0 },
        free_user: { total: 0, active: 0, inactive: 0 }
      };

      data?.forEach(profile => {
        const tier = profile.user_tier || 'free_user';
        if (tierCounts[tier]) {
          tierCounts[tier].total++;
          
          // Check if user was active in last 7 days
          if (profile.last_activity_at && new Date(profile.last_activity_at) > sevenDaysAgo) {
            tierCounts[tier].active++;
          } else {
            tierCounts[tier].inactive++;
          }
        }
      });

      const statsArray: TierStats[] = [
        { 
          tier: 'Paid Users (Trial + Subscribed)', 
          total: tierCounts.paid_user.total, 
          active: tierCounts.paid_user.active,
          inactive: tierCounts.paid_user.inactive
        },
        { 
          tier: 'Free Users (Trial Ended)', 
          total: tierCounts.free_user.total, 
          active: tierCounts.free_user.active,
          inactive: tierCounts.free_user.inactive
        }
      ];

      setStats(statsArray);
    } catch (error) {
      console.error('Error fetching tier stats:', error);
    } finally {
      setLoading(false);
    }
  };

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
        <CardTitle className="text-lg">
          User Tiers Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {stats.map((stat) => (
            <div key={stat.tier} className="space-y-3">
              <h4 className="text-sm font-medium text-foreground mb-3 text-center">
                {stat.tier}
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-2 bg-muted/50 rounded-lg">
                  <span className="text-xs text-muted-foreground">Active Users</span>
                  <span className="text-sm font-semibold text-foreground">{stat.active}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-muted/50 rounded-lg">
                  <span className="text-xs text-muted-foreground">Inactive Users</span>
                  <span className="text-sm font-semibold text-foreground">{stat.inactive}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-muted/50 rounded-lg">
                  <span className="text-xs text-muted-foreground">Total</span>
                  <span className="text-sm font-semibold text-foreground">{stat.total}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};