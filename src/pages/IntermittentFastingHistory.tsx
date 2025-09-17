import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ResponsivePageHeader } from '@/components/ResponsivePageHeader';
import { useIntermittentFasting } from '@/hooks/useIntermittentFasting';
import { format } from 'date-fns';
import { CheckCircle, Clock, XCircle } from 'lucide-react';

const IntermittentFastingHistory = () => {
  const { history, historyLoading } = useIntermittentFasting();

  const formatDuration = (hours: number) => {
    return `${hours}h`;
  };

  const getStatusColor = (status: string, completed: boolean) => {
    if (completed) return 'bg-green-500/10 text-green-700 border-green-200';
    if (status === 'active') return 'bg-blue-500/10 text-blue-700 border-blue-200';
    return 'bg-gray-500/10 text-gray-700 border-gray-200';
  };

  const getStatusIcon = (status: string, completed: boolean) => {
    if (completed) return <CheckCircle className="w-4 h-4" />;
    if (status === 'active') return <Clock className="w-4 h-4" />;
    return <XCircle className="w-4 h-4" />;
  };

  if (historyLoading) {
    return (
      <div className="relative min-h-[calc(100vh-80px)] bg-background p-4">
        <div className="max-w-md mx-auto pt-10 pb-40">
          <ResponsivePageHeader
            title="IF History"
            subtitle="Loading your intermittent fasting sessions..."
          />
          <div className="space-y-4 mt-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[calc(100vh-80px)] bg-background p-4">
      <div className="max-w-md mx-auto pt-10 pb-40">
        <ResponsivePageHeader
          title="IF History"
          subtitle="Your intermittent fasting journey"
          showAuthorTooltip={true}
        />

        <div className="mt-6 space-y-4">
          {history && history.length > 0 ? (
            history.map((session) => (
              <Card key={session.id} className="border-border/50">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      {format(new Date(session.session_date), 'MMM d, yyyy')}
                    </CardTitle>
                    <Badge 
                      variant="outline" 
                      className={getStatusColor(session.status, session.completed)}
                    >
                      <div className="flex items-center gap-1">
                        {getStatusIcon(session.status, session.completed)}
                        {session.completed ? 'Completed' : session.status === 'active' ? 'Active' : 'Incomplete'}
                      </div>
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Fasting Window</div>
                      <div className="font-medium">
                        {formatDuration(session.fasting_window_hours)}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Eating Window</div>
                      <div className="font-medium">
                        {formatDuration(session.eating_window_hours)}
                      </div>
                    </div>
                  </div>
                  
                  {session.fasting_start_time && (
                    <div className="mt-3 pt-3 border-t border-border/50">
                      <div className="text-xs text-muted-foreground space-y-1">
                        {session.fasting_start_time && (
                          <div>Fasting started: {format(new Date(session.fasting_start_time), 'h:mm a')}</div>
                        )}
                        {session.eating_start_time && (
                          <div>Eating started: {format(new Date(session.eating_start_time), 'h:mm a')}</div>
                        )}
                        {session.eating_end_time && (
                          <div>Eating ended: {format(new Date(session.eating_end_time), 'h:mm a')}</div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="border-border/50">
              <CardContent className="py-12 text-center">
                <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-medium mb-2">No IF Sessions Yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Start your first intermittent fasting session to see your history here.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default IntermittentFastingHistory;