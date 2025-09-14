import React, { useState, useEffect } from 'react';
import { Clock, Calendar, Trash2, X, ChevronDown, Target, TrendingUp, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { SmartLoadingButton } from "./SimpleLoadingComponents";
import { useStandardizedLoading } from '@/hooks/useStandardizedLoading';
import { ListLoadingSkeleton } from '@/components/LoadingStates';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface FastingSession {
  id: string;
  start_time: string;
  end_time: string | null;
  duration_seconds: number | null;
  goal_duration_seconds: number | null;
  status: 'active' | 'completed' | 'cancelled' | 'incomplete';
  created_at: string;
}

interface FastingHistoryProps {
  onClose: () => void;
}

export const FastingHistory = ({ onClose }: FastingHistoryProps) => {
  const { data: sessions, isLoading, execute, setData } = useStandardizedLoading<FastingSession[]>([]);
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set());
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const ITEMS_PER_PAGE = 10;

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    // Always display in hours for fasting (no days)
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  };

  const getStatusBadge = (session: FastingSession) => {
    // Only show completed if goal was reached
    const isGoalReached = session.duration_seconds && session.goal_duration_seconds && 
                         session.duration_seconds >= session.goal_duration_seconds;
    
    switch (session.status) {
      case 'completed':
        return isGoalReached ? 
          <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Completed</Badge> :
          <div className="w-6 h-6 bg-destructive rounded-full flex items-center justify-center">
            <X className="w-3 h-3 text-destructive-foreground" />
          </div>;
      case 'incomplete':
        return <Badge variant="default" className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">Incomplete</Badge>;
      case 'cancelled':
        return (
          <div className="w-6 h-6 bg-destructive rounded-full flex items-center justify-center">
            <X className="w-3 h-3 text-destructive-foreground" />
          </div>
        );
      case 'active':
        return <Badge className="bg-green-500 text-white hover:bg-green-600 font-medium">Active</Badge>;
      default:
        return null;
    }
  };

  const getSuccessRate = () => {
    const completedSessions = sessions?.filter(s => s.status === 'completed') || [];
    const totalSessions = sessions?.filter(s => s.status !== 'active').length || 0;
    return totalSessions > 0 ? Math.round((completedSessions.length / totalSessions) * 100) : 0;
  };

  const getAverageDuration = () => {
    const completedSessions = sessions?.filter(s => s.status === 'completed' && s.duration_seconds) || [];
    if (completedSessions.length === 0) return 0;
    
    const totalSeconds = completedSessions.reduce((sum, session) => sum + (session.duration_seconds || 0), 0);
    return Math.round(totalSeconds / completedSessions.length);
  };

  const getLongestStreak = () => {
    if (!sessions) return 0;
    
    let currentStreak = 0;
    let longestStreak = 0;
    
    // Sort by start time
    const sortedSessions = [...sessions]
      .filter(s => s.status === 'completed')
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
    
    for (const session of sortedSessions) {
      if (session.status === 'completed') {
        currentStreak++;
        longestStreak = Math.max(longestStreak, currentStreak);
      } else {
        currentStreak = 0;
      }
    }
    
    return longestStreak;
  };

  const loadFastingHistory = async (offsetValue = 0, append = false) => {
    if (!user) return;

    await execute(async () => {
      console.log('Loading fasting history for user:', user.id);
      const { data: fastingSessions, error } = await supabase
        .from('fasting_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('start_time', { ascending: false })
        .range(offsetValue * ITEMS_PER_PAGE, (offsetValue + 1) * ITEMS_PER_PAGE - 1);

      if (error) {
        console.error('Error loading fasting history:', error);
        throw error;
      }

      console.log('Loaded fasting sessions:', fastingSessions?.length || 0);
      
      // Type the sessions properly
      const typedSessions = (fastingSessions || []).map(session => ({
        ...session,
        status: session.status as 'active' | 'completed' | 'cancelled' | 'incomplete'
      }));

      if (append) {
        const currentData = sessions || [];
        const newData = [...currentData, ...typedSessions];
        setHasMore((fastingSessions?.length || 0) === ITEMS_PER_PAGE);
        return newData;
      } else {
        setHasMore((fastingSessions?.length || 0) === ITEMS_PER_PAGE);
        return typedSessions;
      }
    });
  };

  const loadMore = () => {
    const newOffset = offset + 1;
    setOffset(newOffset);
    loadFastingHistory(newOffset, true);
  };

  const toggleSessionExpansion = (sessionId: string) => {
    setExpandedSessions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sessionId)) {
        newSet.delete(sessionId);
      } else {
        newSet.add(sessionId);
      }
      return newSet;
    });
  };

  const deleteSession = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('fasting_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;

      await execute(async () => {
        const updatedSessions = sessions?.filter(s => s.id !== sessionId) || [];
        return updatedSessions;
      });

      toast({
        title: "Session deleted",
        description: "Fasting session has been removed"
      });
    } catch (error) {
      console.error('Error deleting session:', error);
      toast({
        title: "Error",
        description: "Failed to delete fasting session",
        variant: "destructive"
      });
    }
  };

  const deleteAllHistory = async () => {
    try {
      const { error } = await supabase
        .from('fasting_sessions')
        .delete()
        .eq('user_id', user?.id)
        .neq('status', 'active'); // Don't delete active sessions

      if (error) throw error;

      // Reload the history to reflect changes
      await loadFastingHistory();

      toast({
        title: "History deleted",
        description: "All completed and cancelled fasting sessions have been deleted"
      });
    } catch (error) {
      console.error('Error deleting all history:', error);
      toast({
        title: "Error",
        description: "Failed to delete fasting history",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    loadFastingHistory();
  }, [user]);

  if (isLoading && (!sessions || sessions.length === 0)) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
        <Card className="w-full max-w-md mx-auto" onClick={(e) => e.stopPropagation()}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">Fasting History</CardTitle>
              <Button variant="ghost" size="sm" onClick={onClose} className="w-8 h-8 rounded-full hover:bg-muted/50 dark:hover:bg-muted/30 hover:scale-110 transition-all duration-200">
                <X className="w-8 h-8" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ListLoadingSkeleton count={3} itemHeight="h-20" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const completedSessions = sessions?.filter(s => s.status === 'completed') || [];
  const successRate = getSuccessRate();
  const averageDuration = getAverageDuration();
  const longestStreak = getLongestStreak();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <Card className="w-full max-w-md mx-auto max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <CardHeader className="border-b border-border py-4 px-0 flex-shrink-0">
          <div className="flex justify-between items-center px-6">
            <CardTitle className="text-lg font-semibold">Fasting History</CardTitle>
            <div className="flex gap-2">
              {/* Delete All History Button - only show if there are non-active sessions */}
              {sessions && sessions.filter(s => s.status !== 'active').length > 0 && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete All Fasting History</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete ALL fasting history? This will permanently remove all completed and cancelled sessions (active sessions will remain). This action cannot be undone.
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

          {(!sessions || sessions.length === 0) ? (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <div className="text-muted-foreground">No fasting sessions found</div>
              <div className="text-sm text-muted-foreground/80 mt-1">Start your first fast to see history here</div>
            </div>
          ) : (
            <>
              {sessions?.map((session) => (
                <Card key={session.id} className="relative bg-muted/20 border-0">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-sm">
                            {new Date(session.start_time).toLocaleDateString('en-US', { 
                              weekday: 'short', 
                              month: 'short', 
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit'
                            })}
                          </h3>
                        </div>
                        <div className="flex gap-3 text-xs text-muted-foreground mt-2">
                          {session.duration_seconds && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDuration(session.duration_seconds)}
                            </span>
                          )}
                          {session.goal_duration_seconds && (
                            <span className="flex items-center gap-1">
                              <Target className="w-3 h-3" />
                              Target: {formatDuration(session.goal_duration_seconds)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Status badge in bottom right corner aligned with delete button */}
                    <div className="absolute bottom-3 right-3">
                      {getStatusBadge(session)}
                    </div>
                  </CardHeader>
                  
                  {/* Delete button - only shown for non-active sessions */}
                  {session.status !== 'active' && (
                    <div className="absolute top-3 right-3">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 w-6 p-0 text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </AlertDialogTrigger>
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
                              onClick={() => deleteSession(session.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete Session
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </Card>
              ))}
              
              {hasMore && (
                <div className="text-center pt-4">
                  <SmartLoadingButton 
                    variant="outline" 
                    onClick={loadMore} 
                    isLoading={isLoading}
                    loadingText="Loading more"
                  >
                    Load More
                  </SmartLoadingButton>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};