import { useEffect, useState } from 'react';
import React from 'react';
import { Calendar, Clock, Zap, MapPin, Gauge, Trash2, X, ChevronDown, ChevronUp, TrendingUp, AlertTriangle, Edit } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useWalkingSession } from '@/hooks/useWalkingSession';
import { EditWalkingSessionTimeModal } from './EditWalkingSessionTimeModal';
import { format } from 'date-fns';
import { useProfile } from '@/hooks/useProfile';
import { formatDistance, formatSpeed } from '@/utils/unitConversions';
import { useStandardizedLoading } from '@/hooks/useStandardizedLoading';
import { ListLoadingSkeleton } from '@/components/LoadingStates';

interface WalkingSession {
  id: string;
  start_time: string;
  end_time: string;
  calories_burned?: number;
  distance?: number;
  speed_mph?: number;
  estimated_steps?: number;
  status: string;
  is_edited?: boolean;
  original_duration_minutes?: number;
  edit_reason?: string;
}

interface WalkingHistoryModalProps {
  onClose: () => void;
}

export const WalkingHistoryModal = ({ onClose }: WalkingHistoryModalProps) => {
  const [sessions, setSessions] = useState<WalkingSession[]>([]);
  const { isLoading, execute } = useStandardizedLoading();
  const [showAll, setShowAll] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteAllModalOpen, setDeleteAllModalOpen] = useState(false);
  const [deleteSessionModalOpen, setDeleteSessionModalOpen] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [collapsedDates, setCollapsedDates] = useState<Set<string>>(new Set());
  const [editingSession, setEditingSession] = useState<WalkingSession | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const { refreshTrigger } = useWalkingSession();
  const { profile } = useProfile();

  useEffect(() => {
    const fetchWalkingSessions = async () => {
      if (!user) return;
      
      await execute(async () => {
        const limit = showAll ? 50 : 5;
        
        // Get the sessions to display
        const { data, error } = await supabase
          .from('walking_sessions')
          .select('id, start_time, end_time, calories_burned, distance, speed_mph, estimated_steps, status, is_edited, original_duration_minutes, edit_reason')
          .eq('user_id', user.id)
          .eq('status', 'completed')
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
          .limit(limit);

        if (error) throw error;
        setSessions(data || []);

        // Check if there are more sessions available
        if (!showAll) {
          const { count } = await supabase
            .from('walking_sessions')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('status', 'completed')
            .is('deleted_at', null);
          
          setHasMore((count || 0) > 5);
        } else {
          setHasMore(false);
        }
        
        return data;
      });
    };

    fetchWalkingSessions();
  }, [user, showAll, refreshTrigger]);

  const handleDeleteSession = async (sessionId: string) => {
    if (!user) return;
    
    setDeletingId(sessionId);
    try {
      const { error } = await supabase
        .from('walking_sessions')
        .delete()
        .eq('id', sessionId)
        .eq('user_id', user.id);

      if (error) throw error;

      setSessions(prev => prev.filter(session => session.id !== sessionId));
      
      toast({
        title: "Session deleted",
        description: "Walking session has been permanently deleted.",
      });
    } catch (error) {
      console.error('Error deleting session:', error);
      toast({
        title: "Error",
        description: "Failed to delete walking session. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const deleteAllHistory = async () => {
    try {
      const { error } = await supabase
        .from('walking_sessions')
        .delete()
        .eq('user_id', user?.id)
        .eq('status', 'completed');

      if (error) throw error;

      setSessions([]);
      setHasMore(false);

      toast({
        title: "History deleted",
        description: "All completed walking sessions have been deleted"
      });
    } catch (error) {
      console.error('Error deleting all history:', error);
      toast({
        title: "Error",
        description: "Failed to delete walking history",
        variant: "destructive"
      });
    }
  };

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

  // Group sessions by date and initialize all dates as collapsed
  const sessionsByDate = sessions.reduce((acc, session) => {
    const date = format(new Date(session.start_time), 'yyyy-MM-dd');
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(session);
    return acc;
  }, {} as Record<string, WalkingSession[]>);

  // Initialize collapsed dates with all dates collapsed by default
  React.useEffect(() => {
    const allDates = Object.keys(sessionsByDate);
    setCollapsedDates(new Set(allDates));
  }, [sessions.length]);

  const toggleDateCollapse = (date: string) => {
    setCollapsedDates(prev => {
      const newSet = new Set(prev);
      if (newSet.has(date)) {
        newSet.delete(date);
      } else {
        newSet.add(date);
      }
      return newSet;
    });
  };

  // Calculate analytics
  const completedSessions = sessions.filter(s => s.status === 'completed');
  const totalSessions = completedSessions.length;
  const totalDistance = completedSessions.reduce((sum, s) => sum + (s.distance || 0), 0);
  const totalCalories = completedSessions.reduce((sum, s) => sum + (s.calories_burned || 0), 0);
  const totalDuration = completedSessions.reduce((sum, s) => 
    sum + calculateDuration(s.start_time, s.end_time), 0
  );
  const avgDuration = totalSessions > 0 ? Math.round(totalDuration / totalSessions) : 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <Card className="w-full max-w-md mx-auto max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <CardHeader className="border-b border-border py-4 px-0 flex-shrink-0">
          <div className="flex justify-between items-center px-6">
            <CardTitle className="text-lg font-semibold">Walking History</CardTitle>
            <div className="flex gap-2">
              {/* Delete All History Button - only show if there are completed sessions */}
              {sessions.length > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                  onClick={() => setDeleteAllModalOpen(true)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={onClose} className="w-8 h-8 rounded-full hover:bg-muted/50 dark:hover:bg-muted/30 hover:scale-110 transition-all duration-200">
                <X className="w-8 h-8" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 overflow-y-auto space-y-4 pt-6">

          {isLoading ? (
            <ListLoadingSkeleton count={3} itemHeight="h-20" />
          ) : sessions.length === 0 ? (
            <Card className="p-6 text-center">
              <MapPin className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No walking sessions yet</p>
              <p className="text-sm text-muted-foreground mt-1">Start your first walk to see your progress here!</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {Object.entries(sessionsByDate)
                .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
                .map(([date, dateSessions]) => {
                  const isCollapsed = collapsedDates.has(date);
                  const displayDate = format(new Date(date), 'MMM d, yyyy');
                  
                  return (
                    <div key={date} className="space-y-2">
                      <div 
                        className="flex items-center justify-between py-2 px-3 bg-muted/20 rounded-lg cursor-pointer hover:bg-muted/30 transition-colors border-0"
                        onClick={() => toggleDateCollapse(date)}
                      >
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium text-sm">{displayDate}</span>
                          <span className="text-xs text-muted-foreground">
                            ({dateSessions.length} session{dateSessions.length > 1 ? 's' : ''})
                          </span>
                        </div>
                        <ChevronDown 
                          className={`w-4 h-4 text-muted-foreground transition-transform ${
                            isCollapsed ? '' : 'rotate-180'
                          }`}
                        />
                      </div>
                      
                      {!isCollapsed && (
                        <div className="space-y-2 ml-4">
                          {dateSessions.map((session) => {
                            const duration = calculateDuration(session.start_time, session.end_time);
                            const sessionTime = new Date(session.start_time);
                            
                            return (
                              <Card key={session.id} className="relative bg-muted/20 border-0">
                                <CardHeader className="pb-4">
                                  <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center justify-between">
                                        <h3 className="font-medium text-sm">
                                          {format(sessionTime, 'h:mm a')}
                                        </h3>
                                      </div>
                                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
                                        <span className="flex items-center gap-1">
                                          <Clock className="w-3 h-3" />
                                          {formatDuration(duration)}
                                          {session.is_edited && (
                                            <span className="text-xs text-muted-foreground/70 ml-1">(Edited)</span>
                                          )}
                                        </span>
                                        <span className="flex items-center gap-1">
                                          <MapPin className="w-3 h-3 text-green-500" />
                                          {session.is_edited ? 'N/A' : formatDistance(session.distance || 0, profile?.units || 'imperial')}
                                        </span>
                                        <span className="flex items-center gap-1">
                                          <Zap className="w-3 h-3 text-orange-500" />
                                          {session.is_edited ? 'N/A' : `${session.calories_burned || 0} cal`}
                                        </span>
                                        <span className="flex items-center gap-1">
                                          <TrendingUp className="w-3 h-3 text-purple-500" />
                                          {session.is_edited ? 'N/A' : `${session.estimated_steps?.toLocaleString() || 'N/A'} steps`}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </CardHeader>
                                
                                {/* Edit and Delete buttons in top right corner */}
                                <div className="absolute top-3 right-3 flex gap-1">
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-6 w-6 p-0"
                                    onClick={() => setEditingSession(session)}
                                  >
                                    <Edit className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                    disabled={deletingId === session.id}
                                    onClick={() => setDeleteSessionModalOpen(session.id)}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                                
                                {session.is_edited && session.edit_reason && (
                                  <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
                                    <span className="font-medium">Edit reason:</span> {session.edit_reason}
                                  </div>
                                )}
                              </Card>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          )}

          {/* Load More / Show Less Button */}
          {(hasMore || showAll) && sessions.length > 0 && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={() => setShowAll(!showAll)}
                className="w-full"
                disabled={isLoading}
              >
                {showAll ? (
                  <>
                    <ChevronUp className="w-4 h-4 mr-2" />
                    Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4 mr-2" />
                    Load More ({hasMore ? 'more available' : 'no more'})
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
        
        {editingSession && (
          <EditWalkingSessionTimeModal
            session={editingSession}
            isOpen={!!editingSession}
            onClose={() => setEditingSession(null)}
            onSessionEdited={() => {
              // Refresh the sessions list
              execute(async () => {
                if (!user) return;
                
                const limit = showAll ? 50 : 5;
                
                const { data, error } = await supabase
                  .from('walking_sessions')
                  .select('id, start_time, end_time, calories_burned, distance, speed_mph, estimated_steps, status, is_edited, original_duration_minutes, edit_reason')
                  .eq('user_id', user.id)
                  .eq('status', 'completed')
                  .is('deleted_at', null)
                  .order('created_at', { ascending: false })
                  .limit(limit);

                if (error) throw error;
                setSessions(data || []);
                
                return data;
              });
            }}
          />
        )}

        <ConfirmationModal
          isOpen={deleteAllModalOpen}
          onClose={() => setDeleteAllModalOpen(false)}
          onConfirm={() => {
            deleteAllHistory();
            setDeleteAllModalOpen(false);
          }}
          title="Delete All Walking History"
          description="Are you sure you want to delete ALL walking history? This will permanently remove all completed sessions. This action cannot be undone."
          confirmText="Delete All History"
          variant="destructive"
        />

        <ConfirmationModal
          isOpen={!!deleteSessionModalOpen}
          onClose={() => setDeleteSessionModalOpen(null)}
          onConfirm={() => {
            if (deleteSessionModalOpen) {
              handleDeleteSession(deleteSessionModalOpen);
              setDeleteSessionModalOpen(null);
            }
          }}
          title="Delete Walking Session"
          description="Are you sure you want to delete this walking session? This action cannot be undone."
          confirmText="Delete"
          variant="destructive"
        />
      </Card>
    </div>
  );
};