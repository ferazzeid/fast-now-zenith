import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Activity, Clock, Zap, Info, Plus, X, Edit } from 'lucide-react';
import { ClickableTooltip } from '@/components/ClickableTooltip';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useWalkingStats } from '@/contexts/WalkingStatsContext';
import { useProfile } from '@/hooks/useProfile';
import { formatDistance } from '@/utils/unitConversions';
import { useManualCalorieBurns } from '@/hooks/useManualCalorieBurns';
import { EditWalkingSessionTimeModal } from '@/components/EditWalkingSessionTimeModal';


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
  is_edited?: boolean;
  original_duration_minutes?: number;
  edit_reason?: string;
}

interface WalkingSessionsBreakdownProps {
  totalCalories: number;
  walkingCalories: number;
  manualCalories: number;
  onRefresh?: () => void;
}

export const WalkingSessionsBreakdown: React.FC<WalkingSessionsBreakdownProps> = ({ 
  totalCalories,
  walkingCalories,
  manualCalories,
  onRefresh 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [completedSessions, setCompletedSessions] = useState<WalkingSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingSession, setEditingSession] = useState<WalkingSession | null>(null);
  const { user } = useAuth();
  const { walkingStats } = useWalkingStats();
  const { profile } = useProfile();
  const { manualBurns, todayTotal: manualCalorieTotal, deleteManualBurn } = useManualCalorieBurns();

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
        .eq('session_state', 'completed')
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

  const formatDistanceForSession = (distance: number | null) => {
    return formatDistance(distance, profile?.units || 'imperial');
  };

  const hasAnySessions = completedSessions.length > 0 || walkingStats.isActive || manualBurns.length > 0;
  const sessionCount = completedSessions.length + (walkingStats.isActive ? 1 : 0) + manualBurns.length;
  
  // Use the totalCalories prop which comes from useDailyDeficitQuery (more accurate)
  const displayCalories = totalCalories;

  const handleDeleteManualBurn = async (burnId: string) => {
    try {
      await deleteManualBurn(burnId);
      // Trigger refresh callback if provided
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error('Failed to delete manual calorie burn:', error);
    }
  };

  const handleSessionEdited = () => {
    fetchTodaySessions();
    if (onRefresh) {
      onRefresh();
    }
  };

  if (!hasAnySessions) {
    return (
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Activity className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-warm-text">Activity Burn</span>
        </div>
        <div className="text-sm font-bold text-warm-text">
          0 cal
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Header with breakdown */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Activity className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-warm-text">Activity Burn</span>
          <ClickableTooltip content="Calories burned from walking and external activities today">
            <Info className="w-4 h-4 text-muted-foreground" />
          </ClickableTooltip>
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
      
      {/* Activity breakdown - always show when we have both types */}
      {(walkingCalories > 0 || manualCalories > 0) && (
        <div className="text-xs text-muted-foreground">
          {walkingCalories > 0 && (
            <span>Walking: {walkingCalories} cal</span>
          )}
          {walkingCalories > 0 && manualCalories > 0 && <span> • </span>}
          {manualCalories > 0 && (
            <span>External: {manualCalories} cal</span>
          )}
        </div>
      )}

      {/* Session breakdown (when expanded) */}
      {isExpanded && sessionCount > 1 && (
        <div className="ml-6 space-y-2">
          {/* Active session (if any) */}
          {walkingStats.isActive && (
            <Card className="p-2 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
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
                {formatDistance(walkingStats.realTimeDistance, profile?.units || 'imperial')} • 
                {walkingStats.realTimeSteps.toLocaleString()} steps
              </div>
            </Card>
          )}

          {/* Completed sessions */}
          {completedSessions.map((session, index) => (
            <Card key={session.id} className="p-2 bg-ceramic-base border border-ceramic-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs font-medium text-warm-text">
                    Session {completedSessions.length - index}
                  </span>
                  {session.is_edited && (
                    <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded">
                      Edited
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {formatTime(session.start_time)} - {session.end_time ? formatTime(session.end_time) : 'Active'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({calculateSessionDuration(session.start_time, session.end_time)}m)
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="text-xs font-bold text-warm-text">
                    {session.calories_burned || 0} cal
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingSession(session)}
                    className="h-4 w-4 p-0 text-muted-foreground hover:text-foreground"
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                </div>
              </div>
              {session.is_edited ? (
                <div className="text-xs text-muted-foreground mt-1">
                  Data removed due to edit
                </div>
              ) : session.distance ? (
                <div className="text-xs text-muted-foreground mt-1">
                  {formatDistanceForSession(session.distance)} • {session.estimated_steps?.toLocaleString() || 0} steps
                </div>
              ) : null}
            </Card>
          ))}

          {/* External Activities */}
          {manualBurns.map((burn, index) => (
            <Card key={burn.id} className="p-2 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Plus className="w-3 h-3 text-blue-600" />
                  <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                    {burn.activity_name}
                  </span>
                  <span className="text-xs text-blue-600 dark:text-blue-400">
                    {new Date(burn.created_at).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true
                    })}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="text-xs font-bold text-blue-700 dark:text-blue-300">
                    {burn.calories_burned} cal
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteManualBurn(burn.id)}
                    className="h-4 w-4 p-0 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Single activity summary */}
      {!isExpanded && sessionCount === 1 && (
        <div className="text-xs text-muted-foreground text-right">
          {walkingStats.isActive ? 'Active session' : manualBurns.length > 0 ? 'External activity' : 'Single session today'}
        </div>
      )}

      {/* Edit Session Modal */}
      {editingSession && (
        <EditWalkingSessionTimeModal
          session={editingSession}
          isOpen={true}
          onClose={() => setEditingSession(null)}
          onSessionEdited={handleSessionEdited}
        />
      )}
    </div>
  );
};