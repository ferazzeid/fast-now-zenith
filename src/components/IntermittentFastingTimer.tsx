import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Clock, Play, Square, ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { useIntermittentFasting } from '@/hooks/useIntermittentFasting';
import { CustomScheduleSlider } from './CustomScheduleSlider';
import { IFScheduleSelector } from './IFScheduleSelector';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface IntermittentFastingTimerProps {
  isActive?: boolean;
  className?: string;
}

const IF_PRESETS = [
  { name: '16:8', fastingHours: 16, eatingHours: 8, description: 'Most popular schedule' },
  { name: 'OMAD', fastingHours: 23, eatingHours: 1, description: 'One meal a day' }
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

  const [selectedTab, setSelectedTab] = useState<'quick' | 'custom'>('quick');
  const [selectedPreset, setSelectedPreset] = useState(IF_PRESETS[0]);
  const [topCountDirection, setTopCountDirection] = useState<'up' | 'down'>('up'); // Default: count up
  const [bottomCountDirection, setBottomCountDirection] = useState<'up' | 'down'>('down'); // Default: count down
  const [fastingElapsed, setFastingElapsed] = useState(0);
  const [eatingElapsed, setEatingElapsed] = useState(0);
  const [showScheduleSelector, setShowScheduleSelector] = useState(false);

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
          console.log('🎉 Fasting window complete! Auto-starting eating window...');
          endFastingWindow(todaySession.id).catch(console.error);
        }
      } else if (todaySession.status === 'eating' && todaySession.eating_start_time) {
        const eatingStart = new Date(todaySession.eating_start_time);
        const elapsed = Math.floor((now.getTime() - eatingStart.getTime()) / 1000);
        setEatingElapsed(elapsed);
        
        // Auto-transition when eating window completes
        if (todaySession.eating_window_hours && elapsed >= todaySession.eating_window_hours * 3600) {
          console.log('🔄 Eating window complete! Ending session...');
          endEatingWindow(todaySession.id).catch(console.error);
        }
      }
      
      // Reset inactive timer
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

  const handleScheduleSelect = async (fastingHours: number, eatingHours: number) => {
    setShowScheduleSelector(false);
    await startIFSession({ 
      fasting_window_hours: fastingHours, 
      eating_window_hours: eatingHours 
    });
  };

  const handleStartFastingClick = () => {
    setShowScheduleSelector(true);
  };

  const handleStartFasting = async () => {
    if (!todaySession?.id) return;
    await startFastingWindow(todaySession.id);
  };

  const handleEndFasting = async () => {
    if (!todaySession?.id) return;
    await endFastingWindow(todaySession.id);
  };

  const handleEndEating = async () => {
    if (!todaySession?.id) return;
    await endEatingWindow(todaySession.id);
  };

  // If no session exists, show setup interface
  if (!todaySession) {
    return (
      <div className={`max-w-md mx-auto space-y-6 ${className}`}>
        {/* Main Timer Card - matches screenshot exactly */}
        <Card className="p-4 text-center relative overflow-hidden min-h-[180px]">
          {/* Dual Counter Display */}
          <div className="mb-2 flex flex-col justify-center items-center">
            {/* Main Fasting Counter */}
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
              Ready to Fast
            </div>
            
            {/* Gentle Dividing Line */}
            <div className="w-full h-px bg-border/30 my-3"></div>
            
            {/* Smaller Eating Counter */}
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
              Ready to Eat
            </div>
          </div>
        </Card>

        {/* Setup Schedule Button */}
        <Button 
          onClick={handleStartFastingClick}
          variant="action-primary"
          size="start-button"
          className="w-full"
          disabled={loading}
        >
          <Play className="w-8 h-8 mr-3" />
          Setup Schedule
        </Button>

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

  // If session is in setup state, show ready to start interface
  if (todaySession?.status === 'setup') {
    return (
      <div className={`max-w-md mx-auto space-y-6 ${className}`}>
        {/* Setup Complete Card */}
        <Card className="p-4 text-center relative overflow-hidden min-h-[180px]">
          <div className="mb-2 flex flex-col justify-center items-center">
            <div 
              className="text-5xl font-mono font-bold text-warm-text mb-2 tracking-wide"
              style={{ 
                fontFeatureSettings: '"tnum" 1',
                textShadow: '0 1px 2px rgba(0,0,0,0.1)'
              }}
            >
              {todaySession.fasting_window_hours}:{todaySession.eating_window_hours}
            </div>
            <div className="text-lg font-medium text-muted-foreground mb-4">
              Schedule Ready
            </div>
            
            <div className="w-full h-px bg-border/30 my-3"></div>
            
            <div className="text-sm text-muted-foreground">
              {todaySession.fasting_window_hours} hour fast, {todaySession.eating_window_hours} hour eating window
            </div>
          </div>
        </Card>

        {/* Start Fasting Button */}
        <Button 
          onClick={handleStartFasting}
          variant="action-primary"
          size="start-button"
          className="w-full"
          disabled={loading}
        >
          <Play className="w-8 h-8 mr-3" />
          Start Fasting
        </Button>
      </div>
    );
  }

  // Active session - show unified dual timer card directly
  if (todaySession?.status === 'setup') {
    return (
      <div className={`max-w-md mx-auto space-y-6 ${className}`}>
        {/* Setup Complete Card */}
        <Card className="p-4 text-center relative overflow-hidden min-h-[180px]">
          <div className="mb-2 flex flex-col justify-center items-center">
            <div 
              className="text-5xl font-mono font-bold text-warm-text mb-2 tracking-wide"
              style={{ 
                fontFeatureSettings: '"tnum" 1',
                textShadow: '0 1px 2px rgba(0,0,0,0.1)'
              }}
            >
              {todaySession.fasting_window_hours}:{todaySession.eating_window_hours}
            </div>
            <div className="text-lg font-medium text-muted-foreground mb-4">
              Schedule Ready
            </div>
            
            <div className="w-full h-px bg-border/30 my-3"></div>
            
            <div className="text-sm text-muted-foreground">
              {todaySession.fasting_window_hours} hour fast, {todaySession.eating_window_hours} hour eating window
            </div>
          </div>
        </Card>

        {/* Start Fasting Button */}
        <Button 
          onClick={handleStartFasting}
          variant="action-primary"
          size="start-button"
          className="w-full"
          disabled={loading}
        >
          <Play className="w-8 h-8 mr-3" />
          Start Fasting
        </Button>
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
              Fasting Time
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
                  {todaySession?.status === 'fasting' ? 'Awaiting Eating Window' : 'Ready to Eat'}
                </div>
              </>
            )}
          </div>
        </div>
      </Card>

      {/* Control buttons */}
      <div className="space-y-4">
        {todaySession?.status === 'fasting' && (
          <Button 
            onClick={handleEndFasting}
            variant="action-primary"
            size="action-main"
            className="w-full"
          >
            End Fasting & Start Eating
          </Button>
        )}
        
        {todaySession?.status === 'eating' && (
          <Button 
            onClick={handleEndEating}
            variant="action-primary"
            size="action-main"
            className="w-full"
          >
            End Eating
          </Button>
        )}
      </div>
    </div>
  );
};