import React from 'react';
import { IntermittentFastingTimer } from "@/components/IntermittentFastingTimer";
import { ResponsivePageHeader } from "@/components/ResponsivePageHeader";
import { FastingModeToggle } from "@/components/FastingModeToggle";
import { useTimerNavigation } from "@/hooks/useTimerNavigation";
import { useIntermittentFasting } from "@/hooks/useIntermittentFasting";

const IntermittentFasting: React.FC = () => {
  const { currentMode, switchMode } = useTimerNavigation();
  const { ifEnabled } = useIntermittentFasting();

  return (
    <div className="relative min-h-[calc(100vh-80px)] bg-background p-4 overflow-x-hidden">
      <div className="max-w-md mx-auto pt-10 pb-40 safe-bottom">
        {/* Header with Toggle */}
        <div className="relative">
          <ResponsivePageHeader 
            title="Fasting Tracker"
            subtitle="Start Your Fast"
          />
          
          <FastingModeToggle
            currentMode={currentMode === 'walking' ? 'fasting' : currentMode}
            onModeChange={switchMode}
            showIF={ifEnabled}
          />
        </div>
        
        <div className="space-y-6 mt-6">
          <IntermittentFastingTimer />
        </div>
      </div>
    </div>
  );
};

export default IntermittentFasting;