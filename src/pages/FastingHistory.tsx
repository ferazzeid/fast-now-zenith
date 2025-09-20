import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Clock, Calendar, Trash2, Trophy, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ConfirmationModal } from '@/components/ui/universal-modal';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { SEOManager } from '@/components/SEOManager';
import { useStandardizedLoading } from '@/hooks/useStandardizedLoading';
import { useFastingTimelineSlots, type FastingTimelineSlot } from '@/hooks/useFastingTimelineSlots';

interface FastingSessionData {
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
  const { timelineSlots, loading } = useFastingTimelineSlots();
  const [showAll, setShowAll] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  // Filter and sort timeline slots for history view
  const historySlots = timelineSlots
    .filter(slot => {
      // Include all slots (active, completed, cancelled)
      return true;
    })
    .sort((a, b) => new Date(b.slot_date).getTime() - new Date(a.slot_date).getTime())
    .slice(0, showAll ? 100 : 15);

  useEffect(() => {
    // Check if there are more slots available
    if (!showAll && timelineSlots.length >= 15) {
      setHasMore(timelineSlots.length > 15);
    } else {
      setHasMore(false);
    }
  }, [timelineSlots, showAll]);

  const handleDeleteSession = async (sessionId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('fasting_sessions')
        .delete()
        .eq('id', sessionId)
        .eq('user_id', user.id);

      if (error) throw error;
      
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

  const getSlotStatusColor = (slot: FastingTimelineSlot) => {
    if (slot.status === 'completed') {
      return 'text-green-600';
    } else if (slot.status === 'in_progress') {
      return 'text-blue-600';
    } else if (slot.status === 'cancelled') {
      return 'text-red-600';
    }
    return 'text-muted-foreground';
  };

  const getSlotStatusText = (slot: FastingTimelineSlot) => {
    if (slot.status === 'completed') {
      return 'Completed';
    } else if (slot.status === 'in_progress') {
      return 'In Progress';
    } else if (slot.status === 'cancelled') {
      return 'Cancelled';
    }
    return 'Unknown';
  };

  const formatHoursIntoFast = (hours: number | undefined): string => {
    if (!hours) return '0h';
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    
    if (wholeHours > 0) {
      return minutes > 0 ? `${wholeHours}h ${minutes}m` : `${wholeHours}h`;
    }
    return `${minutes}m`;
  };

  const groupSlotsByDate = (slots: FastingTimelineSlot[]) => {
    const groups: { [key: string]: FastingTimelineSlot[] } = {};
    
    slots.forEach(slot => {
      const date = new Date(slot.slot_date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(slot);
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

  const groupedSlots = groupSlotsByDate(historySlots);

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

        {!historySlots || historySlots.length === 0 ? (
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
            {Object.entries(groupedSlots).map(([date, dateSlots]) => (
              <div key={date}>
                <div className="flex items-center gap-2 mb-3 sticky top-0 bg-background/80 backdrop-blur-sm py-2 z-10">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <h2 className="font-semibold text-sm">{date}</h2>
                  <div className="flex-1 border-t-subtle" />
                </div>
                
                <div className="space-y-3 ml-6">
                  {dateSlots.map((slot) => (
                    <Card key={slot.id} className="overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-sm">
                                {slot.fast_type === 'extended' ? 'Extended Fast' : 'Intermittent Fast'}
                              </h3>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${getSlotStatusColor(slot)} bg-current/10`}>
                                {getSlotStatusText(slot)}
                              </span>
                              {slot.status === 'in_progress' && (
                                <Play className="w-4 h-4 text-blue-500" />
                              )}
                              {slot.status === 'completed' && (
                                <Trophy className="w-4 h-4 text-yellow-500" />
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {slot.fast_start_time && `Started: ${new Date(slot.fast_start_time).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}`}
                              {slot.fast_end_time && ` • Ended: ${new Date(slot.fast_end_time).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}`}
                            </p>
                          </div>
                          {slot.status !== 'in_progress' && slot.fasting_session_id && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="w-8 h-8 text-destructive hover:text-destructive"
                              onClick={() => setDeletingId(slot.fasting_session_id!)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">
                                {slot.status === 'in_progress' ? 'Hours Fasted' : 'Duration'}
                              </p>
                              <p className="font-medium">
                                {formatHoursIntoFast(slot.hours_into_fast)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">Day</p>
                              <p className="font-medium">
                                {new Date(slot.slot_date).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Multi-day progress indicator for extended fasts */}
                        {slot.fast_type === 'extended' && slot.hours_into_fast && (
                          <div className="mt-3">
                            <div className="flex justify-between text-xs text-muted-foreground mb-1">
                              <span>Fast Progress</span>
                              <span>
                                {slot.status === 'in_progress' ? 'Ongoing' : `${Math.round(slot.hours_into_fast)}h total`}
                              </span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full transition-all duration-200 ${
                                  slot.status === 'completed' 
                                    ? 'bg-green-500' 
                                    : slot.status === 'in_progress'
                                    ? 'bg-blue-500'
                                    : 'bg-muted-foreground'
                                }`}
                                style={{
                                  width: slot.status === 'in_progress' ? '100%' : `${Math.min(100, (slot.hours_into_fast / 72) * 100)}%`
                                }}
                              />
                            </div>
                          </div>
                        )}
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

            {showAll && historySlots.length > 15 && (
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
          title="Delete Fasting Session"
          message="Are you sure you want to delete this fasting session? This action cannot be undone."
          confirmText="Delete"
          variant="destructive"
        />
      </div>
    </div>
  );
};

export default FastingHistory;