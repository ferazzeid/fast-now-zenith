import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Clock, Calendar, Trash2, Edit, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { SEOManager } from '@/components/SEOManager';

interface FastingSession {
  id: string;
  start_time: string;
  end_time: string | null;
  goal_duration_seconds: number;
  status: 'active' | 'completed' | 'stopped';
  created_at: string;
}

const FastingHistory = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [sessions, setSessions] = useState<FastingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    if (user) {
      fetchFastingSessions();
    }
  }, [user, showAll]);

  const fetchFastingSessions = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const limit = showAll ? 100 : 15;
      
      const { data, error } = await supabase
        .from('fasting_sessions')
        .select('*')
        .eq('user_id', user.id)
        .neq('status', 'active')
        .order('start_time', { ascending: false })
        .limit(limit);

      if (error) throw error;

      setSessions((data || []) as FastingSession[]);
      
      if (!showAll && data && data.length >= 15) {
        const { count } = await supabase
          .from('fasting_sessions')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .neq('status', 'active');
        
        setHasMore((count || 0) > 15);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error fetching fasting sessions:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load fasting history"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('fasting_sessions')
        .delete()
        .eq('id', sessionId)
        .eq('user_id', user.id);

      if (error) throw error;

      setSessions(sessions.filter(session => session.id !== sessionId));
      toast({
        title: "Fasting Session Deleted",
        description: "Fasting session has been removed from your history"
      });
    } catch (error) {
      console.error('Error deleting fasting session:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete fasting session"
      });
    } finally {
      setDeletingId(null);
    }
  };

  const calculateDuration = (startTime: string, endTime: string | null): number => {
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 1000)) / 1000;
  };

  const formatDuration = (hours: number): string => {
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    
    if (wholeHours > 0) {
      return minutes > 0 ? `${wholeHours}h ${minutes}m` : `${wholeHours}h`;
    }
    return `${minutes}m`;
  };

  const getSessionStatusColor = (session: FastingSession) => {
    if (session.status === 'completed') {
      const duration = calculateDuration(session.start_time, session.end_time);
      return duration >= (session.goal_duration_seconds / 3600) ? 'text-green-600' : 'text-yellow-600';
    }
    return 'text-red-600';
  };

  const getSessionStatusText = (session: FastingSession) => {
    if (session.status === 'completed') {
      const duration = calculateDuration(session.start_time, session.end_time);
      return duration >= (session.goal_duration_seconds / 3600) ? 'Goal Achieved' : 'Completed Early';
    }
    return 'Stopped';
  };

  const groupSessionsByDate = (sessions: FastingSession[]) => {
    const groups: { [key: string]: FastingSession[] } = {};
    
    sessions.forEach(session => {
      const date = new Date(session.start_time).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(session);
    });
    
    return groups;
  };

  if (loading) {
    return (
      <div className="relative min-h-screen bg-background p-4 overflow-x-hidden">
        <div className="max-w-md mx-auto pt-16 pb-32">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Fasting History</h1>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
              className="w-8 h-8 rounded-full hover:bg-muted/50 dark:hover:bg-muted/30 hover:scale-110 transition-all duration-200"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const groupedSessions = groupSessionsByDate(sessions);

  return (
    <div className="relative min-h-screen bg-background p-4 overflow-x-hidden">
      <SEOManager />
      
      <div className="max-w-md mx-auto pt-16 pb-32">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Fasting History</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
            className="w-8 h-8 rounded-full hover:bg-muted/50 dark:hover:bg-muted/30 hover:scale-110 transition-all duration-200"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {sessions.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Fasting Sessions Yet</h3>
            <p className="text-muted-foreground mb-4">
              Start your first fast to build your history
            </p>
            <Button onClick={() => navigate('/')}>
              Start Fasting
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedSessions).map(([date, daySessions]) => (
              <div key={date}>
                <div className="flex items-center gap-2 mb-3 sticky top-0 bg-background/80 backdrop-blur-sm py-2 z-10">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <h2 className="font-semibold text-sm">{date}</h2>
                  <div className="flex-1 border-t border-border" />
                </div>
                
                <div className="space-y-3 ml-6">
                  {daySessions.map((session) => (
                    <Card key={session.id} className="overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-sm">
                                {session.goal_duration_seconds / 3600}h Fast
                              </h3>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${getSessionStatusColor(session)} bg-current/10`}>
                                {getSessionStatusText(session)}
                              </span>
                              {session.status === 'completed' && 
                               calculateDuration(session.start_time, session.end_time) >= (session.goal_duration_seconds / 3600) && (
                                <Trophy className="w-4 h-4 text-yellow-500" />
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Started: {new Date(session.start_time).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                              {session.end_time && ` • Ended: ${new Date(session.end_time).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}`}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-8 h-8 text-destructive hover:text-destructive"
                            onClick={() => setDeletingId(session.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">Duration</p>
                              <p className="font-medium">
                                {formatDuration(calculateDuration(session.start_time, session.end_time))}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Trophy className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">Goal</p>
                              <p className="font-medium">{session.goal_duration_seconds / 3600}h</p>
                            </div>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mt-3">
                          <div className="flex justify-between text-xs text-muted-foreground mb-1">
                            <span>Progress</span>
                            <span>
                              {Math.round((calculateDuration(session.start_time, session.end_time) / (session.goal_duration_seconds / 3600)) * 100)}%
                            </span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all duration-200 ${
                                calculateDuration(session.start_time, session.end_time) >= (session.goal_duration_seconds / 3600) 
                                  ? 'bg-green-500' 
                                  : 'bg-primary'
                              }`}
                              style={{
                                width: `${Math.min(100, (calculateDuration(session.start_time, session.end_time) / (session.goal_duration_seconds / 3600)) * 100)}%`
                              }}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}

            {/* Load More / Show Less */}
            {hasMore && !showAll && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowAll(true)}
              >
                Load More Sessions
              </Button>
            )}

            {showAll && sessions.length > 15 && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowAll(false)}
              >
                Show Less
              </Button>
            )}
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Fasting Session</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this fasting session? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deletingId && handleDeleteSession(deletingId)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

export default FastingHistory;