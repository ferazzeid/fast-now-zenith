import { useState, useEffect } from 'react';
import { Play, Square, Settings, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { CeramicTimer } from '@/components/CeramicTimer';
import { FastSelector } from '@/components/FastSelector';
import { CrisisModal } from '@/components/CrisisModal';
import { useToast } from '@/hooks/use-toast';
import { useFastingSession } from '@/hooks/useFastingSession';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const Timer = () => {
  const [timeElapsed, setTimeElapsed] = useState(0); // in seconds
  const [fastDuration, setFastDuration] = useState(16 * 60 * 60); // 16 hours default
  const [fastType, setFastType] = useState<'intermittent' | 'longterm'>('intermittent');
  const [eatingWindow, setEatingWindow] = useState(8 * 60 * 60); // 8 hours
  const [isInEatingWindow, setIsInEatingWindow] = useState(false);
  const [countDirection, setCountDirection] = useState<'up' | 'down'>('up');
  const [showFastSelector, setShowFastSelector] = useState(false);
  const [showCrisisModal, setShowCrisisModal] = useState(false);
  const { toast } = useToast();
  const { currentSession, startFastingSession, endFastingSession, cancelFastingSession, loadActiveSession } = useFastingSession();

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
        
        // Check if we should switch to eating window for intermittent fasting
        if (fastType === 'intermittent' && elapsed >= fastDuration && !isInEatingWindow) {
          setIsInEatingWindow(true);
          toast({
            title: "🍽️ Eating Window Started!",
            description: "Time to break your fast. Enjoy your meal!",
          });
        }
        
        // Check if eating window is over
        if (fastType === 'intermittent' && isInEatingWindow && elapsed >= (fastDuration + eatingWindow)) {
          setIsInEatingWindow(false);
          toast({
            title: "✨ Fast Resumed!",
            description: "Your eating window is over. Fast continues!",
          });
        }
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, currentSession, fastDuration, eatingWindow, fastType, isInEatingWindow, toast]);

  const handleStart = async () => {
    const session = await startFastingSession(fastDuration);
    if (session) {
      setTimeElapsed(0);
      setIsInEatingWindow(false);
      toast({
        title: "🏃‍♀️ Fast Started!",
        description: "Your fasting journey begins now. Stay strong!",
      });
    }
  };

  const handleStop = async () => {
    if (currentSession) {
      await endFastingSession();
      setTimeElapsed(0);
      setIsInEatingWindow(false);
      toast({
        title: "🛑 Fast Stopped",
        description: "Fast ended. Great effort on your journey!",
      });
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    // Always show hours for clarity
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getDisplayTime = () => {
    if (countDirection === 'up') {
      return formatTime(timeElapsed);
    } else {
      const targetDuration = isInEatingWindow ? eatingWindow : fastDuration;
      const remaining = Math.max(0, targetDuration - timeElapsed);
      return formatTime(remaining);
    }
  };

  const getProgress = () => {
    const targetDuration = isInEatingWindow ? eatingWindow : fastDuration;
    return Math.min((timeElapsed / targetDuration) * 100, 100);
  };

  const getCurrentMode = () => {
    if (fastType === 'longterm') return 'Extended Fast';
    return isInEatingWindow ? 'Eating Window' : 'Fasting';
  };

  return (
    <div className="min-h-screen bg-ceramic-base px-4 pt-8 pb-20">
      <div className="max-w-md mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-warm-text">FastNow</h1>
          <p className="text-muted-foreground">{getCurrentMode()}</p>
        </div>

        {/* Fast Type Selector */}
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => setShowFastSelector(true)}
            className="bg-ceramic-plate border-ceramic-rim"
          >
            <Settings className="w-4 h-4 mr-2" />
            Change Fast Type
          </Button>
        </div>

        {/* Ceramic Timer with Count Direction Toggle */}
        <div className="flex justify-center relative">
          <CeramicTimer
            progress={getProgress()}
            displayTime={getDisplayTime()}
            isActive={isRunning}
            isEatingWindow={isInEatingWindow}
            showSlideshow={true}
          />
          {/* Discrete Count Direction Toggle */}
          <div className="absolute top-0 right-0 flex items-center space-x-2 bg-ceramic-plate/80 backdrop-blur-sm px-3 py-1 rounded-full border border-ceramic-rim/50">
            <Label htmlFor="count-direction" className="text-xs text-warm-text font-medium">
              {countDirection === 'up' ? '↑' : '↓'}
            </Label>
            <Switch
              id="count-direction"
              checked={countDirection === 'up'}
              onCheckedChange={(checked) => setCountDirection(checked ? 'up' : 'down')}
              className="scale-75"
            />
          </div>
        </div>

        {/* Panic Button - Only show when fasting is active */}
        {isRunning && (
          <div className="flex justify-center">
            <Button
              onClick={() => setShowCrisisModal(true)}
              size="lg"
              className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 font-semibold shadow-lg border-2 border-red-500 animate-pulse"
            >
              <AlertTriangle className="w-5 h-5 mr-2" />
              Help Me Stay Strong
            </Button>
          </div>
        )}

        {/* Control Buttons */}
        <div className="flex justify-center space-x-4">
          {!isRunning ? (
            <Button
              onClick={handleStart}
              size="lg"
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-8"
            >
              <Play className="w-5 h-5 mr-2" />
              Start Fast
            </Button>
          ) : (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-ceramic-plate border-ceramic-rim px-8"
                >
                  <Square className="w-5 h-5 mr-2" />
                  Stop Fast
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-ceramic-plate border-ceramic-rim">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-warm-text">Stop Your Fast?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to stop your fast? This will end your current fasting session and reset the timer.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-ceramic-base border-ceramic-rim">
                    Continue Fasting
                  </AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleStop}
                    className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                  >
                    Stop Fast
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>

        {/* Fast Info */}
        <div className="bg-ceramic-plate p-4 rounded-2xl border border-ceramic-rim space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Fast Duration:</span>
            <span className="text-warm-text font-medium">
              {Math.floor(fastDuration / 3600)}h
            </span>
          </div>
          {fastType === 'intermittent' && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Eating Window:</span>
              <span className="text-warm-text font-medium">
                {Math.floor(eatingWindow / 3600)}h
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Fast Selector Modal */}
      {showFastSelector && (
        <FastSelector
          currentType={fastType}
          currentDuration={fastDuration}
          currentEatingWindow={eatingWindow}
            onSelect={async (type, duration, eating) => {
              setFastType(type);
              setFastDuration(duration);
              setEatingWindow(eating);
              setShowFastSelector(false);
              // Reset timer when changing fast type
              if (currentSession) {
                await cancelFastingSession();
              }
              setTimeElapsed(0);
              setIsInEatingWindow(false);
            }}
          onClose={() => setShowFastSelector(false)}
        />
      )}

      {/* Crisis Modal */}
      <CrisisModal 
        isOpen={showCrisisModal}
        onClose={() => setShowCrisisModal(false)}
      />
    </div>
  );
};

export default Timer;