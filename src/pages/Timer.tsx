import { useState, useEffect } from 'react';
import { Play, Square, Settings, AlertTriangle, ChevronDown, Clock, History, X, CheckCircle } from 'lucide-react';
import { PageOnboardingButton } from '@/components/PageOnboardingButton';
import { HistoryButton } from '@/components/HistoryButton';
import { PageOnboardingModal } from '@/components/PageOnboardingModal';
import { onboardingContent } from '@/data/onboardingContent';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { CeramicTimer } from '@/components/CeramicTimer';
import { WalkingTimer } from '@/components/WalkingTimer';
import { FastSelector } from '@/components/FastSelector';
import { CrisisChatModal } from '@/components/CrisisChatModal';
import { StopFastConfirmDialog } from '@/components/StopFastConfirmDialog';
import { FastingHistory } from '@/components/FastingHistory';

import { useToast } from '@/hooks/use-toast';
import { useFastingSessionQuery } from '@/hooks/optimized/useFastingSessionQuery';
import { useWalkingSession } from '@/hooks/useWalkingSession';
import { useTimerNavigation } from '@/hooks/useTimerNavigation';
import { useCrisisSettings } from '@/hooks/useCrisisSettings';
import { useCrisisConversation } from '@/hooks/useCrisisConversation';
import { useProfile } from '@/hooks/useProfile';
import { SOSButton } from '@/components/SOSButton';
import { trackFastingEvent } from '@/utils/analytics';

const Timer = () => {
  const [timeElapsed, setTimeElapsed] = useState(0); // in seconds
  const [fastDuration, setFastDuration] = useState(72 * 60 * 60); // 72 hours default (water fast)
  const [fastType, setFastType] = useState<'longterm'>('longterm');
  const [countDirection, setCountDirection] = useState<'up' | 'down'>('up');
  const [showFastSelector, setShowFastSelector] = useState(false);
  const [showCrisisModal, setShowCrisisModal] = useState(false);
  const [showStopConfirmDialog, setShowStopConfirmDialog] = useState(false);
  const [stopAction, setStopAction] = useState<'finish' | 'cancel'>('finish');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showFastingHistory, setShowFastingHistory] = useState(false);
  
  // Crisis modal static context state
  const [crisisContext, setCrisisContext] = useState<string>('');
  const [crisisSystemPrompt, setCrisisSystemPrompt] = useState<string>('');
  const [crisisProactiveMessage, setCrisisProactiveMessage] = useState<string>('');
  const [crisisQuickReplies, setCrisisQuickReplies] = useState<string[]>([]);
  
  const [walkingTime, setWalkingTime] = useState(0);
  
  const { currentSession: fastingSession, startFastingSession, endFastingSession, cancelFastingSession, refreshActiveSession } = useFastingSessionQuery();
  const { currentSession: walkingSession, startWalkingSession, endWalkingSession } = useWalkingSession();
  const { currentMode, timerStatus, switchMode, formatTime } = useTimerNavigation();
  const { toast } = useToast();
  const { profile } = useProfile();
  // PERFORMANCE FIX: Only load crisis hooks when crisis modal is actually open
  // This prevents excessive API calls on every Timer page load
  const { settings: crisisSettings } = showCrisisModal ? useCrisisSettings() : { settings: null };
  const { 
    generateCrisisContext, 
    generateSystemPrompt, 
    generateProactiveMessage, 
    generateQuickReplies 
  } = showCrisisModal ? useCrisisConversation() : {
    generateCrisisContext: () => '',
    generateSystemPrompt: () => '',
    generateProactiveMessage: () => '',
    generateQuickReplies: () => []
  };

  const isRunning = !!fastingSession;

  useEffect(() => {
    console.log('Timer: Loading active session...');
    refreshActiveSession();
  }, [refreshActiveSession]);

  useEffect(() => {
    console.log('Timer: Fasting session changed:', fastingSession);
    // Set fastType based on current session if available
    if (fastingSession?.goal_duration_seconds) {
      const goalHours = Math.floor(fastingSession.goal_duration_seconds / 3600);
      console.log('Timer: Setting fast type based on goal hours:', goalHours);
      setFastDuration(fastingSession.goal_duration_seconds);
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


      };

      // Update immediately
      updateTimer();
      
      // Then update every second
      interval = setInterval(updateTimer, 1000);
    } else {
      setTimeElapsed(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, fastingSession?.start_time, fastDuration]);

  const handleFastingStart = async () => {
    const result = await startFastingSession({ goal_duration_seconds: fastDuration });
    if (result) {
      trackFastingEvent('start', fastType, fastDuration);
      toast({
        title: "Fast started",
        description: `Your ${formatTimeFasting(fastDuration)} fast has begun!`
      });
    }
  };

  const handleFastingStop = async () => {
    if (!fastingSession) return;
    
    try {
      if (stopAction === 'cancel') {
        // Cancel fast - doesn't save to history
        const result = await cancelFastingSession(fastingSession.id);
        if (result) {
          trackFastingEvent('cancel', fastType, timeElapsed);
          toast({
            title: "Fast cancelled", 
            description: "Your fast was cancelled and removed from history."
          });
        }
      } else {
        // Finish fast - saves to history
        const result = await endFastingSession(fastingSession.id);
        if (result) {
          trackFastingEvent('stop', fastType, timeElapsed);
          toast({
            title: "Fast completed", 
            description: `Great job! You fasted for ${formatTimeFasting(timeElapsed)}`
          });
        }
      }
    } catch (error) {
      console.error('Error stopping fasting session:', error);
      toast({
        title: "Error",
        description: "Failed to stop fasting session. Please try again.",
        variant: "destructive",
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
      const remaining = Math.max(0, fastDuration - timeElapsed);
      return formatTimeFasting(remaining);
    }
  };



  const getProgress = () => {
    return Math.min((timeElapsed / fastDuration) * 100, 100);
  };

  const getCurrentMode = () => {
    // If there's no active session, show placeholder
    if (!fastingSession) {
      return 'Start Your Fast';
    }
    
    return 'Extended Fast';
  };

  const handleFastTypeSelect = async (duration: number, startDateTime?: Date, displayTime?: string) => {
    setFastType('longterm');
    setFastDuration(duration);
    setShowFastSelector(false);
    
    if (startDateTime && displayTime) {
      // Handle retroactive fast start
      await handleRetroactiveFastStart(startDateTime, duration);
    } else {
      // Automatically start the fast after selection
      const result = await startFastingSession({ goal_duration_seconds: duration });
      if (result) {
        toast({
          title: "Fast started",
          description: `Your ${formatTimeFasting(duration)} fast has begun!`
        });
      }
    }
  };

  const handleRetroactiveFastStart = async (pastStartDateTime: Date, duration: number) => {
    try {
      // Start the fast with the custom start time in the database
      const result = await startFastingSession({ 
        goal_duration_seconds: duration, 
        start_time: pastStartDateTime 
      });
      
      if (result) {
        // Load the session to get accurate timing
        await refreshActiveSession();
        
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
      progress: getProgress()
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
    <div className="relative min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <div className="max-w-md mx-auto pt-10 pb-20">{/* FIXED: Reduced pt from 20 to 10 for better spacing */}
        {/* Header with Onboarding Button */}
        <div className="mb-4 mt-4 relative">
          <div className="absolute left-0 top-0">
            <PageOnboardingButton onClick={() => setShowOnboarding(true)} />
          </div>
          {/* History button - only show for fasting mode */}
          {currentMode === 'fasting' && (
            <div className="absolute right-0 top-0">
              <HistoryButton onClick={() => setShowFastingHistory(true)} title="View fasting history" />
            </div>
          )}
          <div className="pl-12 pr-12">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent mb-1">
              {currentMode === 'fasting' ? 'Fasting Timer' : 'Walking Timer'}
            </h1>
            <p className="text-sm text-muted-foreground text-left">
              {currentMode === 'fasting' ? getCurrentMode() : 'Track your walking session'}
            </p>
          </div>
        </div>

        {/* Timer Display */}
        <div className="relative mb-12 mt-12">
          {currentMode === 'fasting' ? (
            <>
              <CeramicTimer 
                progress={getProgress()}
                displayTime={getDisplayTime()}
                isActive={isRunning}
                showSlideshow={profile?.enable_fasting_slideshow ?? false}
                countDirection={countDirection}
                onToggleCountDirection={() => setCountDirection(countDirection === 'up' ? 'down' : 'up')}
                fastType={fastType}
                goalDuration={fastDuration / 3600}
              />
            </>
          ) : (
            <WalkingTimer
              displayTime={formatTime(timerStatus.walking.timeElapsed)}
              isActive={timerStatus.walking.isActive}
              onStart={handleWalkingStart}
              onStop={handleWalkingStop}
              showSlideshow={profile?.enable_walking_slideshow ?? false}
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
                  variant="action-primary"
                  size="start-button"
                  className="w-full"
                >
                  <Play className="w-8 h-8 mr-3" />
                  Start Fasting
                </Button>
              </div>
            ) : (
              <TooltipProvider>
                <div className="grid grid-cols-2 gap-3">
                  {/* Cancel Fast Button */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        onClick={() => {
                          setStopAction('cancel');
                          setShowStopConfirmDialog(true);
                        }}
                        variant="action-primary"
                        size="action-main"
                      >
                        <X className="w-5 h-5 mr-2" />
                        Cancel Fast
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Cancel your fast without saving it to history</p>
                    </TooltipContent>
                  </Tooltip>

                  {/* Finish Fast Button */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        onClick={() => {
                          setStopAction('finish');
                          setShowStopConfirmDialog(true);
                        }}
                        variant="action-primary"
                        size="action-main"
                      >
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Finish Fast
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Complete your fast and save it to history</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </TooltipProvider>
            )}
          </div>
        )}

        {/* REMOVED: Timer Direction Toggle moved to top-right of timer */}
      </div>

      {/* Fast Selector Modal */}
      {showFastSelector && (
        <FastSelector
          currentDuration={fastDuration}
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
        actionType={stopAction}
      />

      {/* Fasting History Modal */}
      {showFastingHistory && (
        <FastingHistory onClose={() => setShowFastingHistory(false)} />
      )}

      {/* Onboarding Modal */}
      <PageOnboardingModal
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        title={onboardingContent.timer.title}
        subtitle={onboardingContent.timer.subtitle}
        heroQuote={onboardingContent.timer.heroQuote}
      >
        <div className="space-y-6">
          <div className="text-center">
            <p className="text-lg text-warm-text/80 mb-6">{onboardingContent.timer.subtitle}</p>
          </div>
          
          {onboardingContent.timer.sections.map((section, index) => {
            const IconComponent = section.icon;
            return (
              <div key={index} className="flex gap-4 p-4 rounded-xl bg-ceramic-base/50">
                <div className="flex-shrink-0 w-12 h-12 bg-ceramic-plate rounded-full flex items-center justify-center">
                  <IconComponent className="w-6 h-6 text-warm-text" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-warm-text mb-2">{section.title}</h3>
                  <p className="text-warm-text/70 text-sm leading-relaxed">{section.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </PageOnboardingModal>

    </div>
  );
};

export default Timer;
