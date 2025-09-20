import React from 'react';
import { format } from 'date-fns';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useFastingTimelineSlots } from '@/hooks/useFastingTimelineSlots';
import { Clock, Calendar, Zap } from 'lucide-react';

interface FastingDailyTimelineProps {
  className?: string;
  onDateClick?: (date: string) => void;
}

export const FastingDailyTimeline: React.FC<FastingDailyTimelineProps> = ({
  className = "",
  onDateClick
}) => {
  const { generateDateRange, loading } = useFastingTimelineSlots();

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 38 }).map((_, i) => (
            <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const dateRange = generateDateRange();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_progress':
        return 'bg-warning/20 border-warning text-warning-foreground';
      case 'completed':
        return 'bg-success/20 border-success text-success-foreground';
      case 'cancelled':
        return 'bg-destructive/20 border-destructive text-destructive-foreground';
      default:
        return 'bg-muted border-border text-muted-foreground';
    }
  };

  const formatHours = (hours?: number) => {
    if (!hours) return '';
    return hours > 24 ? `${Math.floor(hours / 24)}d ${hours % 24}h` : `${hours}h`;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Fasting Timeline</h3>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>37 days</span>
        </div>
      </div>

      {/* Week headers */}
      <div className="grid grid-cols-7 gap-2 text-center text-sm font-medium text-muted-foreground">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="py-2">{day}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-2">
        {dateRange.map((dayData) => {
          const { date, displayDate, isToday, isPast, extendedFast, ifSession, allSlots } = dayData;
          
          return (
            <Card
              key={date}
              className={`
                min-h-16 p-2 cursor-pointer transition-all hover:shadow-md relative
                ${isToday ? 'ring-2 ring-primary/50 bg-primary/5' : ''}
                ${isPast ? 'opacity-75' : ''}
                ${allSlots.length > 0 ? 'bg-accent/20' : ''}
              `}
              onClick={() => onDateClick?.(date)}
            >
              {/* Date number */}
              <div className={`text-sm font-medium mb-1 ${isToday ? 'text-primary' : 'text-foreground'}`}>
                {format(displayDate, 'd')}
              </div>

              {/* Fasting indicators */}
              <div className="space-y-1">
                {extendedFast && (
                  <div className={`
                    px-1.5 py-0.5 rounded text-xs font-medium border
                    ${getStatusColor(extendedFast.status)}
                    flex items-center gap-1
                  `}>
                    <Zap className="h-3 w-3" />
                    <span>{formatHours(extendedFast.hours_into_fast)}</span>
                  </div>
                )}

                {ifSession && (
                  <div className={`
                    px-1.5 py-0.5 rounded text-xs font-medium border
                    ${getStatusColor(ifSession.status)}
                    flex items-center gap-1
                  `}>
                    <Clock className="h-3 w-3" />
                    <span>IF</span>
                  </div>
                )}
              </div>

              {/* Multiple fasts indicator */}
              {allSlots.length > 1 && (
                <Badge variant="secondary" className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs">
                  {allSlots.length}
                </Badge>
              )}
            </Card>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-warning/20 border border-warning" />
          <span className="text-muted-foreground">In Progress</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-success/20 border border-success" />
          <span className="text-muted-foreground">Completed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-destructive/20 border border-destructive" />
          <span className="text-muted-foreground">Cancelled</span>
        </div>
        <div className="flex items-center gap-2">
          <Zap className="h-3 w-3 text-muted-foreground" />
          <span className="text-muted-foreground">Extended Fast</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-3 w-3 text-muted-foreground" />
          <span className="text-muted-foreground">Intermittent Fast</span>
        </div>
      </div>
    </div>
  );
};