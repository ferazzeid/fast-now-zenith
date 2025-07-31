import { useEffect, useState } from 'react';
import { Calendar, Clock, Zap, MapPin, Gauge, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useWalkingSession } from '@/hooks/useWalkingSession';
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
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const { refreshTrigger } = useWalkingSession();

  useEffect(() => {
    const fetchWalkingSessions = async () => {
      if (!user) return;
      
      console.log('Fetching walking sessions, refreshTrigger:', refreshTrigger);
      setLoading(true);

      try {
        const limit = showAll ? 50 : 5; // Show only 5 initially, 50 when expanded
        
        // First, get the sessions to display
        const { data, error } = await supabase
          .from('walking_sessions')
          .select('id, start_time, end_time, calories_burned, distance, speed_mph, status')
          .eq('user_id', user.id)
          .eq('status', 'completed')
          .is('deleted_at', null) // Only get non-deleted sessions
          .order('created_at', { ascending: false }) // Changed from start_time to created_at for more recent results
          .limit(limit);

        if (error) throw error;
        setSessions(data || []);
        console.log('Walking sessions fetched:', data?.length || 0);

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
      } catch (error) {
        console.error('Error fetching walking sessions:', error);
      } finally {
        setLoading(false);
      }
    };

    // Force immediate refresh when refreshTrigger changes
    if (refreshTrigger > 0) {
      console.log('Forcing refresh due to trigger change');
      setLoading(true);
      setSessions([]); // Clear existing sessions to force visual refresh
    }
    fetchWalkingSessions();
  }, [user, showAll, refreshTrigger]);

  const handleDeleteSession = async (sessionId: string) => {
    if (!user) return;
    
    setDeletingId(sessionId);
    try {
      const { error } = await supabase
        .from('walking_sessions')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', sessionId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Remove the session from the local state
      setSessions(prev => prev.filter(session => session.id !== sessionId));
      
      toast({
        title: "Session deleted",
        description: "Walking session has been removed from your history.",
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

  if (loading) {
    return (
      <div className="space-y-4">
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
        <Badge variant="outline" className="text-xs text-muted-foreground bg-muted/30">{sessions.length} sessions</Badge>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => {
            console.log('Manual refresh triggered');
            window.location.reload();
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
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    Completed
                  </Badge>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                        disabled={deletingId === session.id}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Walking Session</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this walking session from {format(date, 'MMM d, yyyy')}? 
                          This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteSession(session.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
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

      {/* Load More / Show Less Button */}
      {(hasMore || showAll) && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => setShowAll(!showAll)}
            className="w-full"
            disabled={loading}
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
    </div>
  );
};