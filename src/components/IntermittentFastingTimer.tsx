import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Play, Square, Clock, Utensils, Info } from "lucide-react";
import { useIntermittentFasting, IF_PRESETS } from "@/hooks/useIntermittentFasting";

interface IntermittentFastingTimerProps {
  isActive?: boolean;
  className?: string;
}

export const IntermittentFastingTimer: React.FC<IntermittentFastingTimerProps> = ({
  isActive = false,
  className = ""
}) => {
  const {
    todaySession,
    loading,
    startIFSession,
    startFastingWindow,
    endFastingWindow,
    endEatingWindow,
    isStartingSession,
    isStartingFasting,
    isEndingFasting,
    isEndingEating
  } = useIntermittentFasting();

  const [selectedPreset, setSelectedPreset] = useState(IF_PRESETS[0]); // Default to 16:8
  const [fastingElapsed, setFastingElapsed] = useState(0);
  const [eatingElapsed, setEatingElapsed] = useState(0);

  // Update elapsed time based on session
  useEffect(() => {
    if (!todaySession) {
      setFastingElapsed(0);
      setEatingElapsed(0);
      return;
    }

    const updateElapsed = () => {
      const now = new Date();

      // Calculate fasting elapsed time
      if (todaySession.fasting_start_time) {
        const fastingStart = new Date(todaySession.fasting_start_time);
        const fastingEnd = todaySession.fasting_end_time ? new Date(todaySession.fasting_end_time) : now;
        setFastingElapsed(Math.floor((fastingEnd.getTime() - fastingStart.getTime()) / 1000));
      }

      // Calculate eating elapsed time
      if (todaySession.eating_start_time && todaySession.status === 'eating') {
        const eatingStart = new Date(todaySession.eating_start_time);
        setEatingElapsed(Math.floor((now.getTime() - eatingStart.getTime()) / 1000));
      }
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);

    return () => clearInterval(interval);
  }, [todaySession]);

  const formatTime = useCallback((seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const getTimeRemaining = (elapsedSeconds: number, totalHours: number) => {
    const totalSeconds = totalHours * 3600;
    const remaining = Math.max(0, totalSeconds - elapsedSeconds);
    return remaining;
  };

  const getProgress = (elapsedSeconds: number, totalHours: number) => {
    return Math.min((elapsedSeconds / (totalHours * 3600)) * 100, 100);
  };

  const handleStartSession = async () => {
    try {
      await startIFSession({
        fasting_window_hours: selectedPreset.fasting_hours,
        eating_window_hours: selectedPreset.eating_hours
      });
    } catch (error) {
      console.error('Failed to start IF session:', error);
    }
  };

  const handleStartFasting = async () => {
    if (!todaySession) return;
    try {
      await startFastingWindow(todaySession.id);
    } catch (error) {
      console.error('Failed to start fasting window:', error);
    }
  };

  const handleEndFasting = async () => {
    if (!todaySession) return;
    try {
      await endFastingWindow(todaySession.id);
    } catch (error) {
      console.error('Failed to end fasting window:', error);
    }
  };

  const handleEndEating = async () => {
    if (!todaySession) return;
    try {
      await endEatingWindow(todaySession.id);
    } catch (error) {
      console.error('Failed to end eating window:', error);
    }
  };

  // No session - show preset selection
  if (!todaySession) {
    return (
      <div className={`max-w-md mx-auto space-y-6 ${className}`}>
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Start Intermittent Fasting</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {IF_PRESETS.map((preset) => (
                <Button
                  key={preset.name}
                  variant={selectedPreset.name === preset.name ? "default" : "outline"}
                  className="h-auto p-3 text-center"
                  onClick={() => setSelectedPreset(preset)}
                >
                  <div>
                    <div className="font-semibold text-lg">{preset.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {preset.fasting_hours}h fast
                    </div>
                  </div>
                </Button>
              ))}
            </div>

            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium">{selectedPreset.name} Schedule</p>
              <p className="text-xs text-muted-foreground mt-1">
                {selectedPreset.description}
              </p>
            </div>

            <Button 
              onClick={handleStartSession}
              disabled={isStartingSession}
              className="w-full"
            >
              <Play className="w-4 h-4 mr-2" />
              Start {selectedPreset.name} Session
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Active session - show dual timers
  return (
    <div className={`max-w-md mx-auto space-y-4 ${className}`}>
      {/* Session Info */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              {todaySession.fasting_window_hours}:{todaySession.eating_window_hours} Schedule
            </CardTitle>
            <Badge variant={todaySession.status === 'fasting' ? 'default' : 'secondary'}>
              {todaySession.status.charAt(0).toUpperCase() + todaySession.status.slice(1)}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Fasting Timer */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="w-5 h-5" />
            Fasting Window
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="w-4 h-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Track your {todaySession.fasting_window_hours}-hour fasting period</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <div className="text-3xl font-mono font-bold">
              {formatTime(fastingElapsed)}
            </div>
            {todaySession.fasting_start_time && todaySession.status === 'fasting' && (
              <div className="text-sm text-muted-foreground">
                {formatTime(getTimeRemaining(fastingElapsed, todaySession.fasting_window_hours))} remaining
              </div>
            )}
          </div>

          {/* Fasting Progress Bar */}
          {todaySession.fasting_start_time && (
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${getProgress(fastingElapsed, todaySession.fasting_window_hours)}%` 
                }}
              />
            </div>
          )}

          {/* Fasting Controls */}
          <div className="flex gap-2">
            {!todaySession.fasting_start_time ? (
              <Button 
                onClick={handleStartFasting}
                disabled={isStartingFasting}
                className="flex-1"
              >
                <Play className="w-4 h-4 mr-2" />
                Start Fasting
              </Button>
            ) : todaySession.status === 'fasting' ? (
              <Button 
                onClick={handleEndFasting}
                disabled={isEndingFasting}
                className="flex-1"
                variant="outline"
              >
                <Square className="w-4 h-4 mr-2" />
                End Fasting
              </Button>
            ) : (
              <Button disabled className="flex-1" variant="outline">
                Fasting Complete
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Eating Timer */}
      {todaySession.eating_start_time && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Utensils className="w-5 h-5" />
              Eating Window
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="w-4 h-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Track your {todaySession.eating_window_hours}-hour eating period</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <div className="text-3xl font-mono font-bold">
                {formatTime(eatingElapsed)}
              </div>
              {todaySession.status === 'eating' && (
                <div className="text-sm text-muted-foreground">
                  {formatTime(getTimeRemaining(eatingElapsed, todaySession.eating_window_hours))} remaining
                </div>
              )}
            </div>

            {/* Eating Progress Bar */}
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${getProgress(eatingElapsed, todaySession.eating_window_hours)}%` 
                }}
              />
            </div>

            {/* Eating Controls */}
            {todaySession.status === 'eating' && !todaySession.completed && (
              <Button 
                onClick={handleEndEating}
                disabled={isEndingEating}
                className="w-full"
                variant="outline"
              >
                <Square className="w-4 h-4 mr-2" />
                End Eating Window
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};