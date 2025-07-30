import { useState, useEffect } from 'react';
import { Play, Square, Settings, AlertTriangle, ChevronDown, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CeramicTimer } from '@/components/CeramicTimer';
import { WalkingTimer } from '@/components/WalkingTimer';
import { FastSelector } from '@/components/FastSelector';
import { CrisisChatModal } from '@/components/CrisisChatModal';
import { StopFastConfirmDialog } from '@/components/StopFastConfirmDialog';

import { useToast } from '@/hooks/use-toast';
import { useFastingSession } from '@/hooks/useFastingSession';
import { useWalkingSession } from '@/hooks/useWalkingSession';
import { useTimerNavigation } from '@/hooks/useTimerNavigation';
import { useCrisisSettings } from '@/hooks/useCrisisSettings';
import { useCrisisConversation } from '@/hooks/useCrisisConversation';
import { SOSButton } from '@/components/SOSButton';

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
  
  // Crisis modal static context state
  const [crisisContext, setCrisisContext] = useState<string>('');
  const [crisisSystemPrompt, setCrisisSystemPrompt] = useState<string>('');
  const [crisisProactiveMessage, setCrisisProactiveMessage] = useState<string>('');
  const [crisisQuickReplies, setCrisisQuickReplies] = useState<string[]>([]);
  
  const [walkingTime, setWalkingTime] = useState(0);
  
  const { currentSession: fastingSession, startFastingSession, endFastingSession, loadActiveSession } = useFastingSession();
  const { currentSession: walkingSession, startWalkingSession, endWalkingSession } = useWalkingSession();
  const { currentMode, timerStatus, switchMode, formatTime } = useTimerNavigation();
  const { toast } = useToast();
  const { settings: crisisSettings } = useCrisisSettings();
  const { 
    generateCrisisContext, 
    generateSystemPrompt, 
    generateProactiveMessage, 
    generateQuickReplies 
  } = useCrisisConversation();

  const isRunning = !!fastingSession;

  useEffect(() => {
    console.log('Timer: Loading active session...');
    loadActiveSession();
  }, [loadActiveSession]);

  useEffect(() => {
    console.log('Timer: Fasting session changed:', fastingSession);
    // Set fastType based on current session if available
    if (fastingSession?.goal_duration_seconds) {
      const goalHours = Math.floor(fastingSession.goal_duration_seconds / 3600);
      console.log('Timer: Setting fast type based on goal hours:', goalHours);
      if (goalHours <= 23) {
        setFastType('intermittent');
        setFastDuration(fastingSession.goal_duration_seconds);
      } else {
        setFastType('longterm');
        setFastDuration(fastingSession.goal_duration_seconds);
      }
    }
  }, [fastingSession]);

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
    if (fastType === 'intermittent') {
      const totalCycleTime = fastDuration + eatingWindow;
      const cyclePosition = timeElapsed % totalCycleTime;
      
      if (isInEatingWindow) {
        // Always show countdown for eating window
        const eatingStartTime = cyclePosition - fastDuration;
        const eatingTimeRemaining = Math.max(0, eatingWindow - eatingStartTime);
        return formatTimeFasting(eatingTimeRemaining);
      } else {
        // For fasting phase, respect count direction
        if (countDirection === 'up') {
          return formatTimeFasting(cyclePosition);
        } else {
          const remaining = Math.max(0, fastDuration - cyclePosition);
          return formatTimeFasting(remaining);
        }
      }
    } else {
      // Long-term fasting logic unchanged
      if (countDirection === 'up') {
        return formatTimeFasting(timeElapsed);
      } else {
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
    if (fastType === 'intermittent') {
      const totalCycleTime = fastDuration + eatingWindow;
      const cyclePosition = timeElapsed % totalCycleTime;
      
      if (isInEatingWindow) {
        // For eating window, show progress of eating time used
        const eatingStartTime = cyclePosition - fastDuration;
        return Math.min((eatingStartTime / eatingWindow) * 100, 100);
      } else {
        // For fasting phase, show progress of current fast
        return Math.min((cyclePosition / fastDuration) * 100, 100);
      }
    } else {
      return Math.min((timeElapsed / fastDuration) * 100, 100);
    }
  };

  const getCurrentMode = () => {
    if (fastType === 'longterm') return 'Extended Fast';
    
    if (fastType === 'intermittent') {
      const totalCycleTime = fastDuration + eatingWindow;
      const currentCycle = Math.floor(timeElapsed / totalCycleTime) + 1;
      const baseMode = isInEatingWindow ? 'Eating Window' : 'Fasting';
      return `${baseMode} - Day ${currentCycle}`;
    }
    
    return isInEatingWindow ? 'Eating Window' : 'Fasting';
  };

  const handleFastTypeSelect = async (type: 'intermittent' | 'longterm', duration: number, eatingWindowDuration: number, startDate?: Date, startTime?: string) => {
    setFastType(type);
    setFastDuration(duration);
    setEatingWindow(eatingWindowDuration);
    setShowFastSelector(false);
    
    if (startDate && startTime) {
      // Handle retroactive fast start
      await handleRetroactiveFastStart(startDate.toISOString().split('T')[0], startTime, type, duration);
    } else {
      // Automatically start the fast after selection
      const result = await startFastingSession(duration);
      if (result) {
        toast({
          title: "Fast started",
          description: `Your ${formatTimeFasting(duration)} fast has begun!`
        });
      }
    }
  };

  const handleRetroactiveFastStart = async (startDate: string, startTime: string, fastType: 'intermittent' | 'longterm', duration: number) => {
    try {
      // Calculate the past start time
      const pastStartDateTime = new Date(`${startDate}T${startTime}`);
      
      // Start the fast with the custom start time in the database
      const result = await startFastingSession(duration, pastStartDateTime);
      
      if (result) {
        // Load the session to get accurate timing
        await loadActiveSession();
        
        const now = new Date();
        const timeDiffMs = now.getTime() - pastStartDateTime.getTime();
        const elapsedSeconds = Math.floor(timeDiffMs / 1000);
        
        toast({
          title: "Fast started retroactively",
          description: `Fast started ${formatTimeFasting(elapsedSeconds)} ago`
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start retroactive fast",
        variant: "destructive"
      });
    }
  };

  // Function to open crisis modal with static context
  const openCrisisModal = () => {
    // Generate context once when opening modal
    const context = generateCrisisContext({
      fastType,
      timeElapsed,
      goalDuration: fastDuration,
      progress: getProgress(),
      isInEatingWindow: isInEatingWindow
    });
    const systemPrompt = generateSystemPrompt();
    const proactiveMessage = generateProactiveMessage();
    const quickReplies = generateQuickReplies();
    
    // Store in state
    setCrisisContext(context);
    setCrisisSystemPrompt(systemPrompt);
    setCrisisProactiveMessage(proactiveMessage);
    setCrisisQuickReplies(quickReplies);
    
    // Open modal
    setShowCrisisModal(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <div className="max-w-md mx-auto pt-20 pb-20">{/* FIXED: Increased pt from 8 to 20 to prevent overlap with DailyStatsPanel */}
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
            <>
              <CeramicTimer 
                progress={getProgress()}
                displayTime={getDisplayTime()}
                isActive={isRunning}
                isEatingWindow={isInEatingWindow}
                showSlideshow={true}
                eatingWindowTimeRemaining={null}
                countDirection={countDirection}
                onToggleCountDirection={() => setCountDirection(countDirection === 'up' ? 'down' : 'up')}
                fastType={fastType}
                goalDuration={fastDuration / 3600}
              />
              {/* SOS Button - positioned relative to timer */}
              {isRunning && timeElapsed > (crisisSettings.triggerHours * 60 * 60) && (
                <SOSButton 
                  fastType={fastType}
                  timeElapsed={timeElapsed}
                  goalDuration={fastDuration}
                  progress={getProgress()}
                  isInEatingWindow={getCurrentMode() === 'eating'}
                />
              )}
            </>
          ) : (
            <WalkingTimer
              displayTime={formatTime(timerStatus.walking.timeElapsed)}
              isActive={timerStatus.walking.isActive}
              onStart={handleWalkingStart}
              onStop={handleWalkingStop}
              selectedSpeed={3}
              onSpeedChange={() => {}}
            />
          )}
        </div>

        {/* Control Buttons - Only show for fasting mode */}
        {currentMode === 'fasting' && (
          <div className="space-y-4">
            {!isRunning ? (
              <div className="space-y-3">
                <Button 
                  onClick={() => setShowFastSelector(true)}
                  className="w-full h-16 text-lg font-medium bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
                  size="lg"
                >
                  <Play className="w-6 h-6 mr-2" />
                  Start Fast
                </Button>
              </div>
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

      {/* Crisis Support Modal */}
      <CrisisChatModal 
        isOpen={showCrisisModal} 
        onClose={() => setShowCrisisModal(false)}
        context={crisisContext}
        systemPrompt={crisisSystemPrompt}
        proactiveMessage={crisisProactiveMessage}
        quickReplies={crisisQuickReplies}
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
