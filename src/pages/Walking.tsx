import { useState, useEffect } from 'react';
import { WalkingTimer } from '@/components/WalkingTimer';
import { PageOnboardingButton } from '@/components/PageOnboardingButton';
import { PageOnboardingModal } from '@/components/PageOnboardingModal';
import { onboardingContent } from '@/data/onboardingContent';
import { SpeedSelector } from '@/components/SpeedSelector';
import { ProfileCompletionPrompt } from '@/components/ProfileCompletionPrompt';
import { WalkingHistory } from '@/components/WalkingHistory';

import { StopWalkingConfirmDialog } from '@/components/StopWalkingConfirmDialog';
import { useToast } from '@/hooks/use-toast';
import { useWalkingSession } from '@/hooks/useWalkingSession';
import { useProfile } from '@/hooks/useProfile';
import { ClearWalkingHistoryButton } from '@/components/ClearWalkingHistoryButton';
import { useWalkingStats } from '@/contexts/WalkingStatsContext';
import { trackWalkingEvent } from '@/utils/analytics';

const Walking = () => {
  const [showProfilePrompt, setShowProfilePrompt] = useState(false);
  const [showStopConfirm, setShowStopConfirm] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [localTimeElapsed, setLocalTimeElapsed] = useState(0);
  const { toast } = useToast();
  const { 
    currentSession, 
    loading, 
    selectedSpeed, 
    setSelectedSpeed, 
    isPaused,
    startWalkingSession, 
    pauseWalkingSession,
    resumeWalkingSession,
    endWalkingSession,
    updateSessionSpeed
  } = useWalkingSession();
  const { profile } = useProfile();
  const { walkingStats } = useWalkingStats();

  const isRunning = !!currentSession;

  // Local timer logic - similar to fasting timer
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (currentSession && !isPaused) {
      const updateLocalTime = () => {
        const now = Date.now();
        const startTime = new Date(currentSession.start_time).getTime();
        const pausedDuration = currentSession.total_pause_duration || 0;
        const elapsed = Math.floor((now - startTime - pausedDuration) / 1000);
        setLocalTimeElapsed(Math.max(0, elapsed));
      };

      // Update immediately
      updateLocalTime();
      // Then set interval
      interval = setInterval(updateLocalTime, 1000);
    } else if (!currentSession) {
      // Reset when no session
      setLocalTimeElapsed(0);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [currentSession, isPaused]);

  // Stats are now managed by WalkingStatsContext

  const handleStart = async () => {
    // Start walking session directly without blocking
    const result = await startWalkingSession(selectedSpeed);
    if (result.error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.error.message
      });
    } else {
      trackWalkingEvent('start', selectedSpeed);
      toast({
        title: "Walking started",
        description: `Walking session started at ${selectedSpeed} mph pace.`
      });
    }
  };

  const handlePause = async () => {
    const result = await pauseWalkingSession();
    if (result.error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.error.message
      });
    } else {
      trackWalkingEvent('pause', selectedSpeed, localTimeElapsed);
    }
  };

  const handleResume = async () => {
    const result = await resumeWalkingSession();
    if (result.error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.error.message
      });
    } else {
      trackWalkingEvent('resume', selectedSpeed);
    }
  };

  const handleStopConfirm = async () => {
    console.log('Stop walking confirmed - ending session immediately');
    setShowStopConfirm(false);
    
    // Immediately show feedback that session is ending
    toast({
      title: "Stopping session...",
      description: "Saving your walking session data."
    });
    
    const result = await endWalkingSession();
    if (result.error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.error.message
      });
    } else {
      trackWalkingEvent('stop', selectedSpeed, localTimeElapsed);
      toast({
        title: "Walking completed!",
        description: `Great job! You walked for ${formatTime(localTimeElapsed)} and burned ${result.data?.calories_burned || 0} calories.`
      });
    }
  };

  const handleProfileComplete = () => {
    setShowProfilePrompt(false);
    // Retry starting the session
    handleStart();
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <div className="max-w-md mx-auto pt-20 pb-20">{/* FIXED: Increased pt from 8 to 20 to prevent overlap */}
        {/* Header with Onboarding Button */}
        <div className="text-center mb-8 relative">
          <div className="absolute left-0 top-0">
            <PageOnboardingButton onClick={() => setShowOnboarding(true)} />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent mb-2">
            Walking Timer
          </h1>
          <p className="text-muted-foreground">Track your walking session and stay active</p>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="space-y-6">
            {/* Timer skeleton */}
            <div className="bg-ceramic-plate rounded-3xl p-6 space-y-4">
              <div className="text-center space-y-4">
                <div className="h-16 bg-muted animate-pulse rounded w-48 mx-auto" />
                <div className="h-6 bg-muted animate-pulse rounded w-32 mx-auto" />
              </div>
            </div>
            
            {/* Speed selector skeleton */}
            <div className="bg-ceramic-plate rounded-xl p-4">
              <div className="space-y-2">
                <div className="h-4 bg-muted animate-pulse rounded w-20" />
                <div className="h-8 bg-muted animate-pulse rounded w-full" />
              </div>
            </div>
            
            {/* Stats skeleton */}
            <div className="grid grid-cols-2 gap-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-ceramic-plate rounded-xl p-4">
                  <div className="space-y-2">
                    <div className="h-4 bg-muted animate-pulse rounded w-16" />
                    <div className="h-6 bg-muted animate-pulse rounded w-12" />
                    <div className="h-3 bg-muted animate-pulse rounded w-20" />
                  </div>
                </div>
              ))}
            </div>
            
            {/* Button skeleton */}
            <div className="h-14 bg-muted animate-pulse rounded-lg" />
          </div>
        ) : (
          <>
            {/* Timer Display */}
            <div className="relative mb-6">
              <WalkingTimer
                displayTime={formatTime(localTimeElapsed)}
                isActive={!!currentSession}
                isPaused={isPaused}
                onStart={handleStart}
                onPause={handlePause}
                onResume={handleResume}
                onStop={() => setShowStopConfirm(true)}
                showSlideshow={true}
                units={profile?.units || 'imperial'}
                selectedSpeed={selectedSpeed}
                onSpeedChange={async (newSpeed) => {
                  console.log('Speed change triggered:', { 
                    oldSpeed: selectedSpeed, 
                    newSpeed, 
                    units: profile?.units,
                    isMetric: profile?.units === 'metric'
                  });
                  setSelectedSpeed(newSpeed);
                  if (isRunning) {
                    const result = await updateSessionSpeed(newSpeed);
                    if (result.error) {
                      console.error('Failed to update session speed:', result.error);
                      toast({
                        variant: "destructive",
                        title: "Speed Update Failed",
                        description: "Unable to update walking speed. Please try again."
                      });
                    } else {
                      console.log('Speed updated successfully in database');
                      toast({
                        title: "Speed Updated",
                        description: `Walking speed updated to ${newSpeed} mph`
                      });
                    }
                  } else {
                    toast({
                      title: "Speed Set", 
                      description: `Walking speed set to ${newSpeed} mph`
                    });
                  }
                }}
                realTimeStats={currentSession ? {
                  speed: currentSession.speed_mph || selectedSpeed,
                  distance: walkingStats.realTimeDistance,
                  calories: walkingStats.realTimeCalories,
                  steps: walkingStats.realTimeSteps,
                  startTime: currentSession.start_time
                } : undefined}
              />
            </div>

            {/* Speed Selector - prominently placed after timer */}
            <div className="mb-6">
              <SpeedSelector
                selectedSpeed={selectedSpeed}
                onSpeedChange={async (newSpeed) => {
                  console.log('Speed change triggered from selector:', { 
                    oldSpeed: selectedSpeed, 
                    newSpeed, 
                    units: profile?.units,
                    isMetric: profile?.units === 'metric'
                  });
                  setSelectedSpeed(newSpeed);
                  if (isRunning) {
                    const result = await updateSessionSpeed(newSpeed);
                    if (result.error) {
                      console.error('Failed to update session speed:', result.error);
                      toast({
                        variant: "destructive",
                        title: "Speed Update Failed",
                        description: "Unable to update walking speed. Please try again."
                      });
                    } else {
                      console.log('Speed updated successfully in database');
                      toast({
                        title: "Speed Updated",
                        description: `Walking speed updated during session`
                      });
                    }
                  } else {
                    toast({
                      title: "Speed Set", 
                      description: `Walking speed set for next session`
                    });
                  }
                }}
                disabled={false}
                units={profile?.units || 'imperial'}
              />
            </div>

          </>
        )}



        <ProfileCompletionPrompt 
          isOpen={showProfilePrompt}
          onComplete={handleProfileComplete}
          onClose={() => setShowProfilePrompt(false)}
          requiredFor="accurate calorie calculation during walking"
        />

        {/* Walking History */}
        {/* Stop Walking Confirmation Dialog */}
        <StopWalkingConfirmDialog
          open={showStopConfirm}
          onOpenChange={setShowStopConfirm}
          onConfirm={handleStopConfirm}
          currentDuration={formatTime(localTimeElapsed)}
          calories={walkingStats.realTimeCalories}
          distance={walkingStats.realTimeDistance}
          units={profile?.units || 'imperial'}
        />

        {/* Walking History - only show when not loading */}
        {!loading && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Walking History</h3>
              <ClearWalkingHistoryButton />
            </div>
            <WalkingHistory />
          </div>
        )}

        {/* Onboarding Modal */}
        <PageOnboardingModal
          isOpen={showOnboarding}
          onClose={() => setShowOnboarding(false)}
          title={onboardingContent.walking.title}
          subtitle={onboardingContent.walking.subtitle}
          heroQuote={onboardingContent.walking.heroQuote}
        >
          <div className="space-y-6">
            <div className="text-center">
              <p className="text-lg text-warm-text/80 mb-6">{onboardingContent.walking.subtitle}</p>
            </div>
            
            {onboardingContent.walking.sections.map((section, index) => {
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
    </div>
  );
};

export default Walking;