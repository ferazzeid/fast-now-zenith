import { useEffect, useState } from 'react';
import { Calendar, Clock, Zap, MapPin, Gauge, Trash2, ChevronDown, ChevronUp, TrendingUp, Edit3 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useWalkingSession } from '@/hooks/useWalkingSession';
import { useUnifiedCacheManager } from '@/hooks/useUnifiedCacheManager';
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
  duration_minutes?: number;
}

export const WalkingHistory = () => {
  const { data: sessions, isLoading, execute } = useStandardizedLoading<WalkingSession[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [editingSession, setEditingSession] = useState<WalkingSession | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const { refreshTrigger } = useWalkingSession();
  const { clearWalkingCache } = useUnifiedCacheManager();
  const { profile } = useProfile();

  useEffect(() => {
    fetchWalkingSessions();
  }, [user, showAll, refreshTrigger]);

  const fetchWalkingSessions = async () => {
    if (!user) return;
    
    console.log('Fetching walking sessions, refreshTrigger:', refreshTrigger);

    await execute(async () => {
      const limit = showAll ? 50 : 5; // Show only 5 initially, 50 when expanded
      
      // First, get the sessions to display
      const { data, error } = await supabase
        .from('walking_sessions')
        .select('id, start_time, end_time, calories_burned, distance, speed_mph, estimated_steps, status, is_edited, original_duration_minutes, edit_reason')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .is('deleted_at', null) // Only get non-deleted sessions
        .order('created_at', { ascending: false }) // Changed from start_time to created_at for more recent results
        .limit(limit);

      if (error) throw error;
      console.log('Walking sessions fetched:', data?.length || 0);

      // Show all sessions, including those under 1 minute (will be marked as canceled)
      const filteredData = data || [];

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

      return filteredData;
    });

    // Force immediate refresh when refreshTrigger changes
    if (refreshTrigger > 0) {
      console.log('Forcing refresh due to trigger change');
    }
  };

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

      // Remove the session from the local state
      execute(async () => sessions?.filter(session => session.id !== sessionId) || []);
      
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

  const isSessionCanceled = (session: WalkingSession) => {
    if (!session.end_time) return false;
    const duration = calculateDuration(session.start_time, session.end_time);
    return duration < 1;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <ListLoadingSkeleton count={3} itemHeight="h-20" />
      </div>
    );
  }

  if (!sessions || sessions.length === 0) {
    return (
      <div className="space-y-4">
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
        <Badge variant="outline" className="text-xs text-muted-foreground bg-muted/30">{sessions?.length || 0} sessions</Badge>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => {
            console.log('Manual refresh triggered');
            clearWalkingCache();
          }}
          className="h-6 px-2 text-xs text-muted-foreground hover:text-primary"
        >
          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </Button>
      </div>
      
      <div className="space-y-3">
        {sessions?.map((session) => {
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
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {isSessionCanceled(session) ? 'Canceled' : 'Completed'}
                  </Badge>
                  {session.is_edited && !isSessionCanceled(session) && (
                    <Badge variant="secondary" className="text-xs">
                      <Clock className="w-2.5 h-2.5 mr-1" />
                      Edited
                    </Badge>  
                  )}
                  {!isSessionCanceled(session) && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-1 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                      onClick={() => setEditingSession(session)}
                    >
                      <Edit3 className="w-3 h-3" />
                    </Button>
                  )}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 w-6 p-1 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    disabled={deletingId === session.id}
                    onClick={() => setShowDeleteModal(session.id)}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
              
              {isSessionCanceled(session) ? (
                <div className="text-sm text-muted-foreground py-2">
                  Session was canceled after less than 1 minute
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{formatDuration(duration)}</p>
                      <p className="text-xs text-muted-foreground">Duration</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-green-500" />
                    <div>
                      <p className="text-sm font-medium">
                        {session.is_edited ? 'Data removed' : formatDistance(session.distance || 0, profile?.units || 'imperial')}
                      </p>
                      <p className="text-xs text-muted-foreground">Distance</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-orange-500" />
                    <div>
                      <p className="text-sm font-medium">
                        {session.is_edited ? 'Data removed' : `${Math.round(session.calories_burned || 0)} cal`}
                      </p>
                      <p className="text-xs text-muted-foreground">Burned</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-purple-500" />
                    <div>
                      <p className="text-sm font-medium">
                        {session.is_edited ? 'Data removed' : (session.estimated_steps?.toLocaleString() || '0')}
                      </p>
                      <p className="text-xs text-muted-foreground">Steps (est.)</p>
                    </div>
                  </div>
                  
                  {session.is_edited && session.edit_reason && (
                    <div className="col-span-2 mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
                      <span className="font-medium">Edit reason:</span> {session.edit_reason}
                    </div>
                  )}
                </div>
              )}
              

            </Card>
          );
        })}
      </div>

      {/* Load More / Show Less Button */}
      {(hasMore || showAll) && (
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

      <ConfirmationModal
        isOpen={!!showDeleteModal}
        onClose={() => setShowDeleteModal(null)}
        onConfirm={() => {
          if (showDeleteModal) {
            handleDeleteSession(showDeleteModal);
            setShowDeleteModal(null);
          }
        }}
        title="Delete Walking Session"
        description={`Are you sure you want to delete this walking session from ${showDeleteModal ? format(new Date(sessions?.find(s => s.id === showDeleteModal)?.start_time || ''), 'MMM d, yyyy') : ''}? This action cannot be undone.`}
        confirmText="Delete"
        variant="destructive"
        isLoading={!!deletingId}
      />

      {editingSession && (
        <EditWalkingSessionTimeModal
          session={editingSession}
          isOpen={!!editingSession}
          onClose={() => setEditingSession(null)}
          onSessionEdited={() => {
            // Trigger refresh of walking sessions
            clearWalkingCache();
            // Force refresh by calling fetchWalkingSessions again
            fetchWalkingSessions();
          }}
        />
      )}
    </div>
  );
};