import { useState, useEffect } from 'react';
import { Play, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WalkingTimer } from '@/components/WalkingTimer';
import { useToast } from '@/hooks/use-toast';
import { useWalkingSession } from '@/hooks/useWalkingSession';

const Walking = () => {
  const [timeElapsed, setTimeElapsed] = useState(0);
  const { toast } = useToast();
  const { currentSession, startWalkingSession, endWalkingSession, loadActiveSession } = useWalkingSession();

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
        setTimeElapsed(elapsed);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, currentSession]);

  const handleStart = async () => {
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
      toast({
        title: "Walking completed",
        description: `Session completed! Calories burned: ${result.data?.calories_burned || 0}`
      });
      setTimeElapsed(0);
    }
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
          <p className="text-muted-foreground">Track your walking session</p>
        </div>

        {/* Timer Display */}
        <div className="relative mb-8">
          <WalkingTimer 
            displayTime={formatTime(timeElapsed)}
            isActive={isRunning}
            onStart={handleStart}
            onStop={handleStop}
          />
        </div>

        {/* Control buttons are now integrated into WalkingTimer component */}

        {/* Session Info */}
        {isRunning && currentSession && (
          <div className="mt-8 p-4 rounded-xl bg-card border border-border">
            <h3 className="font-medium mb-2">Current Session</h3>
            <p className="text-sm text-muted-foreground">
              Started: {new Date(currentSession.start_time).toLocaleTimeString()}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Walking;