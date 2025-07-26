import { useEffect, useState } from 'react';
import { Calendar, Clock, Zap, MapPin, Gauge } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';

interface WalkingSession {
  id: string;
  start_time: string;
  end_time: string;
  calories_burned?: number;
  distance?: number;
  speed_mph?: number;
  status: string;
}

export const WalkingHistory = () => {
  const [sessions, setSessions] = useState<WalkingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const fetchWalkingSessions = async () => {
      if (!user) return;

      try {
        const limit = showAll ? 50 : 5; // Show only 5 initially, 50 when expanded
        const { data, error } = await supabase
          .from('walking_sessions')
          .select('id, start_time, end_time, calories_burned, distance, speed_mph, status')
          .eq('user_id', user.id)
          .eq('status', 'completed')
          .order('start_time', { ascending: false })
          .limit(limit);

        if (error) throw error;
        setSessions(data || []);
      } catch (error) {
        console.error('Error fetching walking sessions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWalkingSessions();
  }, [user, showAll]);

  const calculateDuration = (startTime: string, endTime: string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const durationMs = end.getTime() - start.getTime();
    const minutes = Math.floor(durationMs / (1000 * 60));
    return minutes;
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Walking History</h3>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="p-4 animate-pulse">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Walking History</h3>
        <Card className="p-6 text-center">
          <MapPin className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No walking sessions yet</p>
          <p className="text-sm text-muted-foreground mt-1">Start your first walk to see your progress here!</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Walking History</h3>
        <Badge variant="secondary">{sessions.length} sessions</Badge>
      </div>
      
      <div className="space-y-3">
        {sessions.map((session) => {
          const duration = calculateDuration(session.start_time, session.end_time);
          const date = new Date(session.start_time);
          
          return (
            <Card key={session.id} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    {format(date, 'MMM d, yyyy')}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {format(date, 'h:mm a')}
                  </span>
                </div>
                <Badge variant="outline" className="text-xs">
                  Completed
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium">{formatDuration(duration)}</p>
                    <p className="text-xs text-muted-foreground">Duration</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-green-500" />
                  <div>
                    <p className="text-sm font-medium">{session.distance?.toFixed(2) || 0} mi</p>
                    <p className="text-xs text-muted-foreground">Distance</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-orange-500" />
                  <div>
                    <p className="text-sm font-medium">{session.calories_burned || 0} cal</p>
                    <p className="text-xs text-muted-foreground">Burned</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-purple-500" />
                  <div>
                    <p className="text-sm font-medium">{session.speed_mph || 3} mph</p>
                    <p className="text-xs text-muted-foreground">Speed</p>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};