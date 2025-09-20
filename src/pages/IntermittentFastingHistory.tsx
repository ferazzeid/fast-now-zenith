import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Clock, Calendar, CheckCircle, XCircle, Trophy, Edit, Trash2, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useIntermittentFasting } from '@/hooks/useIntermittentFasting';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { EditIntermittentFastingModal } from '@/components/EditIntermittentFastingModal';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

const IntermittentFastingHistory = () => {
  const navigate = useNavigate();
  const { history, historyLoading, refreshHistory } = useIntermittentFasting();
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteSessionId, setDeleteSessionId] = useState<string | null>(null);
  const [deleteAllModalOpen, setDeleteAllModalOpen] = useState(false);
  const { toast } = useToast();

  const formatDuration = (hours: number) => {
    return `${hours}h`;
  };

  const getSessionStatusColor = (session: any, isLatestInDay: boolean) => {
    // If it's explicitly canceled, show as canceled
    if (session.status === 'cancelled') return 'text-red-600 dark:text-red-400';
    
    // If it's completed, show as completed
    if (session.status === 'completed' && session.completed) {
      return 'text-green-600 dark:text-green-400';
    }
    
    // If it's incomplete, show as warning/orange
    if (session.status === 'incomplete') {
      return 'text-orange-600 dark:text-orange-400';
    }
    
    // If it's active (in progress), show as in progress
    if (session.status === 'active' || session.status === 'fasting' || session.status === 'eating') {
      return 'text-info-foreground dark:text-info-foreground';
    }
    
    // Default fallback for unknown states
    return 'text-red-600 dark:text-red-400';
  };

  const getSessionStatusText = (session: any, isLatestInDay: boolean) => {
    // If it's explicitly canceled, show as canceled
    if (session.status === 'cancelled') return 'Cancelled';
    
    // If it's completed, show as completed
    if (session.status === 'completed' && session.completed) {
      return 'Completed';
    }
    
    // If it's incomplete, show as incomplete
    if (session.status === 'incomplete') {
      return 'Incomplete';
    }
    
    // If it's active (in progress), show as in progress
    if (session.status === 'active') {
      return 'In Progress';
    }
    
    // Legacy status handling
    if (session.status === 'fasting' || session.status === 'eating') {
      return session.status === 'fasting' ? 'Fasting' : 'Eating';
    }
    
    // Default fallback for unknown states
    return 'Cancelled';
  };

  const getSessionStatusIcon = (session: any, isLatestInDay: boolean) => {
    // If it's explicitly canceled, show as canceled
    if (session.status === 'cancelled') return <XCircle className="w-3 h-3" />;
    
    // If it's completed, show as completed
    if (session.status === 'completed' && session.completed) {
      return <CheckCircle className="w-3 h-3" />;
    }
    
    // If it's incomplete, show warning triangle
    if (session.status === 'incomplete') {
      return <Clock className="w-3 h-3" />;
    }
    
    // If it's active (in progress) or legacy statuses, show as in progress
    if (session.status === 'active' || session.status === 'fasting' || session.status === 'eating') {
      return <Clock className="w-3 h-3" />;
    }
    
    // Default fallback for unknown states
    return <XCircle className="w-3 h-3" />;
  };

  const handleEditSession = (session: any) => {
    setSelectedSession(session);
    setEditModalOpen(true);
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('intermittent_fasting_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;

      await refreshHistory();
      toast({
        title: "Session Deleted",
        description: "Intermittent fasting session has been deleted successfully.",
      });
    } catch (error) {
      console.error('Error deleting IF session:', error);
      toast({
        title: "Error",
        description: "Failed to delete intermittent fasting session.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAllHistory = async () => {
    try {
      const { error } = await supabase
        .from('intermittent_fasting_sessions')
        .delete()
        .neq('status', 'active'); // Don't delete active sessions

      if (error) throw error;

      await refreshHistory();
      toast({
        title: "History Deleted",
        description: "All non-active intermittent fasting sessions have been deleted.",
      });
    } catch (error) {
      console.error('Error deleting all IF history:', error);
      toast({
        title: "Error", 
        description: "Failed to delete intermittent fasting history.",
        variant: "destructive",
      });
    }
  };

  const getSuccessRate = () => {
    if (!history || history.length === 0) return 0;
    const completedSessions = history.filter(s => s.status === 'completed');
    const nonActiveSessions = history.filter(s => s.status !== 'active');
    return nonActiveSessions.length > 0 ? Math.round((completedSessions.length / nonActiveSessions.length) * 100) : 0;
  };

  const getAverageHours = () => {
    if (!history || history.length === 0) return 0;
    const completedSessions = history.filter(s => s.status === 'completed');
    if (completedSessions.length === 0) return 0;
    const totalHours = completedSessions.reduce((sum, session) => sum + session.fasting_window_hours, 0);
    return Math.round(totalHours / completedSessions.length);
  };

  const groupSessionsByDate = (sessions: any[]) => {
    const groups: { [key: string]: any[] } = {};
    
    sessions.forEach(session => {
      const date = new Date(session.session_date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(session);
    });
    
    // Sort sessions within each day by creation time (newest first)
    Object.keys(groups).forEach(date => {
      groups[date].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    });
    
    return groups;
  };

  if (historyLoading) {
    return (
      <div className="relative min-h-screen bg-background p-4 overflow-x-hidden">
        <div className="max-w-md mx-auto pt-16 pb-32">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Fasting History</h1>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/intermittent-fasting')}
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

  const groupedSessions = groupSessionsByDate(history || []);

  return (
    <div className="relative min-h-screen bg-background p-4 overflow-x-hidden">
      <div className="max-w-md mx-auto pt-16 pb-32">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Fasting History</h1>
          <div className="flex gap-2">
            {history && history.filter(s => s.status !== 'active').length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDeleteAllModalOpen(true)}
                className="w-8 h-8 rounded-full hover:bg-muted/50 dark:hover:bg-muted/30 text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/intermittent-fasting')}
              className="w-8 h-8 rounded-full hover:bg-muted/50 dark:hover:bg-muted/30 hover:scale-110 transition-all duration-200"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Stats Section */}
        {history && history.length > 0 && (
          <div className="grid grid-cols-2 gap-4 mb-6">
            <Card className="p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <TrendingUp className="w-4 h-4" />
                Success Rate
              </div>
              <div className="text-2xl font-bold">{getSuccessRate()}%</div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Clock className="w-4 h-4" />
                Avg. Fasting
              </div>
              <div className="text-2xl font-bold">{getAverageHours()}h</div>
            </Card>
          </div>
        )}

        {!history || history.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Fasting Sessions Yet</h3>
            <p className="text-muted-foreground mb-4">
              Start your first intermittent fasting session to build your history
            </p>
            <Button onClick={() => navigate('/intermittent-fasting')}>
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
                  <div className="flex-1 border-t-subtle" />
                </div>
                
                <div className="space-y-3 ml-6">
                  {daySessions.map((session, index) => {
                    const isLatestInDay = index === 0; // Since we sort by creation time (newest first)
                    return (
                      <div key={session.id} className="group">
                      <Card key={session.id} className="overflow-hidden relative">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3 flex-1">
                              <div className="flex-1">
                                <h3 className="font-semibold flex items-center gap-2">
                                  {session.fasting_window_hours}:{session.eating_window_hours} Schedule
                                  {isLatestInDay && daySessions.length > 1 && (
                                    <Badge variant="secondary" className="text-xs">Latest</Badge>
                                  )}
                                  {session.is_edited && (
                                    <Badge variant="outline" className="text-xs">Edited</Badge>
                                  )}
                                </h3>
                                {session.fasting_start_time && (
                                  <p className="text-sm text-muted-foreground mt-1">
                                    Started: {format(new Date(session.fasting_start_time), 'h:mm a')}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs px-2 py-1 rounded-full ${getSessionStatusColor(session, isLatestInDay)} bg-muted/20 flex items-center gap-1 shrink-0`}>
                                {getSessionStatusIcon(session, isLatestInDay)}
                                {getSessionStatusText(session, isLatestInDay)}
                              </span>
                            </div>
                          </div>
                          
                          {/* Action buttons for non-active sessions */}
                          {session.status !== 'active' && (
                            <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-border opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditSession(session)}
                                className="h-8 px-3 hover:bg-muted text-xs"
                              >
                                <Edit className="w-3 h-3 mr-1" />
                                Edit
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeleteSessionId(session.id)}
                                className="h-8 px-3 hover:bg-destructive/10 text-destructive text-xs"
                              >
                                <Trash2 className="w-3 h-3 mr-1" />
                                Delete
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <EditIntermittentFastingModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedSession(null);
        }}
        session={selectedSession}
        onSessionUpdated={() => {
          refreshHistory();
          setEditModalOpen(false);
          setSelectedSession(null);
        }}
      />

      {/* Delete Session Confirmation */}
      <ConfirmationModal
        isOpen={!!deleteSessionId}
        onClose={() => setDeleteSessionId(null)}
        onConfirm={() => {
          if (deleteSessionId) {
            handleDeleteSession(deleteSessionId);
            setDeleteSessionId(null);
          }
        }}
        title="Delete Fasting Session"
        description="Are you sure you want to delete this intermittent fasting session? This action cannot be undone."
        confirmText="Delete Session"
        variant="destructive"
      />

      {/* Delete All History Confirmation */}
      <ConfirmationModal
        isOpen={deleteAllModalOpen}
        onClose={() => setDeleteAllModalOpen(false)}
        onConfirm={() => {
          handleDeleteAllHistory();
          setDeleteAllModalOpen(false);
        }}
        title="Delete All Fasting History"
        description="Are you sure you want to delete ALL intermittent fasting history? This will permanently remove all non-active sessions. This action cannot be undone."
        confirmText="Delete All History"
        variant="destructive"
      />
    </div>
  );
};

export default IntermittentFastingHistory;