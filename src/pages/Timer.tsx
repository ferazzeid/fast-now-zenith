import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Square, Settings, AlertTriangle, ChevronDown, Clock, History, X, CheckCircle } from 'lucide-react';
import { PremiumGatedAIVoiceButton } from '@/components/PremiumGatedAIVoiceButton';
import { HistoryButton } from '@/components/HistoryButton';
import { PageOnboardingModal } from '@/components/PageOnboardingModal';
import { onboardingContent } from '@/data/onboardingContent';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { CeramicTimer } from '@/components/CeramicTimer';
import { WalkingTimer } from '@/components/WalkingTimer';
import { FastSelector } from '@/components/FastSelector';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';


import { StopFastConfirmDialog } from '@/components/StopFastConfirmDialog';
import { FastingHistory } from '@/components/FastingHistory';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useFastingSessionQuery } from '@/hooks/optimized/useFastingSessionQuery';
import { useWalkingSession } from '@/hooks/useWalkingSession';
import { useTimerNavigation } from '@/hooks/useTimerNavigation';
import { useProfile } from '@/hooks/useProfile';

import { trackFastingEvent } from '@/utils/analytics';
import { FastingInspirationRotator } from '@/components/FastingInspirationRotator';
import { useQuoteSettings } from '@/hooks/useQuoteSettings';
import { useMotivators } from '@/hooks/useMotivators';
import { queryClient } from '@/lib/query-client';
import { supabase } from '@/integrations/supabase/client';
import { useCelebrationMilestones } from '@/hooks/useCelebrationMilestones';
import { AuthorTooltip } from '@/components/AuthorTooltip';
import { ResponsivePageHeader } from '@/components/ResponsivePageHeader';

import { useAccess } from '@/hooks/useAccess';
import { AdminInsightDisplay } from '@/components/AdminInsightDisplay';

const Timer = () => {
  const navigate = useNavigate();
  const [timeElapsed, setTimeElapsed] = useState(0); // in seconds
  const [fastDuration, setFastDuration] = useState(60 * 60 * 60); // 60 hours default (water fast)
  const [fastType, setFastType] = useState<'longterm'>('longterm');
  const [countDirection, setCountDirection] = useState<'up' | 'down'>('up');
  const [showFastSelector, setShowFastSelector] = useState(false);
  const [showStopConfirmDialog, setShowStopConfirmDialog] = useState(false);
  const [stopAction, setStopAction] = useState<'finish' | 'cancel'>('finish');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showFastingHistory, setShowFastingHistory] = useState(false);
  
  const [walkingTime, setWalkingTime] = useState(0);

  const { currentSession: fastingSession, startFastingSession, endFastingSession, cancelFastingSession, refreshActiveSession } = useFastingSessionQuery();
  const { currentSession: walkingSession, startWalkingSession, endWalkingSession } = useWalkingSession();
  const { currentMode, timerStatus, switchMode, formatTime } = useTimerNavigation();
  const { toast } = useToast();
  const { user } = useAuth();
  const { profile } = useProfile();
  const { quotes } = useQuoteSettings();
  const { saveQuoteAsGoal } = useMotivators();
  const { celebration, checkForMilestones, resetMilestones, closeCelebration, triggerCelebration } = useCelebrationMilestones(fastingSession?.id);
  const { isAdmin } = useAccess();


  const isRunning = !!fastingSession;

  const formatTimeFasting = useCallback((seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  useEffect(() => {
    refreshActiveSession();
  }, [refreshActiveSession]);

  // Prefetch timeline hours and quotes to make the rotator instant
  useEffect(() => {
    // Fasting hours prefetch
    queryClient.prefetchQuery({
      queryKey: ['fasting', 'hours'],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('fasting_hours')
          .select('*')
          .lte('hour', 72)
          .order('hour', { ascending: true });
        if (error) throw error;
        return data || [];
      },
      staleTime: 24 * 60 * 60 * 1000,
    });

    // Quotes prefetch
    queryClient.prefetchQuery({
      queryKey: ['quotes', 'timer'],
      queryFn: async () => {
        const { data, error } = await supabase
          .from('shared_settings')
          .select('setting_key, setting_value')
          .in('setting_key', ['fasting_timer_quotes', 'walking_timer_quotes']);
        if (error) throw error;
        return data || [];
      },
      staleTime: 24 * 60 * 60 * 1000,
    });
  }, []);

  useEffect(() => {
    // Set fast type based on current session if available
    if (fastingSession?.goal_duration_seconds) {
      setFastDuration(fastingSession.goal_duration_seconds);
    }
  }, [fastingSession]);

  // Memoize the milestone check function to prevent recreation
  const stableMilestoneCheck = useCallback((elapsed: number, goalDuration?: number) => {
    checkForMilestones(elapsed, goalDuration);
  }, [checkForMilestones]);

  // Memoize the end session function to prevent recreation
  const stableEndSession = useCallback(async (sessionId: string) => {
    await endFastingSession(sessionId);
  }, [endFastingSession]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    let goalTimeout: NodeJS.Timeout;
    
    if (isRunning && fastingSession) {
      const updateTimer = () => {
        const startTime = new Date(fastingSession.start_time);
        const now = new Date();
        const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
        setTimeElapsed(elapsed);

        // Check for celebration milestones
        stableMilestoneCheck(elapsed, fastingSession.goal_duration_seconds);
      };

      // Update immediately
      updateTimer();
      
      // Then update every second for display
      interval = setInterval(updateTimer, 1000);

      // FIXED: Handle both future goals and already-passed goals
      if (fastingSession.goal_duration_seconds) {
        const startTime = new Date(fastingSession.start_time);
        const goalEndTime = new Date(startTime.getTime() + (fastingSession.goal_duration_seconds * 1000));
        const timeToGoal = goalEndTime.getTime() - Date.now();
        
        // CRITICAL FIX: If goal already passed, complete immediately
        if (timeToGoal <= 0) {
          console.log('🎉 Goal already achieved! Auto-completing fasting session immediately...');
          
          // Use setTimeout to avoid blocking the render
          setTimeout(async () => {
            try {
              const { data: { session } } = await supabase.auth.getSession();
              if (!session?.user?.id) {
                console.warn('⚠️ Goal completion triggered but user not authenticated, skipping');
                return;
              }
              
              // Verify the session is still active before ending
              const { data: currentFastingSession } = await supabase
                .from('fasting_sessions')
                .select('id, status')
                .eq('id', fastingSession.id)
                .eq('status', 'active')
                .maybeSingle();
              
              if (!currentFastingSession) {
                console.warn('⚠️ Session no longer active, skipping auto-completion');
                return;
              }
              
              await stableEndSession(fastingSession.id);
              toast({
                title: "🎉 Goal Achieved!",
                description: `Congratulations! You've completed your ${formatTimeFasting(fastingSession.goal_duration_seconds)} fast!`,
              });
            } catch (error) {
              console.error('Error auto-completing fasting session:', error);
            }
          }, 100); // Small delay to avoid blocking
        } else {
          // Goal is in the future - set timeout as before
          const MAX_TIMEOUT = 168 * 60 * 60 * 1000; // 168 hours max (7 days)
          if (timeToGoal < MAX_TIMEOUT) {
            console.log(`🎯 Setting goal completion timeout for ${timeToGoal}ms from now`);
            goalTimeout = setTimeout(async () => {
              console.log('🎉 Goal achieved! Auto-completing fasting session...');
              
              // CRITICAL: Validate session still exists and user is authenticated
              try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session?.user?.id) {
                  console.warn('⚠️ Goal timeout triggered but user not authenticated, skipping');
                  return;
                }
                
                // Verify the session is still active before ending
                const { data: currentFastingSession } = await supabase
                  .from('fasting_sessions')
                  .select('id, status')
                  .eq('id', fastingSession.id)
                  .eq('status', 'active')
                  .maybeSingle();
                
                if (!currentFastingSession) {
                  console.warn('⚠️ Session no longer active, skipping auto-completion');
                  return;
                }
                
                await stableEndSession(fastingSession.id);
                toast({
                  title: "🎉 Goal Achieved!",
                  description: `Congratulations! You've completed your ${formatTimeFasting(fastingSession.goal_duration_seconds)} fast!`,
                });
              } catch (error) {
                console.error('Error auto-completing fasting session:', error);
                // Don't show error toast to avoid user confusion
              }
            }, timeToGoal);
          } else {
            console.warn(`⚠️ Skipping goal timeout - duration too long: ${timeToGoal}ms`);
          }
        }
      }
    } else {
      setTimeElapsed(0);
    }

    return () => {
      if (interval) clearInterval(interval);
      if (goalTimeout) {
        console.log('🧹 Cleaning up goal timeout');
        clearTimeout(goalTimeout);
      }
    };
  }, [isRunning, fastingSession?.start_time, fastingSession?.id, fastingSession?.goal_duration_seconds, stableMilestoneCheck, stableEndSession, toast, formatTimeFasting]);

  const handleFastingStart = async () => {
    resetMilestones(); // Reset celebration state for new fast
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
    if (!fastingSession?.id) {
      console.error('No active fasting session found');
      toast({
        title: "Error",
        description: "No active fasting session found.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      if (stopAction === 'cancel') {
        // Cancel fast - doesn't save to history
        await cancelFastingSession(fastingSession.id);
        trackFastingEvent('stop', fastType, timeElapsed);
        // Don't show success toast - the mutation handles it
      } else {
        // Finish fast - saves to history
        await endFastingSession(fastingSession.id);
        trackFastingEvent('stop', fastType, timeElapsed);
        // Don't show success toast - the mutation handles it
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
        // Calculate elapsed time immediately
        const now = new Date();
        const timeDiffMs = now.getTime() - pastStartDateTime.getTime();
        const elapsedSeconds = Math.floor(timeDiffMs / 1000);
        
        // Immediately update the timer display to show correct elapsed time
        setTimeElapsed(elapsedSeconds);
        
        // Force an immediate refresh of the active session to update `isRunning`
        await refreshActiveSession();
        
        // Trigger the timer effect by ensuring the session data is available
        // This solves the issue where retro fasts need a page refresh
        setTimeout(() => {
          // Double-check that the session is loaded and trigger another refresh if needed
          if (!fastingSession) {
            refreshActiveSession();
          }
        }, 100);
        
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


  return (
    <div className="relative min-h-[calc(100vh-80px)] bg-background p-4 overflow-x-hidden">
      <div className="max-w-md mx-auto pt-10 pb-32 safe-bottom">
        {/* Header with Onboarding Button */}
        <ResponsivePageHeader
          title={currentMode === 'fasting' ? 'Fasting Timer' : 'Walking Timer'}
          subtitle={currentMode === 'fasting' ? getCurrentMode() : 'Track your walking session'}
          onHistoryClick={currentMode === 'fasting' ? () => navigate('/fasting-history') : undefined}
          historyTitle="View fasting history"
          showAuthorTooltip={isAdmin && currentMode === 'fasting'}
          authorTooltipContentKey="fasting_timer_insights"
          authorTooltipContent="Extended fasting triggers autophagy, improves insulin sensitivity, and can enhance mental clarity. Listen to your body and break your fast if you feel unwell. Stay hydrated!"
        />

        {/* Admin Personal Insight for Fasting */}
        {isAdmin && currentMode === 'fasting' && (
          <AdminInsightDisplay content="Extended fasting triggers autophagy, improves insulin sensitivity, and can enhance mental clarity. Listen to your body and break your fast if you feel unwell. Stay hydrated!" />
        )}

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
                celebrationAnimation={celebration.isVisible ? {
                  isActive: celebration.isVisible,
                  type: celebration.animationType,
                  onAnimationEnd: closeCelebration
                } : undefined}
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
                        variant="outline"
                        size="action-main"
                      >
                        <X className="w-5 h-5" />
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
                        Finish
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

        {/* Inspirational Content */}
        {profile?.enable_fasting_slideshow ? (
          <FastingInspirationRotator 
            quotes={quotes.fasting_timer_quotes}
            currentFastingHour={Math.max(1, Math.ceil(timeElapsed / 3600))}
            className="mt-8"
            onSaveQuote={saveQuoteAsGoal}
          />
        ) : null}
      </div>

      {/* Fast Selector Modal */}
      {showFastSelector && (
        <FastSelector
          currentDuration={fastDuration}
          onSelect={handleFastTypeSelect}
          onClose={() => setShowFastSelector(false)}
        />
      )}


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

      {/* Onboarding Modal */}
      <PageOnboardingModal
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        title={onboardingContent.timer.title}
        subtitle={onboardingContent.timer.subtitle}
        heroQuote={onboardingContent.timer.heroQuote}
        backgroundImage={onboardingContent.timer.backgroundImage}
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
