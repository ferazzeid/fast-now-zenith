import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, Square, Clock, Utensils, ChevronDown, ChevronUp } from "lucide-react";
import { useIntermittentFasting, IF_PRESETS } from "@/hooks/useIntermittentFasting";
import { CustomScheduleSlider } from "@/components/CustomScheduleSlider";
import { cn } from '@/lib/utils';

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
  const [activeTab, setActiveTab] = useState("presets");
  const [countDirection, setCountDirection] = useState<'up' | 'down'>('up');

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

  const getDisplayTime = (elapsedSeconds: number, totalHours: number) => {
    if (countDirection === 'up') {
      return formatTime(elapsedSeconds);
    } else {
      return formatTime(getTimeRemaining(elapsedSeconds, totalHours));
    }
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

  const handleCustomScheduleSelect = async (fastingHours: number, eatingHours: number) => {
    try {
      await startIFSession({
        fasting_window_hours: fastingHours,
        eating_window_hours: eatingHours
      });
      setActiveTab("presets"); // Switch back to main view
    } catch (error) {
      console.error('Failed to start custom IF session:', error);
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

  // No session - show preset selection and custom slider
  if (!todaySession) {
    return (
      <div className={`max-w-md mx-auto space-y-6 ${className}`}>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="presets">Quick Start</TabsTrigger>
            <TabsTrigger value="custom">Custom</TabsTrigger>
          </TabsList>
          
          <TabsContent value="presets" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-center">Start Intermittent Fasting</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-3">
                  {IF_PRESETS.map((preset) => (
                    <Button
                      key={preset.name}
                      variant={selectedPreset.name === preset.name ? "default" : "outline"}
                      className="h-auto p-4 text-left justify-start"
                      onClick={() => setSelectedPreset(preset)}
                    >
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div className="font-semibold text-lg">{preset.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {preset.fasting_hours}h fast
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {preset.description}
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
                  size="lg"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Start {selectedPreset.name} Session
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="custom" className="mt-6">
            <CustomScheduleSlider onScheduleSelect={handleCustomScheduleSelect} />
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  // Active session - show ceramic-style dual timers
  return (
    <div className={`max-w-md mx-auto space-y-6 ${className}`}>
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

      {/* Ceramic-style Fasting Timer */}
      <div className="relative flex items-center justify-center">
        <div 
          className="relative w-80 h-80 rounded-full"
          style={{
            background: 'var(--gradient-ceramic)',
            boxShadow: 'var(--shadow-plate)',
          }}
        >
          {/* Outer rim */}
          <div 
            className="absolute inset-0 rounded-full"
            style={{
              background: 'var(--gradient-rim)',
              boxShadow: 'var(--shadow-rim)',
            }}
          />
          
          {/* Center well */}
          <div 
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-52 h-52 rounded-full flex items-center justify-center"
            style={{
              background: 'var(--gradient-well)',
              boxShadow: 'var(--shadow-well)',
            }}
          >
            {/* Progress ring for fasting */}
            <svg 
              className="absolute inset-0 w-full h-full transform -rotate-90"
              viewBox="0 0 100 100"
              style={{ zIndex: 12 }}
            >
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="hsl(var(--ceramic-deep))"
                strokeWidth="2"
                opacity="0.3"
              />
              {/* Fasting progress circle */}
              {todaySession.fasting_start_time && (
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="hsl(var(--accent))"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 45}
                  strokeDashoffset={2 * Math.PI * 45 - (getProgress(fastingElapsed, todaySession.fasting_window_hours) / 100) * 2 * Math.PI * 45}
                  className="transition-all duration-1000 ease-out"
                  style={{
                    filter: todaySession.status === 'fasting' ? `drop-shadow(0 0 6px hsl(var(--accent) / 0.4))` : 'none'
                  }}
                />
              )}
            </svg>
            
            {/* Fasting Timer display */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-center space-y-1">
                {/* Window Type */}
                <div className={cn(
                  "text-sm font-medium transition-colors duration-300 flex items-center gap-1",
                  todaySession.status === 'fasting' ? 'text-foreground' : 'text-muted-foreground'
                )}>
                  <Clock className="w-4 h-4" />
                  Fasting Window
                </div>
                
                {/* Main Timer */}
                <div 
                  className={cn(
                    "font-mono font-bold tracking-wide transition-colors duration-300 text-4xl",
                    todaySession.status === 'fasting' ? "text-warm-text" : "text-foreground"
                  )}
                  style={{ 
                    textShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    fontFeatureSettings: '"tnum" 1',
                    lineHeight: '1.1'
                  }}
                >
                  {todaySession.fasting_start_time 
                    ? getDisplayTime(fastingElapsed, todaySession.fasting_window_hours)
                    : '00:00:00'
                  }
                </div>
                
                {/* Progress info */}
                {todaySession.fasting_start_time && (
                  <div className="text-xs text-muted-foreground font-medium">
                    {Math.max(1, Math.round(getProgress(fastingElapsed, todaySession.fasting_window_hours)))}% • {todaySession.fasting_window_hours}h goal
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Count Direction Toggle */}
          {todaySession.fasting_start_time && (
            <button
              onClick={() => setCountDirection(prev => prev === 'up' ? 'down' : 'up')}
              className="absolute bottom-16 right-4 w-8 h-8 rounded-full bg-ceramic-base/80 hover:bg-ceramic-base border border-subtle flex items-center justify-center text-xs text-muted-foreground hover:text-warm-text transition-all duration-200 backdrop-blur-sm z-10"
              title={countDirection === 'up' ? 'Switch to Countdown' : 'Switch to Count Up'}
            >
              {countDirection === 'up' ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          )}

          {/* Subtle highlight on rim edge */}
          <div 
            className="absolute inset-1 rounded-full pointer-events-none"
            style={{
              zIndex: 5,
              background: 'conic-gradient(from 45deg, transparent 0deg, hsl(0 0% 100% / 0.1) 90deg, transparent 180deg, hsl(0 0% 100% / 0.05) 270deg, transparent 360deg)',
            }}
          />
        </div>
      </div>

      {/* Fasting Controls */}
      <div className="flex gap-2">
        {!todaySession.fasting_start_time ? (
          <Button 
            onClick={handleStartFasting}
            disabled={isStartingFasting}
            className="flex-1"
            size="lg"
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
            size="lg"
          >
            <Square className="w-4 h-4 mr-2" />
            End Fasting
          </Button>
        ) : (
          <Button disabled className="flex-1" variant="outline" size="lg">
            Fasting Complete
          </Button>
        )}
      </div>

      {/* Ceramic-style Eating Timer */}
      {todaySession.eating_start_time && (
        <>
          <div className="relative flex items-center justify-center">
            <div 
              className="relative w-64 h-64 rounded-full"
              style={{
                background: 'var(--gradient-ceramic)',
                boxShadow: 'var(--shadow-plate)',
              }}
            >
              {/* Outer rim */}
              <div 
                className="absolute inset-0 rounded-full"
                style={{
                  background: 'var(--gradient-rim)',
                  boxShadow: 'var(--shadow-rim)',
                }}
              />
              
              {/* Center well */}
              <div 
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full flex items-center justify-center"
                style={{
                  background: 'var(--gradient-well)',
                  boxShadow: 'var(--shadow-well)',
                }}
              >
                {/* Progress ring for eating */}
                <svg 
                  className="absolute inset-0 w-full h-full transform -rotate-90"
                  viewBox="0 0 100 100"
                >
                  {/* Background circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="hsl(var(--ceramic-deep))"
                    strokeWidth="2"
                    opacity="0.3"
                  />
                  {/* Eating progress circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="rgb(34, 197, 94)" // green-500
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 45}
                    strokeDashoffset={2 * Math.PI * 45 - (getProgress(eatingElapsed, todaySession.eating_window_hours) / 100) * 2 * Math.PI * 45}
                    className="transition-all duration-1000 ease-out"
                    style={{
                      filter: todaySession.status === 'eating' ? `drop-shadow(0 0 6px rgb(34, 197, 94, 0.4))` : 'none'
                    }}
                  />
                </svg>
                
                {/* Eating Timer display */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-center space-y-1">
                    {/* Window Type */}
                    <div className={cn(
                      "text-sm font-medium transition-colors duration-300 flex items-center gap-1",
                      todaySession.status === 'eating' ? 'text-foreground' : 'text-muted-foreground'
                    )}>
                      <Utensils className="w-4 h-4" />
                      Eating Window
                    </div>
                    
                    {/* Main Timer */}
                    <div 
                      className={cn(
                        "font-mono font-bold tracking-wide transition-colors duration-300 text-3xl",
                        todaySession.status === 'eating' ? "text-warm-text" : "text-foreground"
                      )}
                      style={{ 
                        textShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        fontFeatureSettings: '"tnum" 1',
                        lineHeight: '1.1'
                      }}
                    >
                      {getDisplayTime(eatingElapsed, todaySession.eating_window_hours)}
                    </div>
                    
                    {/* Progress info */}
                    <div className="text-xs text-muted-foreground font-medium">
                      {Math.max(1, Math.round(getProgress(eatingElapsed, todaySession.eating_window_hours)))}% • {todaySession.eating_window_hours}h window
                    </div>
                  </div>
                </div>
              </div>

              {/* Subtle highlight on rim edge */}
              <div 
                className="absolute inset-1 rounded-full pointer-events-none"
                style={{
                  zIndex: 5,
                  background: 'conic-gradient(from 45deg, transparent 0deg, hsl(0 0% 100% / 0.1) 90deg, transparent 180deg, hsl(0 0% 100% / 0.05) 270deg, transparent 360deg)',
                }}
              />
            </div>
          </div>

          {/* Eating Controls */}
          {todaySession.status === 'eating' && !todaySession.completed && (
            <Button 
              onClick={handleEndEating}
              disabled={isEndingEating}
              className="w-full"
              variant="outline"
              size="lg"
            >
              <Square className="w-4 h-4 mr-2" />
              End Eating Window
            </Button>
          )}
        </>
      )}
    </div>
  );
};