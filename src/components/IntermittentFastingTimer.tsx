import { useState, useEffect } from 'react';
import { X, Clock, Play, Square, ChevronUp, ChevronDown, Settings2, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { useIntermittentFasting } from '@/hooks/useIntermittentFasting';
import { CustomScheduleSlider } from './CustomScheduleSlider';
import { IFScheduleSelector } from './IFScheduleSelector';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface IntermittentFastingTimerProps {
  isActive?: boolean;
  className?: string;
}

const IF_PRESETS = [
  { name: '18:6', fastingHours: 18, eatingHours: 6, description: 'Extended fasting' },
  { name: '16:8', fastingHours: 16, eatingHours: 8, description: 'Most popular schedule' },
  { name: '23:1', fastingHours: 23, eatingHours: 1, description: 'One meal a day' }
];

export const IntermittentFastingTimer: React.FC<IntermittentFastingTimerProps> = ({
  isActive = false,
  className = ""
}) => {
  const {
    todaySession,
    startIFSession,
    startFastingWindow,
    endFastingWindow,
    endEatingWindow,
    loading
  } = useIntermittentFasting();

  // Debug: Log session state
  console.log('🔍 IF Timer - Session state:', { todaySession, loading });

  const [selectedTab, setSelectedTab] = useState<'quick' | 'custom'>('quick');
  const [selectedPreset, setSelectedPreset] = useState(IF_PRESETS[0]);
  const [topCountDirection, setTopCountDirection] = useState<'up' | 'down'>('up'); // Default: count up
  const [bottomCountDirection, setBottomCountDirection] = useState<'up' | 'down'>('down'); // Default: count down
  const [fastingElapsed, setFastingElapsed] = useState(0);
  const [eatingElapsed, setEatingElapsed] = useState(0);
  const [showScheduleSelector, setShowScheduleSelector] = useState(false);
  
  // Auto-restart and schedule memory
  const [autoRestart, setAutoRestart] = useState(false);
  const [lastSchedule, setLastSchedule] = useState<{fastingHours: number, eatingHours: number} | null>(null);
  
  // Start in past functionality
  const [showPastStart, setShowPastStart] = useState(false);
  const [hoursAgo, setHoursAgo] = useState(6);

  // Update elapsed times every second - but only for the active window
  useEffect(() => {
    if (!todaySession) return;

    const interval = setInterval(() => {
      const now = new Date();
      
      // Only calculate elapsed time for the currently active window
      if (todaySession.status === 'fasting' && todaySession.fasting_start_time) {
        const fastingStart = new Date(todaySession.fasting_start_time);
        const elapsed = Math.floor((now.getTime() - fastingStart.getTime()) / 1000);
        setFastingElapsed(elapsed);
        
        // Auto-transition to eating when fasting window completes
        if (todaySession.fasting_window_hours && elapsed >= todaySession.fasting_window_hours * 3600) {
          console.log('🎉 Fasting window complete! Starting eating window...');
          endFastingWindow(todaySession.id).catch(console.error);
        }
      } else if (todaySession.status === 'eating' && todaySession.eating_start_time) {
        const eatingStart = new Date(todaySession.eating_start_time);
        const elapsed = Math.floor((now.getTime() - eatingStart.getTime()) / 1000);
        setEatingElapsed(elapsed);
        
        // Auto-complete session when eating window completes
        if (todaySession.eating_window_hours && elapsed >= todaySession.eating_window_hours * 3600) {
          console.log('🔄 Eating window complete! Completing session...');
          endEatingWindow(todaySession.id).then(() => {
            // Auto-restart if enabled and we have a last schedule
            if (autoRestart && lastSchedule) {
              setTimeout(() => {
                handleScheduleSelect(lastSchedule.fastingHours, lastSchedule.eatingHours);
              }, 1000); // Small delay for better UX
            }
          }).catch(console.error);
        }
      }
      
      // Reset inactive timers
      if (todaySession.status !== 'fasting') setFastingElapsed(0);
      if (todaySession.status !== 'eating') setEatingElapsed(0);
      
    }, 1000);

    return () => clearInterval(interval);
  }, [todaySession, endFastingWindow, endEatingWindow]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getDisplayTime = (elapsed: number, goalSeconds: number, direction: 'up' | 'down') => {
    if (direction === 'up') {
      return formatTime(elapsed);
    } else {
      const remaining = Math.max(0, goalSeconds - elapsed);
      return formatTime(remaining);
    }
  };

  const getProgress = (elapsed: number, goalSeconds: number) => {
    return Math.min((elapsed / goalSeconds) * 100, 100);
  };

  const handleScheduleSelect = async (fastingHours: number, eatingHours: number, startInPast?: boolean) => {
    setShowScheduleSelector(false);
    setShowPastStart(false);
    
    // Remember the schedule for manual restarts
    setLastSchedule({ fastingHours, eatingHours });
    
    try {
      const customStartTime = startInPast 
        ? new Date(Date.now() - hoursAgo * 60 * 60 * 1000)
        : undefined;
        
      // Create session and automatically start fasting
      await startIFSession({ 
        fasting_window_hours: fastingHours, 
        eating_window_hours: eatingHours,
        custom_start_time: customStartTime
      });
    } catch (error) {
      // Keep the selector open if there's an error
      setShowScheduleSelector(true);
      console.error('Failed to start IF session:', error);
    }
  };

  const handleStartFastingClick = () => {
    if (lastSchedule && !showScheduleSelector) {
      // Quick restart with last schedule if available
      handleScheduleSelect(lastSchedule.fastingHours, lastSchedule.eatingHours);
    } else {
      setShowScheduleSelector(true);
    }
  };

  const handleStartFasting = async () => {
    if (!todaySession?.id) return;
    try {
      await startFastingWindow(todaySession.id);
    } catch (error) {
      console.error('Failed to start fasting window:', error);
      // Error is already handled by the mutation's onError
    }
  };

  const handleEndFasting = async () => {
    if (!todaySession?.id) return;
    try {
      await endEatingWindow(todaySession.id);
    } catch (error) {
      console.error('Failed to end fasting window:', error);
      // Error is already handled by the mutation's onError if present
    }
  };

  const handleEndFast = async () => {
    if (!todaySession?.id) return;
    try {
      await endEatingWindow(todaySession.id);
    } catch (error) {
      console.error('Failed to end fast:', error);
    }
  };

  // If no session exists or session is completed, show setup interface
  if (!todaySession || todaySession?.status === 'completed') {
    return (
      <div className={`max-w-md mx-auto space-y-6 ${className}`}>
        {/* Auto-restart Toggle */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <Button
                  onClick={() => setAutoRestart(false)}
                  variant={!autoRestart ? "default" : "outline"}
                  size="sm"
                  className="w-8 h-8 p-0 text-xs font-bold"
                >
                  M
                </Button>
                <Button
                  onClick={() => setAutoRestart(true)}
                  variant={autoRestart ? "default" : "outline"}
                  size="sm"
                  className="w-8 h-8 p-0 text-xs font-bold"
                >
                  A
                </Button>
              </div>
              <div className="text-sm">
                <div className="font-medium">{autoRestart ? 'Auto-cycle' : 'Manual start'}</div>
                <div className="text-xs text-muted-foreground">
                  {autoRestart ? 'Cycles restart automatically' : 'Manual restart required'}
                </div>
              </div>
            </div>
            <Settings2 className="w-4 h-4 text-muted-foreground" />
          </div>
        </Card>

        {/* Main Timer Card */}
        <Card className="p-4 text-center relative overflow-hidden min-h-[180px]">
          <div className="mb-2 flex flex-col justify-center items-center">
            <div 
              className="text-5xl font-mono font-bold text-warm-text mb-2 tracking-wide"
              style={{ 
                fontFeatureSettings: '"tnum" 1',
                textShadow: '0 1px 2px rgba(0,0,0,0.1)'
              }}
            >
              00:00:00
            </div>
            <div className="text-lg font-medium text-muted-foreground mb-4">
              Fasting Window
            </div>
            
            <div className="w-full h-px bg-border/30 my-3"></div>
            
            <div 
              className="text-2xl font-mono font-medium text-muted-foreground/70 mb-1 tracking-wide"
              style={{ 
                fontFeatureSettings: '"tnum" 1',
                textShadow: '0 1px 2px rgba(0,0,0,0.05)'
              }}
            >
              00:00:00
            </div>
            <div className="text-sm font-medium text-muted-foreground/60">
              Eating Window
            </div>
          </div>
        </Card>

        {/* Start Fast Button */}
        <div className="space-y-3">
          <Button 
            onClick={handleStartFastingClick}
            variant="action-primary"
            size="start-button"
            className="w-full"
            disabled={loading}
          >
            <Play className="w-8 h-8 mr-3" />
            {lastSchedule ? `Start ${lastSchedule.fastingHours}:${lastSchedule.eatingHours}` : 'Start Fast'}
          </Button>
          
          {lastSchedule && (
            <div className="flex gap-2">
              <Button 
                onClick={() => setShowScheduleSelector(true)}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                Change Schedule
              </Button>
              <Button 
                onClick={() => setShowPastStart(true)}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                <Calendar className="w-4 h-4 mr-1" />
                Start in Past
              </Button>
            </div>
          )}
        </div>

        {/* Start in Past Modal */}
        {showPastStart && lastSchedule && (
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Start Cycle in Past</CardTitle>
                <Button
                  onClick={() => setShowPastStart(false)}
                  variant="ghost"
                  size="sm"
                  className="w-8 h-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <CardDescription>
                Already been fasting? Start your {lastSchedule.fastingHours}:{lastSchedule.eatingHours} cycle from when you actually began.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <Label className="text-sm font-medium">
                  Hours Ago: {hoursAgo}h
                </Label>
                <Slider
                  value={[hoursAgo]}
                  onValueChange={(value) => setHoursAgo(value[0])}
                  min={1}
                  max={24}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>1h ago</span>
                  <span>24h ago</span>
                </div>
                
                <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded">
                  <strong>Start time:</strong> {new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toLocaleString()}
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  onClick={() => setShowPastStart(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleScheduleSelect(lastSchedule.fastingHours, lastSchedule.eatingHours, true)}
                  variant="action-primary"
                  className="flex-1"
                >
                  Start Past Cycle
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Schedule Selection Modal */}
        {showScheduleSelector && (
          <IFScheduleSelector
            onSelect={handleScheduleSelect}
            onClose={() => setShowScheduleSelector(false)}
          />
        )}
      </div>
    );
  }

  // Active session - show unified dual timer card directly
  return (
    <div className={`max-w-md mx-auto space-y-6 ${className}`}>
      {/* Unified Dual Timer Card - first object, no session info card */}
      <Card className="p-4 text-center relative overflow-hidden min-h-[220px]">
        {/* Top Counter Toggle Button */}
        {todaySession?.status === 'fasting' && (
          <div className="absolute top-4 right-4 z-20">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => setTopCountDirection(prev => prev === 'up' ? 'down' : 'up')}
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 bg-background/80 backdrop-blur-sm border border-subtle hover:bg-background/90"
                  >
                    {topCountDirection === 'up' ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{topCountDirection === 'up' ? 'Switch to countdown' : 'Switch to count-up'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}

        {/* Bottom Counter Toggle Button */}
        {todaySession?.status === 'eating' && (
          <div className="absolute bottom-4 right-4 z-20">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => setBottomCountDirection(prev => prev === 'up' ? 'down' : 'up')}
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 bg-background/80 backdrop-blur-sm border border-subtle hover:bg-background/90"
                  >
                    {bottomCountDirection === 'up' ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{bottomCountDirection === 'up' ? 'Switch to countdown' : 'Switch to count-up'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}

        {/* Dual Counter Display */}
        <div className="mb-2 flex flex-col justify-center items-center">
          {/* Main Fasting Counter - Always shows fasting time */}
          <div className="mb-4">
            <div 
              className="text-5xl font-mono font-bold text-warm-text mb-2 tracking-wide"
              style={{ 
                fontFeatureSettings: '"tnum" 1',
                textShadow: '0 1px 2px rgba(0,0,0,0.1)'
              }}
            >
              {todaySession?.status === 'fasting' 
                ? getDisplayTime(fastingElapsed, todaySession?.fasting_window_hours ? todaySession.fasting_window_hours * 60 * 60 : 0, topCountDirection)
                : '00:00:00'
              }
            </div>
            <div className={cn(
              "text-lg font-medium transition-colors duration-300",
              todaySession?.status === 'fasting' ? 'text-foreground' : 'text-muted-foreground'
            )}>
              Fasting Window
            </div>
            
            {/* Progress indicator for fasting */}
            {todaySession?.status === 'fasting' && todaySession?.fasting_window_hours && (
              <div className="flex items-center justify-center gap-2 mt-2 text-sm text-muted-foreground">
                <span>{Math.round(getProgress(fastingElapsed, todaySession.fasting_window_hours * 60 * 60))}% complete</span>
              </div>
            )}
          </div>
          
          {/* Gentle Dividing Line */}
          <div className="w-full h-px bg-border/30 my-3"></div>
          
          {/* Bottom Display - Eating window status/timer */}
          <div>
            {todaySession?.status === 'eating' ? (
              <>
                <div 
                  className="text-2xl font-mono font-medium text-foreground mb-1 tracking-wide"
                  style={{ 
                    fontFeatureSettings: '"tnum" 1',
                    textShadow: '0 1px 2px rgba(0,0,0,0.05)'
                  }}
                >
                  {getDisplayTime(eatingElapsed, todaySession?.eating_window_hours ? todaySession.eating_window_hours * 60 * 60 : 0, bottomCountDirection)}
                </div>
                <div className="text-sm font-medium text-foreground">
                  Eating Window
                </div>
                
                {/* Progress indicator for eating */}
                {todaySession?.eating_window_hours && (
                  <div className="flex items-center justify-center gap-2 mt-2 text-xs text-muted-foreground">
                    <span>{Math.round(getProgress(eatingElapsed, todaySession.eating_window_hours * 60 * 60))}% complete</span>
                  </div>
                )}
              </>
            ) : (
              <>
                <div 
                  className="text-2xl font-mono font-medium text-muted-foreground/70 mb-1 tracking-wide"
                  style={{ 
                    fontFeatureSettings: '"tnum" 1',
                    textShadow: '0 1px 2px rgba(0,0,0,0.05)'
                  }}
                >
                  00:00:00
                </div>
                <div className="text-sm font-medium text-muted-foreground/60">
                  Ready to Complete
                </div>
              </>
            )}
          </div>
        </div>
      </Card>

      {/* Control buttons */}
      <div className="space-y-4">
          <Button 
            onClick={handleEndFast}
            variant="action-primary"
            size="action-main"
            className="w-full"
          >
            <Square className="w-4 h-4 mr-2" />
            End Fast
          </Button>
      </div>
    </div>
  );
};