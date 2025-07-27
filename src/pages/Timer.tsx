import { useState, useEffect } from 'react';
import { Play, Square, Settings, AlertTriangle, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CeramicTimer } from '@/components/CeramicTimer';
import { WalkingTimer } from '@/components/WalkingTimer';
import { FastSelector } from '@/components/FastSelector';
import { CrisisModal } from '@/components/CrisisModal';
import { StopFastConfirmDialog } from '@/components/StopFastConfirmDialog';
import { useToast } from '@/hooks/use-toast';
import { useFastingSession } from '@/hooks/useFastingSession';
import { useWalkingSession } from '@/hooks/useWalkingSession';
import { useTimerNavigation } from '@/hooks/useTimerNavigation';
import { useNavigate } from 'react-router-dom';

const Timer = () => {
  const [timeElapsed, setTimeElapsed] = useState(0); // in seconds
  const [fastDuration, setFastDuration] = useState(72 * 60 * 60); // 72 hours default (water fast)
  const [fastType, setFastType] = useState<'intermittent' | 'longterm'>('longterm');
  const [eatingWindow, setEatingWindow] = useState(8 * 60 * 60); // 8 hours
  const [isInEatingWindow, setIsInEatingWindow] = useState(false);
  const [countDirection, setCountDirection] = useState<'up' | 'down'>('up');
  const [showFastSelector, setShowFastSelector] = useState(false);
  const [showCrisisModal, setShowCrisisModal] = useState(false);
  const [showStopConfirmDialog, setShowStopConfirmDialog] = useState(false);
  const [walkingTime, setWalkingTime] = useState(0);
  
  const { toast } = useToast();
  const navigate = useNavigate();
  const { currentSession: fastingSession, startFastingSession, endFastingSession, loadActiveSession } = useFastingSession();
  const { currentSession: walkingSession, startWalkingSession, endWalkingSession } = useWalkingSession();
  const { currentMode, timerStatus, switchMode, formatTime } = useTimerNavigation();

  const isRunning = !!fastingSession;

  useEffect(() => {
    loadActiveSession();
    // Set fastType based on current session if available
    if (fastingSession?.goal_duration_seconds) {
      const goalHours = Math.floor(fastingSession.goal_duration_seconds / 3600);
      if (goalHours <= 23) {
        setFastType('intermittent');
        setFastDuration(fastingSession.goal_duration_seconds);
      } else {
        setFastType('longterm');
        setFastDuration(fastingSession.goal_duration_seconds);
      }
    }
  }, [loadActiveSession, fastingSession]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning && fastingSession) {
      const updateTimer = () => {
        const startTime = new Date(fastingSession.start_time);
        const now = new Date();
        const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
        setTimeElapsed(elapsed);

        // Check if we should be in eating window for intermittent fasting
        if (fastType === 'intermittent' && elapsed >= fastDuration) {
          const totalCycleTime = fastDuration + eatingWindow;
          const cyclePosition = elapsed % totalCycleTime;
          const shouldBeInEatingWindow = cyclePosition >= fastDuration;
          setIsInEatingWindow(shouldBeInEatingWindow);
        } else {
          setIsInEatingWindow(false);
        }
      };

      // Update immediately
      updateTimer();
      
      // Then update every second
      interval = setInterval(updateTimer, 1000);
    } else {
      setTimeElapsed(0);
      setIsInEatingWindow(false);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, fastingSession?.start_time, fastDuration, eatingWindow, fastType]);

  const handleFastingStart = async () => {
    const result = await startFastingSession(fastDuration);
    if (result) {
      toast({
        title: "Fast started",
        description: `Your ${formatTimeFasting(fastDuration)} fast has begun!`
      });
    }
  };

  const handleFastingStop = async () => {
    if (!fastingSession) return;
    
    const result = await endFastingSession();
    if (result) {
      toast({
        title: "Fast completed", 
        description: `Great job! You fasted for ${formatTimeFasting(timeElapsed)}`
      });
    }
  };

  const handleWalkingStart = async () => {
    const result = await startWalkingSession();
    if (result.error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.error.message
      });
    } else {
      toast({
        title: "Walking started",
        description: "Your walking session has begun!"
      });
    }
  };

  const handleWalkingStop = async () => {
    if (!walkingSession) return;
    
    const result = await endWalkingSession();
    if (result.error) {
      toast({
        variant: "destructive",
        title: "Error", 
        description: result.error.message
      });
    } else {
      toast({
        title: "Walking completed",
        description: `Session completed! Calories burned: ${result.data?.calories_burned || 0}`
      });
    }
  };

  const formatTimeFasting = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getDisplayTime = () => {
    if (countDirection === 'up') {
      return formatTimeFasting(timeElapsed);
    } else {
      if (isInEatingWindow) {
        // For eating window countdown, show time remaining in eating window
        const eatingStartTime = timeElapsed - fastDuration;
        const eatingTimeRemaining = Math.max(0, eatingWindow - eatingStartTime);
        return formatTimeFasting(eatingTimeRemaining);
      } else {
        // For fasting countdown, show time remaining until fast goal
        const remaining = Math.max(0, fastDuration - timeElapsed);
        return formatTimeFasting(remaining);
      }
    }
  };

  const getEatingWindowTimeRemaining = () => {
    if (!isInEatingWindow) return null;
    const eatingStartTime = timeElapsed - fastDuration;
    const eatingTimeRemaining = Math.max(0, eatingWindow - eatingStartTime);
    return formatTimeFasting(eatingTimeRemaining);
  };

  const getProgress = () => {
    if (isInEatingWindow) {
      const eatingStartTime = timeElapsed - fastDuration;
      return Math.min((eatingStartTime / eatingWindow) * 100, 100);
    } else {
      return Math.min((timeElapsed / fastDuration) * 100, 100);
    }
  };

  const getCurrentMode = () => {
    if (fastType === 'longterm') return 'Extended Fast';
    return isInEatingWindow ? 'Eating Window' : 'Fasting';
  };

  const handleFastTypeSelect = async (type: 'intermittent' | 'longterm', duration: number, eatingWindowDuration: number) => {
    setFastType(type);
    setFastDuration(duration);
    setEatingWindow(eatingWindowDuration);
    setShowFastSelector(false);
    
    // Automatically start the fast after selection
    const result = await startFastingSession(duration);
    if (result) {
      toast({
        title: "Fast started",
        description: `Your ${formatTimeFasting(duration)} fast has begun!`
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <div className="max-w-md mx-auto pt-20 pb-20">{/* FIXED: Increased pt from 8 to 20 to prevent overlap */}
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent mb-2">
            {currentMode === 'fasting' ? 'Fasting Timer' : 'Walking Timer'}
          </h1>
          <p className="text-muted-foreground">
            {currentMode === 'fasting' ? getCurrentMode() : 'Track your walking session'}
          </p>
        </div>

        {/* Timer Display */}
        <div className="relative mb-8">
          {currentMode === 'fasting' ? (
            <CeramicTimer 
              progress={getProgress()}
              displayTime={getDisplayTime()}
              isActive={isRunning}
              isEatingWindow={isInEatingWindow}
              showSlideshow={true}
              eatingWindowTimeRemaining={getEatingWindowTimeRemaining()}
              countDirection={countDirection}
              onToggleCountDirection={() => setCountDirection(countDirection === 'up' ? 'down' : 'up')}
            />
          ) : (
            <WalkingTimer
              displayTime={formatTime(timerStatus.walking.timeElapsed)}
              isActive={timerStatus.walking.isActive}
              onStart={handleWalkingStart}
              onStop={handleWalkingStop}
            />
          )}
        </div>

        {/* Control Buttons - Only show for fasting mode */}
        {currentMode === 'fasting' && (
          <div className="space-y-4">
            {!isRunning ? (
              <Button 
                onClick={() => setShowFastSelector(true)}
                className="w-full h-16 text-lg font-medium bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
                size="lg"
              >
                <Play className="w-6 h-6 mr-2" />
                Start Fast
              </Button>
            ) : (
              <Button 
                onClick={() => setShowStopConfirmDialog(true)}
                variant="ghost"
                className="w-full h-16 text-lg font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-muted"
                size="lg"
              >
                <Square className="w-6 h-6 mr-2" />
                Stop Fast
              </Button>
            )}
          </div>
        )}

        {/* Current Fast Info - Only show when running */}
        {currentMode === 'fasting' && isRunning && (
          <div className="mt-6 p-4 rounded-xl bg-ceramic-base/50 border border-ceramic-rim">
            <h3 className="font-medium text-warm-text mb-4">Current Fast</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type:</span>
                <span className="font-medium">{fastType === 'intermittent' ? 'Intermittent Fasting' : 'Water Fast'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Goal:</span>
                <span className="font-medium">{formatTimeFasting(fastDuration)}</span>
              </div>
              {fastType === 'intermittent' && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Eating Window:</span>
                  <span className="font-medium">{formatTimeFasting(eatingWindow)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Elapsed:</span>
                <span className="font-medium text-primary">{formatTimeFasting(timeElapsed)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Fast Settings - Only show for fasting mode */}
        {currentMode === 'fasting' && !isRunning && (
          <div className="mt-6 p-4 rounded-xl bg-ceramic-base/50 border border-ceramic-rim">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium text-warm-text">Fast Settings</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFastSelector(true)}
                className="text-primary hover:bg-ceramic-rim"
              >
                <Settings className="w-4 h-4 mr-2" />
                Change
              </Button>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type:</span>
                <span className="font-medium">{fastType === 'intermittent' ? 'Intermittent Fasting' : 'Water Fast'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Duration:</span>
                <span className="font-medium">{formatTimeFasting(fastDuration)}</span>
              </div>
              {fastType === 'intermittent' && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Eating Window:</span>
                  <span className="font-medium">{formatTimeFasting(eatingWindow)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Crisis Support - Only show for fasting mode */}
        {currentMode === 'fasting' && isRunning && timeElapsed > 24 * 60 * 60 && ( // Show after 24 hours
          <div className="mt-6">
            <Button
              onClick={() => setShowCrisisModal(true)}
              variant="outline"
              className="w-full h-12 text-orange-600 border-orange-200 hover:bg-orange-50"
            >
              <AlertTriangle className="w-5 h-5 mr-2" />
              Need Support?
            </Button>
          </div>
        )}

        {/* REMOVED: Timer Direction Toggle moved to top-right of timer */}
      </div>

      {/* Fast Selector Modal */}
      {showFastSelector && (
        <FastSelector
          currentType={fastType}
          currentDuration={fastDuration}
          currentEatingWindow={eatingWindow}
          onSelect={handleFastTypeSelect}
          onClose={() => setShowFastSelector(false)}
        />
      )}

      {/* Crisis Modal */}
      <CrisisModal 
        isOpen={showCrisisModal} 
        onClose={() => setShowCrisisModal(false)} 
      />

      {/* Stop Fast Confirmation Dialog */}
      <StopFastConfirmDialog
        open={showStopConfirmDialog}
        onOpenChange={setShowStopConfirmDialog}
        onConfirm={() => {
          setShowStopConfirmDialog(false);
          handleFastingStop();
        }}
        currentDuration={formatTimeFasting(timeElapsed)}
      />
    </div>
  );
};

export default Timer;