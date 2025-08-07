import { useState, useEffect } from 'react';
import { History } from 'lucide-react';
import { WalkingTimer } from '@/components/WalkingTimer';
import { PageOnboardingButton } from '@/components/PageOnboardingButton';
import { HistoryButton } from '@/components/HistoryButton';
import { PageOnboardingModal } from '@/components/PageOnboardingModal';
import { onboardingContent } from '@/data/onboardingContent';
import { Button } from '@/components/ui/button';

import { ProfileCompletionPrompt } from '@/components/ProfileCompletionPrompt';
import { WalkingHistoryModal } from '@/components/WalkingHistoryModal';

import { StopWalkingConfirmDialog } from '@/components/StopWalkingConfirmDialog';
import { useToast } from '@/hooks/use-toast';
import { useWalkingSession } from '@/hooks/useWalkingSession';
import { useProfile } from '@/hooks/useProfile';
import { useSimpleWalkingStats } from '@/contexts/SimplifiedWalkingStats';
import { trackWalkingEvent } from '@/utils/analytics';

const Walking = () => {
  const [showProfilePrompt, setShowProfilePrompt] = useState(false);
  const [showStopConfirm, setShowStopConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showWalkingHistory, setShowWalkingHistory] = useState(false);
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
    cancelWalkingSession,
    updateSessionSpeed
  } = useWalkingSession();
  const { profile } = useProfile();
  const { walkingStats } = useSimpleWalkingStats();

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
    try {
      // Remove profile dependency - start immediately
      await startWalkingSession(selectedSpeed);
      toast({
        title: "Walking session started",
        description: "Good luck on your walk!",
      });
      
      trackWalkingEvent('start', selectedSpeed);
    } catch (error) {
      console.error('Failed to start walking session:', error);
      toast({
        title: "Error",
        description: "Failed to start walking session. Please try again.",
        variant: "destructive",
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

  const handleCancel = () => {
    setShowCancelConfirm(true);
  };

  const handleCancelConfirm = async () => {
    setShowCancelConfirm(false);
    const result = await cancelWalkingSession();
    if (result.error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.error.message
      });
    } else {
      toast({
        title: "Session cancelled",
        description: "Walking session was cancelled and removed from history."
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
      <div className="max-w-md mx-auto pt-10 pb-20">{/* FIXED: Reduced pt from 20 to 10 for better spacing */}
        {/* Header with Onboarding and History Buttons */}
        <div className="mb-4 mt-4 relative">
          <div className="absolute left-0 top-0">
            <PageOnboardingButton onClick={() => setShowOnboarding(true)} />
          </div>
          <div className="absolute right-0 top-0">
            <HistoryButton onClick={() => setShowWalkingHistory(true)} title="View walking history" />
          </div>
          <div className="pl-12 pr-12">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent mb-1">
              Walking Timer
            </h1>
            <p className="text-sm text-muted-foreground text-left">Track your walking session</p>
          </div>
        </div>

        {/* Timer Display - No Loading State Blocking */}
        <div className="relative mb-6">
          <WalkingTimer
            displayTime={formatTime(localTimeElapsed)}
            isActive={!!currentSession}
            isPaused={isPaused}
            onStart={handleStart}
            onPause={handlePause}
            onResume={handleResume}
            onStop={async () => { setShowStopConfirm(true); }}
            onCancel={async () => { handleCancel(); }}
            showSlideshow={profile?.enable_walking_slideshow ?? false}
            units={profile?.units || 'imperial'}
            selectedSpeed={selectedSpeed}
            onSpeedChange={async (newSpeed) => {
              setSelectedSpeed(newSpeed);
              
              // Force immediate stats update by triggering context refresh
              if (isRunning) {
                try {
                  const result = await updateSessionSpeed(newSpeed);
                  if (result.error) {
                    toast({
                      variant: "destructive",
                      title: "Speed Update Failed",
                      description: "Unable to update walking speed. Please try again."
                    });
                  } else {
                    // Show speed in user's preferred units
                    const units = profile?.units || 'imperial';
                    const displaySpeed = units === 'metric' 
                      ? (newSpeed * 1.60934).toFixed(1) 
                      : newSpeed.toFixed(1);
                    const unitLabel = units === 'metric' ? 'km/h' : 'mph';
                    
                    toast({
                      title: "Speed Updated",
                      description: `Speed updated to ${displaySpeed} ${unitLabel}`
                    });
                  }
                } catch (error) {
                  toast({
                    variant: "destructive",
                    title: "Network Error",
                    description: "Failed to update speed. Check your connection."
                  });
                }
              } else {
                toast({
                  title: "Speed Set", 
                  description: `Speed set for next session`
                });
              }
            }}
            realTimeStats={currentSession ? {
              speed: currentSession.speed_mph || selectedSpeed,
              distance: walkingStats.distance,
              calories: walkingStats.calories,
              startTime: currentSession.start_time
            } : undefined}
          />
        </div>



        <ProfileCompletionPrompt 
          isOpen={showProfilePrompt}
          onComplete={handleProfileComplete}
          onClose={() => setShowProfilePrompt(false)}
          requiredFor="accurate calorie calculation during walking"
        />

        {/* Stop Walking Confirmation Dialog */}
        <StopWalkingConfirmDialog
          open={showStopConfirm}
          onOpenChange={setShowStopConfirm}
          onConfirm={handleStopConfirm}
          currentDuration={formatTime(localTimeElapsed)}
          calories={walkingStats.calories}
          distance={walkingStats.distance}
          units={profile?.units || 'imperial'}
        />

        {/* Cancel Walking Confirmation Dialog */}
        <StopWalkingConfirmDialog
          open={showCancelConfirm}
          onOpenChange={setShowCancelConfirm}
          onConfirm={handleCancelConfirm}
          currentDuration={formatTime(localTimeElapsed)}
          calories={walkingStats.calories}
          distance={walkingStats.distance}
          units={profile?.units || 'imperial'}
          actionType="cancel"
        />

        {/* Walking History Modal */}
        {showWalkingHistory && (
          <WalkingHistoryModal onClose={() => setShowWalkingHistory(false)} />
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