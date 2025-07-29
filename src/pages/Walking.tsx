import { useState, useEffect, useCallback } from 'react';
import { WalkingTimer } from '@/components/WalkingTimer';
import { SpeedSelector } from '@/components/SpeedSelector';
import { ProfileCompletionPrompt } from '@/components/ProfileCompletionPrompt';
import { WalkingHistory } from '@/components/WalkingHistory';
import { StopWalkingConfirmDialog } from '@/components/StopWalkingConfirmDialog';
import { useToast } from '@/hooks/use-toast';
import { ClearWalkingHistoryButton } from '@/components/ClearWalkingHistoryButton';
import { supabase } from '@/integrations/supabase/client';

const Walking = () => {
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [showProfilePrompt, setShowProfilePrompt] = useState(false);
  const [realTimeCalories, setRealTimeCalories] = useState(0);
  const [realTimeDistance, setRealTimeDistance] = useState(0);
  const [showStopConfirm, setShowStopConfirm] = useState(false);
  const [currentSession, setCurrentSession] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedSpeed, setSelectedSpeed] = useState(3);
  const [isPaused, setIsPaused] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const { toast } = useToast();

  const isRunning = !!currentSession;

  // AI-powered data loading
  const loadActiveSession = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase.functions.invoke('chat-completion', {
        body: {
          message: "Load my current active walking session and profile data",
          action: "load_walking_data"
        }
      });

      if (error) throw error;

      if (data.walking_session) {
        setCurrentSession(data.walking_session);
        setIsPaused(data.walking_session.status === 'paused');
      }
      
      if (data.profile) {
        setProfile(data.profile);
      }
    } catch (error) {
      console.error('Error loading walking data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // AI-powered profile functions
  const isProfileComplete = useCallback(() => {
    return profile && profile.weight && profile.height && profile.age;
  }, [profile]);

  const calculateWalkingCalories = useCallback((durationMinutes: number, speedMph: number) => {
    if (!profile?.weight) return 0;

    const metValues: { [key: number]: number } = {
      2: 2.8, 3: 3.2, 4: 4.3, 5: 5.5
    };
    const met = metValues[Math.round(speedMph)] || 3.2;

    let weightKg: number;
    if (profile.units === 'metric') {
      weightKg = profile.weight;
    } else {
      weightKg = profile.weight * 0.453592;
    }

    const caloriesPerMinute = (met * weightKg) / 60;
    return Math.round(caloriesPerMinute * durationMinutes);
  }, [profile]);

  // AI-powered session management
  const startWalkingSession = useCallback(async (speedMph: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.functions.invoke('chat-completion', {
        body: {
          message: `Start a walking session at ${speedMph} mph`,
          action: "start_walking_session",
          speed_mph: speedMph
        }
      });

      if (error) throw error;

      if (data.walking_session) {
        setCurrentSession(data.walking_session);
        setIsPaused(false);
        await loadActiveSession();
      }

      return { data: data.walking_session, error: null };
    } catch (error) {
      console.error('Error starting walking session:', error);
      return { data: null, error };
    }
  }, [loadActiveSession]);

  const pauseWalkingSession = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('chat-completion', {
        body: {
          message: "Pause my current walking session",
          action: "pause_walking_session",
          session_id: currentSession?.id
        }
      });

      if (error) throw error;

      setIsPaused(true);
      await loadActiveSession();
      return { data: data.walking_session, error: null };
    } catch (error) {
      console.error('Error pausing walking session:', error);
      return { data: null, error };
    }
  }, [currentSession?.id, loadActiveSession]);

  const resumeWalkingSession = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('chat-completion', {
        body: {
          message: "Resume my paused walking session",
          action: "resume_walking_session",
          session_id: currentSession?.id
        }
      });

      if (error) throw error;

      setIsPaused(false);
      await loadActiveSession();
      return { data: data.walking_session, error: null };
    } catch (error) {
      console.error('Error resuming walking session:', error);
      return { data: null, error };
    }
  }, [currentSession?.id, loadActiveSession]);

  const endWalkingSession = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('chat-completion', {
        body: {
          message: "End my current walking session",
          action: "end_walking_session",
          session_id: currentSession?.id,
          duration_seconds: timeElapsed
        }
      });

      if (error) throw error;

      setCurrentSession(null);
      setIsPaused(false);
      setTimeElapsed(0);
      setRealTimeCalories(0);
      setRealTimeDistance(0);

      return { data: data.walking_session, error: null };
    } catch (error) {
      console.error('Error ending walking session:', error);
      return { data: null, error };
    }
  }, [currentSession?.id, timeElapsed]);

  const updateSessionSpeed = useCallback(async (newSpeed: number) => {
    try {
      const { data, error } = await supabase.functions.invoke('chat-completion', {
        body: {
          message: `Update my walking session speed to ${newSpeed} mph`,
          action: "update_walking_speed",
          session_id: currentSession?.id,
          speed_mph: newSpeed
        }
      });

      if (error) throw error;
      await loadActiveSession();
    } catch (error) {
      console.error('Error updating session speed:', error);
    }
  }, [currentSession?.id, loadActiveSession]);

  // Load initial data
  useEffect(() => {
    loadActiveSession();
  }, [loadActiveSession]);


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
        
        // Convert distance based on unit preference
        let distance = (activeDurationMinutes / 60) * speedMph;
        if (profile?.units === 'metric') {
          distance = distance * 1.60934; // Convert miles to km
        }
        setRealTimeDistance(Math.round(distance * 100) / 100);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentSession, selectedSpeed, isPaused, isProfileComplete, calculateWalkingCalories, profile?.units]);

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
    <div className="h-[calc(100vh-80px)] bg-gradient-to-br from-background via-background to-muted/20 overflow-y-auto">
      <div className="max-w-md mx-auto p-4 pt-8 pb-16">{/* CRITICAL FIX: Proper navigation spacing */}
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
              distance: realTimeDistance,
              calories: realTimeCalories,
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
          currentDuration={formatTime(timeElapsed)}
          calories={realTimeCalories}
          distance={realTimeDistance}
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