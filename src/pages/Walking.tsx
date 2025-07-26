import { useState, useEffect } from 'react';
import { WalkingTimer } from '@/components/WalkingTimer';
import { SpeedSelector } from '@/components/SpeedSelector';
import { ProfileCompletionPrompt } from '@/components/ProfileCompletionPrompt';
import { useToast } from '@/hooks/use-toast';
import { useWalkingSession } from '@/hooks/useWalkingSession';
import { useProfile } from '@/hooks/useProfile';

const Walking = () => {
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [showProfilePrompt, setShowProfilePrompt] = useState(false);
  const [realTimeCalories, setRealTimeCalories] = useState(0);
  const [realTimeDistance, setRealTimeDistance] = useState(0);
  const { toast } = useToast();
  const { 
    currentSession, 
    selectedSpeed,
    setSelectedSpeed,
    startWalkingSession, 
    endWalkingSession, 
    loadActiveSession 
  } = useWalkingSession();
  const { isProfileComplete, calculateWalkingCalories } = useProfile();

  const isRunning = !!currentSession;

  useEffect(() => {
    loadActiveSession();
  }, [loadActiveSession]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning && currentSession) {
      interval = setInterval(() => {
        const startTime = new Date(currentSession.start_time);
        const now = new Date();
        const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
        const elapsedMinutes = elapsed / 60;
        const speedMph = currentSession.speed_mph || selectedSpeed || 3;
        
        setTimeElapsed(elapsed);
        setRealTimeCalories(calculateWalkingCalories(elapsedMinutes, speedMph));
        setRealTimeDistance(Math.round((elapsedMinutes / 60) * speedMph * 100) / 100);
      }, 1000);
    } else {
      setTimeElapsed(0);
      setRealTimeCalories(0);
      setRealTimeDistance(0);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, currentSession, selectedSpeed, calculateWalkingCalories]);

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

  const handleStop = async () => {
    if (!currentSession) return;
    
    const result = await endWalkingSession();
    if (result.error) {
      toast({
        variant: "destructive",
        title: "Error", 
        description: result.error.message
      });
    } else {
      const calories = result.data?.calories_burned || 0;
      const distance = result.data?.distance || 0;
      toast({
        title: "Walking completed",
        description: `Great job! You walked ${distance} miles and burned ${calories} calories.`
      });
      setTimeElapsed(0);
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

        {/* Speed Selector - only show when not running */}
        {!isRunning && (
          <div className="mb-6">
            <SpeedSelector
              selectedSpeed={selectedSpeed}
              onSpeedChange={setSelectedSpeed}
              disabled={isRunning}
            />
          </div>
        )}

        {/* Timer Display */}
        <div className="relative mb-8">
          <WalkingTimer 
            displayTime={formatTime(timeElapsed)}
            isActive={isRunning}
            onStart={handleStart}
            onStop={handleStop}
          />
        </div>

        {/* Real-time stats during walking */}
        {isRunning && currentSession && (
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
          onClose={() => setShowProfilePrompt(false)}
          onComplete={handleProfileComplete}
          requiredFor="accurate calorie calculation during walking"
        />
      </div>
    </div>
  );
};

export default Walking;