import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { LoadingSpinner } from '@/components/LoadingSpinner';

interface TierStats {
  tier: string;
  total: number;
  active: number;
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
      const tierCounts: Record<string, { total: number; active: number }> = {
        api_user: { total: 0, active: 0 },
        paid_user: { total: 0, active: 0 },
        granted_user: { total: 0, active: 0 },
        free_user: { total: 0, active: 0 }
      };

      data?.forEach(profile => {
        const tier = profile.user_tier || 'granted_user';
        tierCounts[tier].total++;
        
        // Check if user was active in last 7 days
        if (profile.last_activity_at && new Date(profile.last_activity_at) > sevenDaysAgo) {
          tierCounts[tier].active++;
        }
      });

      const statsArray: TierStats[] = [
        { tier: 'API Users', total: tierCounts.api_user.total, active: tierCounts.api_user.active },
        { tier: 'Paid Users', total: tierCounts.paid_user.total, active: tierCounts.paid_user.active },
        { tier: 'Granted Users', total: tierCounts.granted_user.total, active: tierCounts.granted_user.active },
        { tier: 'Free Users', total: tierCounts.free_user.total, active: tierCounts.free_user.active }
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
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">User Tiers Overview</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.tier}
            className="text-center p-4 bg-muted/50 rounded-lg border"
          >
            <h4 className="font-medium text-sm text-muted-foreground mb-1">
              {stat.tier}
            </h4>
            <div className="text-2xl font-bold text-primary">
              {stat.total}
            </div>
            <div className="text-xs text-muted-foreground">
              ({stat.active} active)
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 text-xs text-muted-foreground">
        * Active = used app in last 7 days
      </div>
    </Card>
  );
};