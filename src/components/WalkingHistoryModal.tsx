import { useEffect, useState } from 'react';
import { Calendar, Clock, Zap, MapPin, Gauge, Trash2, X, ChevronDown, ChevronUp, TrendingUp, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  estimated_steps?: number;
  status: string;
}

interface WalkingHistoryModalProps {
  onClose: () => void;
}

export const WalkingHistoryModal = ({ onClose }: WalkingHistoryModalProps) => {
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
      
      setLoading(true);

      try {
        const limit = showAll ? 50 : 5;
        
        // Get the sessions to display
        const { data, error } = await supabase
          .from('walking_sessions')
          .select('id, start_time, end_time, calories_burned, distance, speed_mph, estimated_steps, status')
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
      } catch (error) {
        console.error('Error fetching walking sessions:', error);
      } finally {
        setLoading(false);
      }
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
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 px-2 text-destructive hover:bg-destructive/10"
                    >
                      <AlertTriangle className="w-4 h-4 mr-1" />
                      Delete All
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete All Walking History</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete ALL walking history? This will permanently remove all completed sessions. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={deleteAllHistory}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete All History
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              <Button variant="ghost" size="sm" onClick={onClose} className="w-8 h-8 rounded-full hover:bg-muted/50 dark:hover:bg-muted/30 hover:scale-110 transition-all duration-200">
                <X className="w-8 h-8" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 overflow-y-auto space-y-4 pt-6">

          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="p-4 animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </Card>
              ))}
            </div>
          ) : sessions.length === 0 ? (
            <Card className="p-6 text-center">
              <MapPin className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No walking sessions yet</p>
              <p className="text-sm text-muted-foreground mt-1">Start your first walk to see your progress here!</p>
            </Card>
          ) : (
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
                              className="h-6 w-6 p-1 hover:bg-destructive/10 hover:text-destructive"
                              disabled={deletingId === session.id}
                            >
                              <Trash2 className="w-3 h-3" />
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
                        <TrendingUp className="w-4 h-4 text-purple-500" />
                        <div>
                          <p className="text-sm font-medium">
                            {session.estimated_steps?.toLocaleString() || 'N/A'}
                          </p>
                          <p className="text-xs text-muted-foreground">Steps (est.)</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Speed as additional info below the grid */}
                    <div className="mt-3 pt-3 border-t border-border/50">
                      <div className="flex items-center gap-2">
                        <Gauge className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          Average Speed: {session.speed_mph || 3} mph
                        </span>
                      </div>
                    </div>
                  </Card>
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
        </CardContent>
      </Card>
    </div>
  );
};