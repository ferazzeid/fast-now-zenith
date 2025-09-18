import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Clock, Calendar, CheckCircle, XCircle, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useIntermittentFasting } from '@/hooks/useIntermittentFasting';
import { format } from 'date-fns';

const IntermittentFastingHistory = () => {
  const navigate = useNavigate();
  const { history, historyLoading } = useIntermittentFasting();

  const formatDuration = (hours: number) => {
    return `${hours}h`;
  };

  const getSessionStatusColor = (status: string, completed: boolean) => {
    if (completed) return 'text-green-600';
    if (status === 'active') return 'text-accent';
    return 'text-muted-foreground';
  };

  const getSessionStatusText = (status: string, completed: boolean) => {
    if (completed) return 'Completed';
    if (status === 'active') return 'Active';
    return 'Incomplete';
  };

  const getSessionStatusIcon = (status: string, completed: boolean) => {
    if (completed) return <CheckCircle className="w-4 h-4" />;
    if (status === 'active') return <Clock className="w-4 h-4" />;
    return <XCircle className="w-4 h-4" />;
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
                  {daySessions.map((session) => (
                    <Card key={session.id} className="overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <h3 className="font-semibold">
                              {session.fasting_window_hours}:{session.eating_window_hours} Schedule
                            </h3>
                            <span className={`text-xs px-2 py-1 rounded-full ${getSessionStatusColor(session.status, session.completed)} bg-current/10 flex items-center gap-1`}>
                              {getSessionStatusIcon(session.status, session.completed)}
                              {getSessionStatusText(session.status, session.completed)}
                            </span>
                            {session.completed && (
                              <Trophy className="w-4 h-4 text-yellow-500" />
                            )}
                          </div>
                        </div>
                        
                        {session.fasting_start_time && (
                          <p className="text-sm text-muted-foreground mt-2">
                            Fasting started: {format(new Date(session.fasting_start_time), 'h:mm a')}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
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