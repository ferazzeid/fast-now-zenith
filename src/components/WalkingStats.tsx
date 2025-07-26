import { useEffect, useState } from 'react';
import { TrendingUp, Calendar, Target, Zap } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface WalkingStats {
  todayMinutes: number;
  todayCalories: number;
  todayDistance: number;
  weeklyMinutes: number;
  weeklyCalories: number;
  weeklyDistance: number;
  totalSessions: number;
}

export const WalkingStats = () => {
  const [stats, setStats] = useState<WalkingStats>({
    todayMinutes: 0,
    todayCalories: 0,
    todayDistance: 0,
    weeklyMinutes: 0,
    weeklyCalories: 0,
    weeklyDistance: 0,
    totalSessions: 0,
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchWalkingStats = async () => {
      if (!user) return;

      try {
        const today = new Date();
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        startOfWeek.setHours(0, 0, 0, 0);

        // Today's stats
        const { data: todayData } = await supabase
          .from('walking_sessions')
          .select('start_time, end_time, calories_burned, distance')
          .eq('user_id', user.id)
          .eq('status', 'completed')
          .gte('start_time', startOfDay.toISOString());

        // Weekly stats
        const { data: weeklyData } = await supabase
          .from('walking_sessions')
          .select('start_time, end_time, calories_burned, distance')
          .eq('user_id', user.id)
          .eq('status', 'completed')
          .gte('start_time', startOfWeek.toISOString());

        // Total sessions count
        const { count: totalSessions } = await supabase
          .from('walking_sessions')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'completed');

        const calculateStats = (sessions: any[]) => {
          return sessions.reduce(
            (acc, session) => {
              const duration = session.end_time && session.start_time
                ? Math.floor((new Date(session.end_time).getTime() - new Date(session.start_time).getTime()) / (1000 * 60))
                : 0;
              
              return {
                minutes: acc.minutes + duration,
                calories: acc.calories + (session.calories_burned || 0),
                distance: acc.distance + (session.distance || 0),
              };
            },
            { minutes: 0, calories: 0, distance: 0 }
          );
        };

        const todayStats = calculateStats(todayData || []);
        const weeklyStats = calculateStats(weeklyData || []);

        setStats({
          todayMinutes: todayStats.minutes,
          todayCalories: todayStats.calories,
          todayDistance: todayStats.distance,
          weeklyMinutes: weeklyStats.minutes,
          weeklyCalories: weeklyStats.calories,
          weeklyDistance: weeklyStats.distance,
          totalSessions: totalSessions || 0,
        });
      } catch (error) {
        console.error('Error fetching walking stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWalkingStats();
  }, [user]);

  const weeklyGoalMinutes = 150; // WHO recommended 150 minutes per week
  const dailyGoalMinutes = 30; // Aim for 30 minutes daily

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-4 animate-pulse">
            <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
            <div className="h-6 bg-muted rounded w-1/2 mb-2"></div>
            <div className="h-2 bg-muted rounded"></div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Walking Statistics</h3>
      
      {/* Today's Progress */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-medium">Today</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-baseline">
              <span className="text-2xl font-bold">{stats.todayMinutes}m</span>
              <span className="text-sm text-muted-foreground">/{dailyGoalMinutes}m</span>
            </div>
            <Progress 
              value={Math.min(100, (stats.todayMinutes / dailyGoalMinutes) * 100)} 
              className="h-2"
            />
            <p className="text-xs text-muted-foreground">
              {stats.todayCalories} calories • {stats.todayDistance.toFixed(1)} mi
            </p>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span className="text-sm font-medium">This Week</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-baseline">
              <span className="text-2xl font-bold">{stats.weeklyMinutes}m</span>
              <span className="text-sm text-muted-foreground">/{weeklyGoalMinutes}m</span>
            </div>
            <Progress 
              value={Math.min(100, (stats.weeklyMinutes / weeklyGoalMinutes) * 100)} 
              className="h-2"
            />
            <p className="text-xs text-muted-foreground">
              {stats.weeklyCalories} calories • {stats.weeklyDistance.toFixed(1)} mi
            </p>
          </div>
        </Card>
      </div>

      {/* Weekly Goal Achievement */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Target className="w-4 h-4 text-purple-500" />
          <span className="text-sm font-medium">Weekly Goal Progress</span>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm">WHO Recommended Activity</span>
            <span className="text-sm font-medium">
              {Math.round((stats.weeklyMinutes / weeklyGoalMinutes) * 100)}%
            </span>
          </div>
          <Progress 
            value={Math.min(100, (stats.weeklyMinutes / weeklyGoalMinutes) * 100)} 
            className="h-3"
          />
          <p className="text-xs text-muted-foreground">
            {weeklyGoalMinutes - stats.weeklyMinutes > 0 
              ? `${weeklyGoalMinutes - stats.weeklyMinutes} minutes left to reach weekly goal`
              : 'Weekly goal achieved! 🎉'
            }
          </p>
        </div>
      </Card>

      {/* Total Achievement */}
      <Card className="p-4 bg-primary/5">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="w-4 h-4 text-orange-500" />
          <span className="text-sm font-medium">Total Achievement</span>
        </div>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-primary">{stats.totalSessions}</p>
            <p className="text-xs text-muted-foreground">Sessions</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-primary">{stats.weeklyCalories}</p>
            <p className="text-xs text-muted-foreground">Week Cal</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-primary">{stats.weeklyDistance.toFixed(1)}</p>
            <p className="text-xs text-muted-foreground">Week Mi</p>
          </div>
        </div>
      </Card>
    </div>
  );
};