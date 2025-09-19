import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Clock, Calendar, CheckCircle, XCircle, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useIntermittentFasting } from '@/hooks/useIntermittentFasting';
import { format } from 'date-fns';

const IntermittentFastingHistory = () => {
  const navigate = useNavigate();
  const { history, historyLoading } = useIntermittentFasting();

  const formatDuration = (hours: number) => {
    return `${hours}h`;
  };

  const getSessionStatusColor = (session: any, isLatestInDay: boolean) => {
    const now = new Date();
    const sessionDate = new Date(session.session_date);
    const isToday = sessionDate.toDateString() === now.toDateString();
    
    // If it's explicitly canceled, show as canceled
    if (session.status === 'canceled') return 'text-red-600 dark:text-red-400';
    
    // If it's completed AND it's the only session OR the latest session of the day, show as completed
    if (session.status === 'completed' && session.completed && isLatestInDay) {
      return 'text-green-600 dark:text-green-400';
    }
    
    // If it's in progress (fasting/eating) and it's today and the latest session, show as in progress
    if ((session.status === 'fasting' || session.status === 'eating') && isToday && isLatestInDay) {
      return 'text-blue-600 dark:text-blue-400';
    }
    
    // Everything else is effectively canceled (past sessions that weren't completed, or non-latest sessions)
    return 'text-red-600 dark:text-red-400';
  };

  const getSessionStatusText = (session: any, isLatestInDay: boolean) => {
    const now = new Date();
    const sessionDate = new Date(session.session_date);
    const isToday = sessionDate.toDateString() === now.toDateString();
    
    // If it's explicitly canceled, show as canceled
    if (session.status === 'canceled') return 'Canceled';
    
    // If it's completed AND it's the only session OR the latest session of the day, show as completed
    if (session.status === 'completed' && session.completed && isLatestInDay) {
      return 'Completed';
    }
    
    // If it's in progress (fasting/eating) and it's today and the latest session, show as in progress
    if ((session.status === 'fasting' || session.status === 'eating') && isToday && isLatestInDay) {
      return session.status === 'fasting' ? 'Fasting' : 'Eating';
    }
    
    // Everything else is effectively canceled (past sessions that weren't completed, or non-latest sessions)
    return 'Canceled';
  };

  const getSessionStatusIcon = (session: any, isLatestInDay: boolean) => {
    const now = new Date();
    const sessionDate = new Date(session.session_date);
    const isToday = sessionDate.toDateString() === now.toDateString();
    
    // If it's explicitly canceled, show as canceled
    if (session.status === 'canceled') return <XCircle className="w-3 h-3" />;
    
    // If it's completed AND it's the only session OR the latest session of the day, show as completed
    if (session.status === 'completed' && session.completed && isLatestInDay) {
      return <CheckCircle className="w-3 h-3" />;
    }
    
    // If it's in progress (fasting/eating) and it's today and the latest session, show as in progress
    if ((session.status === 'fasting' || session.status === 'eating') && isToday && isLatestInDay) {
      return <Clock className="w-3 h-3" />;
    }
    
    // Everything else is effectively canceled (past sessions that weren't completed, or non-latest sessions)
    return <XCircle className="w-3 h-3" />;
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
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/intermittent-fasting')}
            className="w-8 h-8 rounded-full hover:bg-muted/50 dark:hover:bg-muted/30 hover:scale-110 transition-all duration-200"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

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
                      <Card key={session.id} className="overflow-hidden">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                              <div>
                                <h3 className="font-semibold flex items-center gap-2">
                                  {session.fasting_window_hours}:{session.eating_window_hours} Schedule
                                  {isLatestInDay && daySessions.length > 1 && (
                                    <Badge variant="secondary" className="text-xs">Latest</Badge>
                                  )}
                                </h3>
                                {session.fasting_start_time && (
                                  <p className="text-sm text-muted-foreground mt-1">
                                    Started: {format(new Date(session.fasting_start_time), 'h:mm a')}
                                  </p>
                                )}
                              </div>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-full ${getSessionStatusColor(session, isLatestInDay)} bg-muted/20 flex items-center gap-1 shrink-0`}>
                              {getSessionStatusIcon(session, isLatestInDay)}
                              {getSessionStatusText(session, isLatestInDay)}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default IntermittentFastingHistory;