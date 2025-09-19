import { useState, useEffect } from 'react';
import { X, Play, Square, ChevronUp, ChevronDown } from 'lucide-react';
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
import { ImprovedUnifiedMotivatorRotation } from './ImprovedUnifiedMotivatorRotation';
import { InlineTimer } from './InlineTimer';
import { FastingModeToggle } from './FastingModeToggle';
import { useTimerNavigation } from '@/hooks/useTimerNavigation';

interface IntermittentFastingTimerProps {
  isActive?: boolean;
  className?: string;
  showSlideshow?: boolean;
}

const IF_PRESETS = [
  { name: '18:6', fastingHours: 18, eatingHours: 6, description: 'Extended fasting' },
  { name: '16:8', fastingHours: 16, eatingHours: 8, description: 'Most popular schedule' },
  { name: '23:1', fastingHours: 23, eatingHours: 1, description: 'One meal a day' }
];

export const IntermittentFastingTimer: React.FC<IntermittentFastingTimerProps> = ({
  isActive = false,
  className = "",
  showSlideshow = false
}) => {
  const [motivatorMode, setMotivatorMode] = useState<'timer-focused' | 'motivator-focused'>('timer-focused');
  const { currentMode, switchMode } = useTimerNavigation();
  const {
    todaySession,
    startIFSession,
    startFastingWindow,
    endFastingWindow,
    endEatingWindow,
    loading,
    ifEnabled
  } = useIntermittentFasting();

  // Debug logging removed to reduce console spam

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

  const handleScheduleSelect = async (fastingHours: number, eatingHours: number, customStartTime?: Date) => {
    setShowScheduleSelector(false);
    
    // Remember the schedule for manual restarts
    setLastSchedule({ fastingHours, eatingHours });
    
    try {
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
            
            <div className="w-full h-px bg-border my-3"></div>
            
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
            <Button 
              onClick={() => setShowScheduleSelector(true)}
              variant="outline"
              size="sm"
              className="w-full"
            >
              Change Schedule
            </Button>
          )}
        </div>

        {/* Auto-restart Toggle - Bottom positioned for consistency */}
        <Card className="p-3">
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <div className="text-xs text-muted-foreground">
                {autoRestart ? 'Auto-cycle enabled' : 'Manual restart'}
              </div>
            </div>
            <div className="flex items-center gap-1">
              {/* Toggle with same design as E/I toggle */}
              <div className="scale-85">
                <div className="bg-muted rounded-md p-0.5 shadow-sm">
                  <div className="flex">
                    <button
                      onClick={() => setAutoRestart(false)}
                      className={cn(
                        "h-7 px-3 text-xs font-medium w-[32px] cursor-pointer transition-all duration-200 rounded-sm flex items-center justify-center",
                        !autoRestart 
                          ? "bg-background shadow-sm text-foreground" 
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      M
                    </button>
                    <button
                      onClick={() => setAutoRestart(true)}
                      className={cn(
                        "h-7 px-3 text-xs font-medium w-[32px] cursor-pointer transition-all duration-200 rounded-sm flex items-center justify-center",
                        autoRestart 
                          ? "bg-background shadow-sm text-foreground" 
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      A
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>



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
        {/* Unified motivator rotation (images + titles) */}
        {showSlideshow && (todaySession?.status === 'fasting' || todaySession?.status === 'eating') && (
          <div className="absolute inset-0 rounded-lg overflow-hidden">
            <ImprovedUnifiedMotivatorRotation 
              isActive={showSlideshow && (todaySession?.status === 'fasting' || todaySession?.status === 'eating')} 
              onModeChange={setMotivatorMode}
              className="rounded-lg"
              quotesType="fasting"
            />
          </div>
        )}
        
        {/* Inline Timer - shows when slideshow is active */}
        <InlineTimer 
          displayTime={
            todaySession?.status === 'fasting' 
              ? getDisplayTime(fastingElapsed, todaySession?.fasting_window_hours ? todaySession.fasting_window_hours * 60 * 60 : 0, topCountDirection)
              : todaySession?.status === 'eating'
              ? getDisplayTime(eatingElapsed, todaySession?.eating_window_hours ? todaySession.eating_window_hours * 60 * 60 : 0, bottomCountDirection)
              : '00:00:00'
          }
          isVisible={(todaySession?.status === 'fasting' || todaySession?.status === 'eating') && motivatorMode === 'motivator-focused'}
        />

        {/* Top Counter Toggle Button */}
        {todaySession?.status === 'fasting' && motivatorMode === 'timer-focused' && (
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
        {todaySession?.status === 'eating' && motivatorMode === 'timer-focused' && (
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
        <div 
          className={cn(
            "mb-2 flex flex-col justify-center items-center transition-opacity duration-1000",
            motivatorMode === 'motivator-focused' ? 'opacity-0 pointer-events-none' : 'opacity-100'
          )}
          style={{ zIndex: 13 }}
        >
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
          <div className="w-full h-px bg-border my-3"></div>
          
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