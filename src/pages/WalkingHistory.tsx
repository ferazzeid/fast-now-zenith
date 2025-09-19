import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Trash2, Edit, Clock, MapPin, Zap, Footprints, Calendar, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ConfirmationModal } from '@/components/ui/universal-modal';
import { EditWalkingSessionTimeModal } from '@/components/EditWalkingSessionTimeModal';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { SEOManager } from '@/components/SEOManager';
import { useStandardizedLoading } from '@/hooks/useStandardizedLoading';
import { useOptimizedWalkingSession } from '@/hooks/optimized/useOptimizedWalkingSession';

interface WalkingSession {
  id: string;
  start_time: string;
  end_time?: string | null;
  distance?: number | null;
  calories_burned?: number | null;
  status?: string;
  session_state?: string;
  speed_mph?: number;
  estimated_steps?: number;
  user_id?: string;
  created_at?: string;
  isEditing?: boolean;
}

const WalkingHistory = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: sessions, isLoading, execute: fetchSessions } = useStandardizedLoading<WalkingSession[]>([]);
  const { activeSession } = useOptimizedWalkingSession();
  const [showAll, setShowAll] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [editingSession, setEditingSession] = useState<WalkingSession | null>(null);

  useEffect(() => {
    if (user) {
      loadSessions();
    }
  }, [user, showAll]);

  const loadSessions = async () => {
    if (!user) return;
    
    await fetchSessions(async () => {
      const limit = showAll ? 100 : 10;
      
      const { data, error } = await supabase
        .from('walking_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('start_time', { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Keep all sessions, including those under 1 minute (will be marked as canceled)
      const filteredData = data || [];

      // Check if there are more sessions available
      if (!showAll && filteredData.length >= 10) {
        const { count } = await supabase
          .from('walking_sessions')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'completed');
        
        setHasMore((count || 0) > 10);
      } else {
        setHasMore(false);
      }

      return filteredData;
    }, {
      onError: (error) => {
        console.error('Error fetching walking sessions:', error);
        toast({
          variant: "destructive",
          title: "Error", 
          description: "Failed to load walking history"
        });
      }
    });
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('walking_sessions')
        .delete()
        .eq('id', sessionId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Remove the session from local state
      if (sessions) {
        await loadSessions();
      }
      
      toast({
        title: "Session Deleted",
        description: "Walking session has been removed from your history"
      });
    } catch (error) {
      console.error('Error deleting session:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete walking session"
      });
    } finally {
      setDeletingId(null);
    }
  };

  const calculateDuration = (startTime: string, endTime: string): number => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    return Math.round((end.getTime() - start.getTime()) / (1000 * 60));
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${remainingMinutes}m`;
    }
    return `${remainingMinutes}m`;
  };

  const isSessionCanceled = (session: WalkingSession): boolean => {
    if (!session.end_time) return false;
    const duration = calculateDuration(session.start_time, session.end_time);
    return duration < 1;
  };

  const groupSessionsByDate = (sessions: WalkingSession[]) => {
    const groups: { [key: string]: WalkingSession[] } = {};
    
    // Add active session to today's date if it exists
    if (activeSession) {
      const today = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      if (!groups[today]) {
        groups[today] = [];
      }
      // Convert the optimized session to our local interface
      const convertedSession: WalkingSession = {
        ...activeSession,
        status: 'active',
        end_time: activeSession.end_time || null,
        distance: activeSession.distance || null,
        calories_burned: activeSession.calories_burned || null,
      };
      groups[today].push(convertedSession);
    }
    
    // Add completed sessions
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

  if (isLoading) {
    return (
      <div className="relative min-h-screen bg-background p-4 overflow-x-hidden">
        <div className="max-w-md mx-auto pt-16 pb-32">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Walking History</h1>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/walking')}
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

  const groupedSessions = groupSessionsByDate(sessions || []);

  return (
    <div className="relative min-h-screen bg-background p-4 overflow-x-hidden">
      <SEOManager />
      
      <div className="max-w-md mx-auto pt-16 pb-32">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Walking History</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/walking')}
            className="w-8 h-8 rounded-full hover:bg-muted/50 dark:hover:bg-muted/30 hover:scale-110 transition-all duration-200"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {(!sessions || sessions.length === 0) && !activeSession ? (
          <div className="text-center py-12">
            <Footprints className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Walking Sessions Yet</h3>
            <p className="text-muted-foreground mb-4">
              Start your first walking session to build your history
            </p>
            <Button onClick={() => navigate('/walking')}>
              Start Walking
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedSessions).map(([date, daySessions]) => (
              <div key={date}>
                <div className="flex items-center gap-2 mb-3 sticky top-0 bg-background/80 backdrop-blur-sm py-2 z-10">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <h2 className="font-semibold text-sm">{date}</h2>
                  <div className="flex-1 border-t-subtle" />
                </div>
                
                <div className="space-y-3 ml-6">
                  {daySessions.map((session) => {
                    const isActiveSession = session.status === 'active' || session.session_state === 'active';
                    
                    return (
                      <Card key={session.id} className={`overflow-hidden ${isActiveSession ? 'border-primary/50 bg-primary/5' : ''}`}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-2">
                              <div>
                                 <p className="text-xs text-muted-foreground">
                                   {new Date(session.start_time).toLocaleTimeString('en-US', {
                                     hour: '2-digit',
                                     minute: '2-digit'
                                   })}
                                   {session.end_time && !isSessionCanceled(session) && ` - ${new Date(session.end_time).toLocaleTimeString('en-US', {
                                     hour: '2-digit',
                                     minute: '2-digit'
                                   })}`}
                                 </p>
                              </div>
                               {isSessionCanceled(session) && (
                                 <Badge variant="secondary" className="text-xs">
                                   <X className="w-3 h-3 mr-1" />
                                   Canceled
                                 </Badge>
                               )}
                               {isActiveSession && (
                                 <Badge variant="secondary" className="text-xs flex items-center gap-1">
                                   <Play className="w-3 h-3" />
                                   In Progress
                                 </Badge>
                               )}
                            </div>
                             {!isActiveSession && (
                               <div className="flex gap-1">
                                 {!isSessionCanceled(session) && (
                                   <Button
                                     variant="ghost"
                                     size="icon"
                                     className="w-8 h-8"
                                     onClick={() => setEditingSession(session)}
                                   >
                                     <Edit className="w-3 h-3" />
                                   </Button>
                                 )}
                                 <Button
                                   variant="ghost"
                                   size="icon"
                                   className="w-8 h-8 text-destructive hover:text-destructive"
                                   onClick={() => setDeletingId(session.id)}
                                 >
                                   <Trash2 className="w-3 h-3" />
                                 </Button>
                               </div>
                             )}
                          </div>

                           {isSessionCanceled(session) ? (
                             <div className="flex items-center gap-2 text-sm text-muted-foreground">
                               <X className="w-4 h-4" />
                               <p>Session was canceled after less than 1 minute</p>
                             </div>
                           ) : (
                             <div className="grid grid-cols-2 gap-4 text-sm">
                               <div className="flex items-center gap-2">
                                 <Clock className="w-4 h-4 text-muted-foreground" />
                                 <div>
                                   <p className="text-xs text-muted-foreground">Duration</p>
                                   <p className="font-medium">
                                     {session.end_time 
                                       ? formatDuration(calculateDuration(session.start_time, session.end_time))
                                       : 'In Progress'
                                     }
                                   </p>
                                 </div>
                               </div>
                               <div className="flex items-center gap-2">
                                 <MapPin className="w-4 h-4 text-muted-foreground" />
                                 <div>
                                   <p className="text-xs text-muted-foreground">Distance</p>
                                   <p className="font-medium">
                                     {session.distance && session.distance > 0 ? session.distance.toFixed(2) : '0.00'} km
                                   </p>
                                 </div>
                               </div>
                               <div className="flex items-center gap-2">
                                 <Zap className="w-4 h-4 text-muted-foreground" />
                                 <div>
                                   <p className="text-xs text-muted-foreground">Calories</p>
                                   <p className="font-medium">
                                     {session.calories_burned && session.calories_burned > 0 ? Math.round(session.calories_burned) : '0'}
                                   </p>
                                 </div>
                               </div>
                               <div className="flex items-center gap-2">
                                 <Footprints className="w-4 h-4 text-muted-foreground" />
                                 <div>
                                   <p className="text-xs text-muted-foreground">Steps</p>
                                   <p className="font-medium">
                                     {session.estimated_steps && session.estimated_steps > 0 ? session.estimated_steps.toLocaleString() : '0'}
                                   </p>
                                 </div>
                               </div>
                             </div>
                           )}
                        </CardContent>
                      </Card>
                    );
                  })}
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

            {showAll && sessions.length > 10 && (
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
        <ConfirmationModal
          isOpen={!!deletingId}
          onClose={() => setDeletingId(null)}
          onConfirm={() => deletingId && handleDeleteSession(deletingId)}
          title="Delete Walking Session"
          message="Are you sure you want to delete this walking session? This action cannot be undone."
          confirmText="Delete"
          variant="destructive"
        />

        {/* Edit Session Time Modal */}
        {editingSession && (
          <EditWalkingSessionTimeModal
            session={editingSession}
            isOpen={!!editingSession}
            onClose={() => setEditingSession(null)}
            onSessionEdited={() => {
              loadSessions(); // Refresh the list
              setEditingSession(null);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default WalkingHistory;