import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useDailyDeficitQuery } from '@/hooks/optimized/useDailyDeficitQuery';
import { useProfile } from '@/hooks/useProfile';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export const DailyStatsPanel = () => {
  const { deficit, isLoading } = useDailyDeficitQuery();
  const { profile } = useProfile();
  const [isOpen, setIsOpen] = useState(false);

  const isProfileComplete = () => {
    return !!(profile?.weight && profile?.height && profile?.age);
  };

  if (!isProfileComplete()) {
    return null;
  }

  const getDeficitColor = () => {
    const percentage = deficit?.percentage || 0;
    if (percentage >= 20) return 'text-green-600';
    if (percentage >= 10) return 'text-yellow-600';
    return 'text-gray-600';
  };

  return (
    <div className="w-full max-w-md mx-auto mb-4 px-4">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between p-3 bg-background border rounded-lg hover:bg-muted/50 transition-colors">
            <span className="text-sm font-medium">Deficit Overview</span>
            <ChevronDown 
              className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
            />
          </div>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="mt-2">
          <div className="p-4 bg-card border rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Caloric Deficit</span>
              <div className={`text-lg font-semibold ${getDeficitColor()}`}>
                {isLoading ? '...' : Math.round(deficit?.calories || 0)} kcal
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Percentage</span>
              <span className={`text-sm font-medium ${getDeficitColor()}`}>
                {deficit?.percentage || 0}%
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">BMR</span>
              <span className="text-sm">
                {deficit?.bmr || 0} kcal
              </span>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};