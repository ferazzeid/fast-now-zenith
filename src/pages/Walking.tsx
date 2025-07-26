import { useState, useEffect } from 'react';
import { WalkingTimer } from '@/components/WalkingTimer';
import { SpeedSelector } from '@/components/SpeedSelector';
import { ProfileCompletionPrompt } from '@/components/ProfileCompletionPrompt';
import { WalkingHistory } from '@/components/WalkingHistory';
import { StopWalkingConfirmDialog } from '@/components/StopWalkingConfirmDialog';
import { useToast } from '@/hooks/use-toast';
import { useWalkingSession } from '@/hooks/useWalkingSession';
import { useProfile } from '@/hooks/useProfile';

const Walking = () => {
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [showProfilePrompt, setShowProfilePrompt] = useState(false);
  const [realTimeCalories, setRealTimeCalories] = useState(0);
  const [realTimeDistance, setRealTimeDistance] = useState(0);
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
    endWalkingSession 
  } = useWalkingSession();
  const { isProfileComplete, calculateWalkingCalories } = useProfile();

  const isRunning = !!currentSession;


  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (currentSession && !isPaused) {
      interval = setInterval(() => {
        const startTime = new Date(currentSession.start_time);
        const now = new Date();
        let totalElapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
        
        // Subtract paused time for accurate calculation
        const pausedTime = currentSession.total_pause_duration || 0;
        const activeElapsed = Math.max(0, totalElapsed - pausedTime);
        setTimeElapsed(activeElapsed);

        // Calculate real-time stats based on active time only
        const activeDurationMinutes = activeElapsed / 60;
        const speedMph = currentSession.speed_mph || selectedSpeed || 3;
        
        if (isProfileComplete()) {
          const calories = calculateWalkingCalories(activeDurationMinutes, speedMph);
          setRealTimeCalories(calories);
        }
        
        const distance = (activeDurationMinutes / 60) * speedMph;
        setRealTimeDistance(Math.round(distance * 100) / 100);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentSession, selectedSpeed, isPaused, isProfileComplete, calculateWalkingCalories]);

  const handleStart = async () => {
    // Check if profile is complete for accurate calorie calculation
    if (!isProfileComplete()) {
      setShowProfilePrompt(true);
      return;
    }

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
        description: `Great job! You walked for ${formatTime(timeElapsed)} and burned ${result.data?.calories_burned || 0} calories.`
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
      <div className="max-w-md mx-auto pt-8 pb-20">
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
            displayTime={formatTime(timeElapsed)}
            isActive={!!currentSession}
            isPaused={isPaused}
            onStart={handleStart}
            onPause={handlePause}
            onResume={handleResume}
            onStop={() => setShowStopConfirm(true)}
          />
        </div>

        {/* Speed Selector - always visible for consistent layout */}
        <div className="mb-6">
          <SpeedSelector
            selectedSpeed={selectedSpeed}
            onSpeedChange={setSelectedSpeed}
            disabled={isRunning}
          />
        </div>

        {/* Real-time stats during walking */}
        {currentSession && (
          <div className="mt-8 p-4 rounded-xl bg-card border border-border space-y-2">
            <h3 className="font-medium mb-2">Current Session</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Speed:</span>
                <p className="font-medium">{currentSession.speed_mph || selectedSpeed} mph</p>
              </div>
              <div>
                <span className="text-muted-foreground">Distance:</span>
                <p className="font-medium">{realTimeDistance} miles</p>
              </div>
              <div>
                <span className="text-muted-foreground">Calories:</span>
                <p className="font-medium">{realTimeCalories} cal</p>
              </div>
              <div>
                <span className="text-muted-foreground">Started:</span>
                <p className="font-medium">{new Date(currentSession.start_time).toLocaleTimeString()}</p>
              </div>
            </div>
          </div>
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
          currentDuration={formatTime(timeElapsed)}
          calories={realTimeCalories}
          distance={realTimeDistance}
        />

        <div className="mt-8">
          <WalkingHistory />
        </div>
      </div>
    </div>
  );
};

export default Walking;