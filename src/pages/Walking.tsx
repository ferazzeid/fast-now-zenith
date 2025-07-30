import { useState, useEffect } from 'react';
import { WalkingTimer } from '@/components/WalkingTimer';
import { SpeedSelector } from '@/components/SpeedSelector';
import { ProfileCompletionPrompt } from '@/components/ProfileCompletionPrompt';
import { WalkingHistory } from '@/components/WalkingHistory';
import { StopWalkingConfirmDialog } from '@/components/StopWalkingConfirmDialog';
import { useToast } from '@/hooks/use-toast';
import { useWalkingSession } from '@/hooks/useWalkingSession';
import { useProfile } from '@/hooks/useProfile';
import { ClearWalkingHistoryButton } from '@/components/ClearWalkingHistoryButton';
import { useWalkingStats } from '@/contexts/WalkingStatsContext';

const Walking = () => {
  const [showProfilePrompt, setShowProfilePrompt] = useState(false);
  const [showStopConfirm, setShowStopConfirm] = useState(false);
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
    }
  };

  const handleStopConfirm = async () => {
    const result = await endWalkingSession();
    setShowStopConfirm(false);
    if (result.error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: result.error.message
      });
    } else {
      toast({
        title: "Walking completed!",
        description: `Great job! You walked for ${formatTime(walkingStats.timeElapsed)} and burned ${result.data?.calories_burned || 0} calories.`
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <div className="max-w-md mx-auto pt-20 pb-20">{/* FIXED: Increased pt from 8 to 20 to prevent overlap */}
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent mb-2">
            Walking Timer
          </h1>
          <p className="text-muted-foreground">Track your walking session and stay active</p>
        </div>

        {/* Timer Display */}
        <div className="relative mb-8">
          <WalkingTimer
            displayTime={formatTime(walkingStats.timeElapsed)}
            isActive={!!currentSession}
            isPaused={isPaused}
            onStart={handleStart}
            onPause={handlePause}
            onResume={handleResume}
            onStop={() => setShowStopConfirm(true)}
            showSlideshow={true}
            units={profile?.units || 'imperial'}
            selectedSpeed={selectedSpeed}
            onSpeedChange={(newSpeed) => {
              setSelectedSpeed(newSpeed);
              if (isRunning) {
                updateSessionSpeed(newSpeed);
              }
            }}
            realTimeStats={currentSession ? {
              speed: currentSession.speed_mph || selectedSpeed,
              distance: walkingStats.realTimeDistance,
              calories: walkingStats.realTimeCalories,
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

        {/* Walking History */}
        {/* Stop Walking Confirmation Dialog */}
        <StopWalkingConfirmDialog
          open={showStopConfirm}
          onOpenChange={setShowStopConfirm}
          onConfirm={handleStopConfirm}
          currentDuration={formatTime(walkingStats.timeElapsed)}
          calories={walkingStats.realTimeCalories}
          distance={walkingStats.realTimeDistance}
          units={profile?.units || 'imperial'}
        />

        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Walking History</h3>
            <ClearWalkingHistoryButton />
          </div>
          <WalkingHistory />
        </div>
      </div>
    </div>
  );
};

export default Walking;