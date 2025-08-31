import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Clock } from 'lucide-react';

interface FastingHour {
  hour: number;
  title: string;
  body_state: string;
  encouragement?: string;
  tips?: string[];
  phase: string;
  difficulty: string;
  read_more_url?: string;
}

interface FastingTimelineProps {
  currentHour?: number;
  className?: string;
}

export const FastingTimeline: React.FC<FastingTimelineProps> = ({ 
  currentHour = 0, 
  className = '' 
}) => {
  const [fastingHours, setFastingHours] = useState<FastingHour[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFastingHours();
  }, []);

  const fetchFastingHours = async () => {
    try {
      const { data, error } = await supabase
        .from('fasting_hours')
        .select('hour, title, body_state, encouragement, tips, phase, difficulty, read_more_url')
        .lte('hour', 72)
        .order('hour');

      if (error) throw error;
      setFastingHours(data || []);
    } catch (error) {
      console.error('Error fetching fasting hours:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`text-center px-6 py-4 ${className}`}>
        <div className="flex items-center justify-center gap-2">
          <Clock className="w-4 h-4 animate-spin" />
          <span className="text-sm text-muted-foreground">Loading timeline...</span>
        </div>
      </div>
    );
  }

  const getVisibleHours = () => {
    // Show hour 0, then first 24 hours, then every 6 hours up to 72
    const hours = [0];
    for (let i = 1; i <= 24; i++) {
      hours.push(i);
    }
    for (let i = 30; i <= 72; i += 6) {
      hours.push(i);
    }
    return hours;
  };

  const getHourData = (hour: number) => {
    return fastingHours.find(h => h.hour === hour);
  };

  const getHourStatus = (hour: number) => {
    if (hour <= currentHour) return 'completed';
    if (hour === currentHour + 1) return 'current';
    return 'upcoming';
  };

  const getHourStyles = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-primary text-primary-foreground border-primary';
      case 'current':
        return 'bg-primary/20 text-primary border-primary animate-pulse';
      case 'upcoming':
        return 'bg-muted text-muted-foreground border-border hover:bg-muted/80';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const visibleHours = getVisibleHours();

  return (
    <div className={`text-center px-6 py-4 ${className}`}>
      <div className="mb-4">
        <h3 className="text-sm font-medium text-foreground mb-1">Fasting Timeline</h3>
        <p className="text-xs text-muted-foreground">Tap any hour to see what's happening</p>
      </div>
      
      <TooltipProvider delayDuration={0}>
        <div className="flex flex-wrap justify-center gap-2 max-w-sm mx-auto">
          {visibleHours.map((hour) => {
            const hourData = getHourData(hour);
            const status = getHourStatus(hour);
            
            return (
              <Tooltip key={hour}>
                <TooltipTrigger asChild>
                  <button
                    className={`
                      flex items-center gap-1 px-2 py-1 rounded-full border-2 text-xs font-medium 
                      transition-all duration-200 hover:scale-110 active:scale-95
                      ${getHourStyles(status)}
                    `}
                  >
                    {/* Left arrow - grayed out for hour 0 */}
                    <span className={`text-xs ${hour === 0 ? 'text-muted-foreground/40' : 'text-current'}`}>
                      ◀
                    </span>
                    <span className="min-w-[16px] text-center">{hour}</span>
                    {/* Right arrow */}
                    <span className="text-xs text-current">
                      ▶
                    </span>
                  </button>
                </TooltipTrigger>
                <TooltipContent 
                  side="top" 
                  className="max-w-xs p-3 text-left"
                  sideOffset={10}
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3 h-3" />
                      <span className="font-medium text-sm">Hour {hour}</span>
                    </div>
                    
                    {hourData ? (
                      <>
                        <h4 className="font-medium text-sm">{hourData.title}</h4>
                        <p className="text-xs text-muted-foreground">{hourData.body_state}</p>
                        
                        {hourData.encouragement && (
                          <p className="text-xs italic text-primary/80">
                            "{hourData.encouragement}"
                          </p>
                        )}
                        
                        {hourData.tips && hourData.tips.length > 0 && (
                          <div className="text-xs">
                            <span className="font-medium">Tips:</span>
                            <ul className="list-disc list-inside mt-1 space-y-1">
                              {hourData.tips.slice(0, 2).map((tip, index) => (
                                <li key={index} className="text-muted-foreground">{tip}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        <div className="flex gap-2 text-xs">
                          <span className={`px-2 py-1 rounded text-xs ${
                            hourData.phase === 'preparation' ? 'bg-blue-100 text-blue-700' :
                            hourData.phase === 'adaptation' ? 'bg-amber-100 text-amber-700' :
                            hourData.phase === 'fat_burning' ? 'bg-green-100 text-green-700' :
                            hourData.phase === 'deep_ketosis' ? 'bg-purple-100 text-purple-700' :
                            'bg-muted text-muted-foreground'
                          }`}>
                            {hourData.phase.replace('_', ' ')}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs ${
                            hourData.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                            hourData.difficulty === 'moderate' ? 'bg-amber-100 text-amber-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {hourData.difficulty}
                          </span>
                        </div>
                        
                        {hourData.read_more_url && (
                          <div className="mt-2 pt-2 border-t border-border">
                            <a
                              href={hourData.read_more_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-primary hover:underline"
                            >
                              Read more
                            </a>
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Hour {hour} - Keep going strong! 💪
                      </p>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </TooltipProvider>
      
      <div className="mt-4 text-xs text-muted-foreground">
        {currentHour > 0 ? (
          <span>Currently at hour {currentHour} of your fast</span>
        ) : (
          <span>Start your fasting journey!</span>
        )}
      </div>
    </div>
  );
};