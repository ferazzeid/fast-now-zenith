import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Activity, Clock, Zap, Info } from 'lucide-react';
import { ClickableTooltip } from '@/components/ClickableTooltip';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useWalkingStats } from '@/contexts/WalkingStatsContext';
import { useProfile } from '@/hooks/useProfile';


interface WalkingSession {
  id: string;
  start_time: string;
  end_time: string | null;
  status: string;
  calories_burned: number | null;
  distance: number | null;
  speed_mph: number | null;
  estimated_steps: number | null;
  session_state: string | null;
}

interface WalkingSessionsBreakdownProps {
  totalCalories: number;
  onRefresh?: () => void;
}

export const WalkingSessionsBreakdown: React.FC<WalkingSessionsBreakdownProps> = ({ 
  totalCalories, 
  onRefresh 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [completedSessions, setCompletedSessions] = useState<WalkingSession[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { walkingStats } = useWalkingStats();
  const { profile } = useProfile();

  const fetchTodaySessions = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      
      const { data: sessions } = await supabase
        .from('walking_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .gte('start_time', startOfDay.toISOString())
        .lt('start_time', new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000).toISOString())
        .order('start_time', { ascending: false });
      
      setCompletedSessions(sessions || []);
    } catch (error) {
      console.error('Error fetching walking sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodaySessions();
  }, [user]);

  // Refresh when walking stats change (session ends, etc.)
  useEffect(() => {
    if (!walkingStats.isActive && walkingStats.currentSessionId === null) {
      // Session just ended - refresh the list
      setTimeout(() => fetchTodaySessions(), 1000);
    }
  }, [walkingStats.isActive, walkingStats.currentSessionId]);

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const calculateSessionDuration = (startTime: string, endTime: string | null) => {
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const durationMs = end.getTime() - start.getTime();
    return Math.floor(durationMs / 1000 / 60); // Duration in minutes
  };

  const formatDistance = (distance: number | null) => {
    if (!distance) return '0';
    const unit = profile?.units === 'metric' ? 'km' : 'mi';
    return `${distance.toFixed(2)} ${unit}`;
  };

  const hasAnySessions = completedSessions.length > 0 || walkingStats.isActive;
  const sessionCount = completedSessions.length + (walkingStats.isActive ? 1 : 0);

  if (!hasAnySessions) {
    return (
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Activity className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-warm-text">Walking Burn</span>
        </div>
        <div className="text-sm font-bold text-warm-text">
          0 cal
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Header with total and expand button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Activity className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-warm-text">Walking Burn</span>
          <ClickableTooltip content="Total calories burned from walking today (includes active sessions)">
            <Info className="w-4 h-4 text-muted-foreground" />
          </ClickableTooltip>
          {sessionCount > 1 && (
            <span className="text-xs text-muted-foreground">
              ({sessionCount} session{sessionCount > 1 ? 's' : ''})
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <div className="text-sm font-bold text-warm-text">
            {Math.round(totalCalories)} cal
          </div>
          {sessionCount > 1 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-6 w-6 p-0"
            >
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Session breakdown (when expanded) */}
      {isExpanded && sessionCount > 1 && (
        <div className="ml-6 space-y-2">
          {/* Active session (if any) */}
          {walkingStats.isActive && (
            <Card className="p-2 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-xs font-medium text-green-700 dark:text-green-300">
                    Active Session
                  </span>
                  <span className="text-xs text-green-600 dark:text-green-400">
                    {Math.floor(walkingStats.timeElapsed / 60)}m {walkingStats.timeElapsed % 60}s
                    {walkingStats.isPaused && ' (Paused)'}
                  </span>
                </div>
                <div className="text-xs font-bold text-green-700 dark:text-green-300">
                  {Math.round(walkingStats.realTimeCalories)} cal
                </div>
              </div>
              <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                {walkingStats.realTimeDistance.toFixed(2)} {profile?.units === 'metric' ? 'km' : 'mi'} • 
                {walkingStats.realTimeSteps.toLocaleString()} steps
              </div>
            </Card>
          )}

          {/* Completed sessions */}
          {completedSessions.map((session, index) => (
            <Card key={session.id} className="p-2 bg-ceramic-base border-ceramic-rim">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs font-medium text-warm-text">
                    Session {completedSessions.length - index}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatTime(session.start_time)} - {session.end_time ? formatTime(session.end_time) : 'Active'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({calculateSessionDuration(session.start_time, session.end_time)}m)
                  </span>
                </div>
                <div className="text-xs font-bold text-warm-text">
                  {session.calories_burned || 0} cal
                </div>
              </div>
              {session.distance && (
                <div className="text-xs text-muted-foreground mt-1">
                  {formatDistance(session.distance)} • {session.estimated_steps?.toLocaleString() || 0} steps
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Single session summary */}
      {!isExpanded && sessionCount === 1 && (
        <div className="text-xs text-muted-foreground text-right">
          {walkingStats.isActive ? 'Active session' : 'Single session today'}
        </div>
      )}
    </div>
  );
};