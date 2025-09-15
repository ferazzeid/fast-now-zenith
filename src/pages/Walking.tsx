import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { History } from 'lucide-react';
import { WalkingTimer } from '@/components/WalkingTimer';
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
import { InspirationQuote } from '@/components/InspirationQuote';
import { useQuoteSettings } from '@/hooks/useQuoteSettings';
import { useMotivators } from '@/hooks/useMotivators';
import { useQuoteDisplay } from '@/hooks/useQuoteDisplay';
import { AuthorTooltip } from '@/components/AuthorTooltip';
import { ResponsivePageHeader } from '@/components/ResponsivePageHeader';
import { useAccess } from '@/hooks/useAccess';
import OutboxSyncIndicator from '@/components/OutboxSyncIndicator';
import { AdminInsightDisplay } from '@/components/AdminInsightDisplay';


const Walking = () => {
  const navigate = useNavigate();
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
    updateSelectedSpeed,
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
  const { quotes } = useQuoteSettings();
  const { walkingQuotesEnabled } = useQuoteDisplay();
  const { saveQuoteAsGoal } = useMotivators();
  const { isAdmin } = useAccess();

  const isRunning = !!currentSession;

  // Local timer logic - immediate start like fasting timer
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (currentSession && !isPaused) {
      const updateLocalTime = () => {
        const now = Date.now();
        const startTime = new Date(currentSession.start_time).getTime();
        const pausedDuration = (currentSession.total_pause_duration || 0) * 1000; // Convert to ms
        const elapsed = Math.floor((now - startTime - pausedDuration) / 1000);
        setLocalTimeElapsed(Math.max(0, elapsed));
      };

      // Update immediately for instant feedback
      updateLocalTime();
      // Then set interval for continuous updates
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
      await startWalkingSession();
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

  const handleManualDurationConfirm = async (durationMinutes: number) => {
    console.log('Manual duration confirmed:', durationMinutes);
    setShowStopConfirm(false);
    
    toast({
      title: "Correcting session...",
      description: "Saving with manual duration."
    });
    
    const result = await endWalkingSession();
    if (result.error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.error.message
      });
    } else {
      trackWalkingEvent('stop', selectedSpeed, durationMinutes * 60);
      toast({
        title: "Walking completed!",
        description: `Session corrected to ${durationMinutes} minutes. Calculated data removed for accuracy.`
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
    <div className="relative min-h-[calc(100vh-80px)] bg-background p-4 overflow-x-hidden">
      <div className="max-w-md mx-auto pt-10 pb-32 safe-bottom">
        {/* Header with Onboarding and History Buttons */}
        <ResponsivePageHeader
          title="Walking Timer"
          subtitle="Track your walking session"
          onHistoryClick={() => navigate('/walking-history')}
          historyTitle="View walking history"
          showAuthorTooltip={true}
          authorTooltipContentKey="walking_timer_insights"
          authorTooltipContent="Walking regularly helps improve cardiovascular health, builds stronger bones, and can boost your mood through the release of endorphins. Even short walks make a meaningful difference!"
        />

        
        {/* Only show sync indicator when there's an active session */}
        {currentSession && (
          <div className="mt-2 flex justify-end">
            <OutboxSyncIndicator />
          </div>
        )}

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
              try {
                // Use the hook's updateSelectedSpeed for immediate saving and UI feedback
                updateSelectedSpeed(newSpeed);
                
                // Also update the current session if one is active
                if (isRunning) {
                  await updateSessionSpeed(newSpeed);
                }
                
                // Show immediate confirmation
                const speedLabel = newSpeed >= 4 ? 'fast pace' : 'normal pace';
                toast({
                  title: "Speed Updated",
                  description: `Speed set to ${speedLabel}`
                });
              } catch (error) {
                console.error('Error updating speed:', error);
                toast({ 
                  title: "Network Error", 
                  description: "Speed will be synced when connection is restored",
                  variant: "destructive" 
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


        {/* Inspirational Quote */}
        {walkingQuotesEnabled && quotes.walking_timer_quotes && quotes.walking_timer_quotes.length > 0 && (
          <InspirationQuote 
            quotes={quotes.walking_timer_quotes} 
            className="mt-8"
            onSaveQuote={saveQuoteAsGoal}
            compact={true}
          />
        )}


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
          onManualDurationConfirm={handleManualDurationConfirm}
          currentDuration={formatTime(localTimeElapsed)}
          durationMinutes={Math.floor(localTimeElapsed / 60)}
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
          backgroundImage={onboardingContent.walking.backgroundImage}
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