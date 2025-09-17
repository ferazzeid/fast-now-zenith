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
  const [countDirection, setCountDirection] = useState<'up' | 'down'>('down');
  const [fastingElapsed, setFastingElapsed] = useState(0);
  const [eatingElapsed, setEatingElapsed] = useState(0);
  const [showScheduleSelector, setShowScheduleSelector] = useState(false);

  // Update elapsed times every second
  useEffect(() => {
    if (!todaySession) return;

    const interval = setInterval(() => {
      const now = new Date();
      
      if (todaySession.fasting_start_time) {
        const fastingStart = new Date(todaySession.fasting_start_time);
        setFastingElapsed(Math.floor((now.getTime() - fastingStart.getTime()) / 1000));
      }
      
      if (todaySession.eating_start_time) {
        const eatingStart = new Date(todaySession.eating_start_time);
        setEatingElapsed(Math.floor((now.getTime() - eatingStart.getTime()) / 1000));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [todaySession]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getDisplayTime = (elapsed: number, goalSeconds: number) => {
    if (countDirection === 'up') {
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

  // If no active session, show simple timer with Start Fasting button
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

        {/* Start Fasting Button - matches extended fast design */}
        <Button 
          onClick={handleStartFastingClick}
          variant="action-primary"
          size="start-button"
          className="w-full"
          disabled={loading}
        >
          <Play className="w-8 h-8 mr-3" />
          Start Fasting
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

  // Active session - show unified dual timer card directly
  return (
    <div className={`max-w-md mx-auto space-y-6 ${className}`}>
      {/* Unified Dual Timer Card - first object, no session info card */}
      <Card className="p-4 text-center relative overflow-hidden min-h-[220px]">
        {/* Count Direction Toggle Button */}
        {(todaySession?.status === 'fasting' || todaySession?.status === 'eating') && (
          <div className="absolute bottom-4 right-4 z-20">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => setCountDirection(prev => prev === 'up' ? 'down' : 'up')}
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 bg-background/80 backdrop-blur-sm border border-subtle hover:bg-background/90"
                  >
                    {countDirection === 'up' ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{countDirection === 'up' ? 'Switch to countdown' : 'Switch to count-up'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}

        {/* Dual Counter Display */}
        <div className="mb-2 flex flex-col justify-center items-center">
          {/* Main Fasting Counter */}
          <div className="mb-4">
            <div 
              className="text-5xl font-mono font-bold text-warm-text mb-2 tracking-wide"
              style={{ 
                fontFeatureSettings: '"tnum" 1',
                textShadow: '0 1px 2px rgba(0,0,0,0.1)'
              }}
            >
              {getDisplayTime(fastingElapsed, selectedPreset?.fastingHours * 60 * 60 || 0)}
            </div>
            <div className={cn(
              "text-lg font-medium transition-colors duration-300",
              todaySession?.status === 'fasting' ? 'text-foreground' : 'text-muted-foreground'
            )}>
              {todaySession?.status === 'fasting' ? 'Fasting' : 'Ready to Fast'}
            </div>
            
            {/* Progress indicator for fasting */}
            {todaySession?.status === 'fasting' && (
              <div className="flex items-center justify-center gap-2 mt-2 text-sm text-muted-foreground">
                <span>{Math.round(getProgress(fastingElapsed, selectedPreset?.fastingHours * 60 * 60 || 0))}% complete</span>
              </div>
            )}
          </div>
          
          {/* Gentle Dividing Line */}
          <div className="w-full h-px bg-border/30 my-3"></div>
          
          {/* Smaller Eating Counter */}
          <div>
            <div 
              className="text-2xl font-mono font-medium text-muted-foreground/70 mb-1 tracking-wide"
              style={{ 
                fontFeatureSettings: '"tnum" 1',
                textShadow: '0 1px 2px rgba(0,0,0,0.05)'
              }}
            >
              {getDisplayTime(eatingElapsed, selectedPreset?.eatingHours * 60 * 60 || 0)}
            </div>
            <div className={cn(
              "text-sm font-medium transition-colors duration-300",
              todaySession?.status === 'eating' ? 'text-foreground' : 'text-muted-foreground/60'
            )}>
              {todaySession?.status === 'eating' ? 'Eating' : 'Ready to Eat'}
            </div>
            
            {/* Progress indicator for eating */}
            {todaySession?.status === 'eating' && (
              <div className="flex items-center justify-center gap-2 mt-2 text-xs text-muted-foreground">
                <span>{Math.round(getProgress(eatingElapsed, selectedPreset?.eatingHours * 60 * 60 || 0))}% complete</span>
              </div>
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
            End Fasting
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
        
        {todaySession?.status !== 'fasting' && todaySession?.status !== 'eating' && (
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
        )}
      </div>
    </div>
  );
};