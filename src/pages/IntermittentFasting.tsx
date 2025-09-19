import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IntermittentFastingTimer } from "@/components/IntermittentFastingTimer";
import { ResponsivePageHeader } from "@/components/ResponsivePageHeader";
import { FastingModeToggle } from "@/components/FastingModeToggle";
import { useTimerNavigation } from "@/hooks/useTimerNavigation";
import { useIntermittentFasting } from "@/hooks/useIntermittentFasting";
import { useMiniTimer } from "@/contexts/MiniTimerContext";
import { useAdminAnimationSettings } from "@/hooks/useAdminAnimationSettings";

const IntermittentFasting: React.FC = () => {
  const navigate = useNavigate();
  const { currentMode, switchMode } = useTimerNavigation();
  const { ifEnabled, todaySession } = useIntermittentFasting();
  const { updateTimer } = useMiniTimer();
  const { enable_if_slideshow } = useAdminAnimationSettings();

  // Update mini-timer with IF session data
  useEffect(() => {
    if (todaySession && ifEnabled) {
      const now = new Date();
      
      if (todaySession.fasting_start_time && !todaySession.fasting_end_time) {
        // Currently fasting
        const fastingStart = new Date(todaySession.fasting_start_time);
        const elapsedSeconds = Math.floor((now.getTime() - fastingStart.getTime()) / 1000);
        
        const hours = Math.floor(elapsedSeconds / 3600);
        const minutes = Math.floor((elapsedSeconds % 3600) / 60);
        const seconds = elapsedSeconds % 60;
        const displayTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        updateTimer('if-fasting', {
          id: 'if-fasting',
          type: 'if',
          displayTime,
          isActive: true,
          startTime: todaySession.fasting_start_time
        });
      } else if (todaySession.fasting_end_time && !todaySession.eating_end_time) {
        // Currently eating
        const eatingStart = new Date(todaySession.fasting_end_time);
        const elapsedSeconds = Math.floor((now.getTime() - eatingStart.getTime()) / 1000);
        
        const hours = Math.floor(elapsedSeconds / 3600);
        const minutes = Math.floor((elapsedSeconds % 3600) / 60);
        const seconds = elapsedSeconds % 60;
        const displayTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        updateTimer('if-eating', {
          id: 'if-eating',
          type: 'if-eating',
          displayTime,
          isActive: true,
          startTime: todaySession.fasting_end_time
        });
      }
    }
  }, [todaySession, ifEnabled, updateTimer]);

  return (
    <div className="relative min-h-[calc(100vh-80px)] bg-background p-4 overflow-x-hidden">
      <div className="max-w-md mx-auto pt-10 pb-40 safe-bottom">
        {/* Header with Toggle */}
        <div className="relative">
          <ResponsivePageHeader 
            title="Fasting Tracker"
            subtitle="Intermittent Fasting"
            onHistoryClick={() => navigate('/intermittent-fasting-history')}
            historyTitle="View IF history"
            showAuthorTooltip={true}
            authorTooltipContentKey="timer-if"
            authorTooltipContent="Track your intermittent fasting sessions with precise timing and progress visualization."
            className="pr-24" // Extra padding to make room for toggle
          />
        </div>
        
        <div className="space-y-6 mt-6">
          {/* Fasting Mode Toggle - aligned with manual restart toggle */}
          <FastingModeToggle
            currentMode={currentMode === 'walking' ? 'fasting' : currentMode}
            onModeChange={switchMode}
            showIF={ifEnabled === true} // Show only when explicitly enabled
          />
          
          <IntermittentFastingTimer showSlideshow={enable_if_slideshow} />
        </div>
      </div>
    </div>
  );
};

export default IntermittentFasting;