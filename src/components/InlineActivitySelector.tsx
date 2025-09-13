import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDailyActivityOverride } from '@/hooks/useDailyActivityOverride';
import { useProfile } from '@/hooks/useProfile';
import { useDailyDeficitQuery } from '@/hooks/optimized/useDailyDeficitQuery';

interface InlineActivitySelectorProps {
  currentDisplayLevel: string;
}

const ACTIVITY_LEVELS = {
  sedentary: 'Sedentary',
  lightly_active: 'Lightly Active',
  moderately_active: 'Moderately Active',
  very_active: 'Very Active'
};

// Calculate TDEE using proper multipliers
const getCalorieAddition = (level: string, bmr: number) => {
  if (bmr === 0) return 0;
  
  const activityMultipliers = {
    sedentary: 1.2,          // Little/no exercise
    lightly_active: 1.375,   // Light exercise 1-3 days/week
    moderately_active: 1.55, // Moderate exercise 3-5 days/week
    very_active: 1.725       // Hard exercise 6-7 days/week
  };
  
  const sedentaryTdee = bmr * 1.2;
  const levelTdee = bmr * (activityMultipliers[level as keyof typeof activityMultipliers] || 1.2);
  
  // Show additional calories above sedentary level
  return Math.round(levelTdee - sedentaryTdee);
};

export const InlineActivitySelector: React.FC<InlineActivitySelectorProps> = ({ 
  currentDisplayLevel 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { todayOverride, loading, setActivityOverride, clearTodayOverride } = useDailyActivityOverride();
  const { profile, calculateBMR } = useProfile();
  const { refreshDeficit } = useDailyDeficitQuery();

  const handleValueChange = async (value: string) => {
    try {
      // Don't close dropdown immediately - let user see the change
      if (value === 'clear-override' && todayOverride) {
        await clearTodayOverride();
      } else if (value !== getCurrentValue()) {
        await setActivityOverride(value, false);
      }
      
      // Refresh deficit calculations after change
      await refreshDeficit();
      
      // Close dropdown after a short delay to show the change
      setTimeout(() => setIsOpen(false), 300);
    } catch (error) {
      console.error('Error handling activity level change:', error);
      // Keep dropdown open on error so user can try again
    }
  };

  const getCurrentValue = () => {
    return todayOverride ? todayOverride.activity_level : (profile?.activity_level || 'lightly_active');
  };

  const getDisplayLabel = (level: string) => {
    const baseName = ACTIVITY_LEVELS[level as keyof typeof ACTIVITY_LEVELS] || level;
    const bmr = calculateBMR();
    const calorieAddition = getCalorieAddition(level, bmr);
    
    if (calorieAddition > 0) {
      return `${baseName} (+${calorieAddition} cal)`;
    }
    return `${baseName} (Base Rate)`;
  };

  return (
    <div className="space-y-2">
      <Select 
        value={getCurrentValue()} 
        onValueChange={handleValueChange}
        open={isOpen}
        onOpenChange={setIsOpen}
        disabled={loading}
      >
        <SelectTrigger className="h-7 text-xs bg-ceramic-base border-ceramic-rim hover:bg-ceramic-plate transition-colors">
          <SelectValue>
            <div className="flex items-center gap-2">
              <span>{getDisplayLabel(getCurrentValue())}</span>
              {todayOverride && (
                <div className="w-2 h-2 bg-primary rounded-full"></div>
              )}
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="bg-ceramic-plate border-ceramic-rim z-50">
          {Object.entries(ACTIVITY_LEVELS).map(([key, label]) => (
            <SelectItem 
              key={key} 
              value={key}
              className="text-xs hover:bg-ceramic-base focus:bg-ceramic-base"
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex flex-col">
                  <span>{label}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {(() => {
                      const bmr = calculateBMR();
                      const addition = getCalorieAddition(key, bmr);
                      return addition > 0 ? `+${addition} cal/day` : 'Base metabolic rate';
                    })()}
                  </span>
                </div>
                {key === profile?.activity_level && !todayOverride && (
                  <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 ml-2">
                    Default
                  </Badge>
                )}
              </div>
            </SelectItem>
          ))}
          {todayOverride && (
            <>
              <div className="border-t border-ceramic-rim my-1" />
              <div className="px-2 py-1 text-[10px] text-muted-foreground flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                <span>Active for today only</span>
              </div>
              <SelectItem 
                value="clear-override"
                className="text-xs text-muted-foreground hover:bg-ceramic-base focus:bg-ceramic-base"
              >
                <div className="flex items-center gap-1">
                  <RotateCcw className="w-3 h-3" />
                  <span>Clear Override</span>
                </div>
              </SelectItem>
            </>
          )}
        </SelectContent>
      </Select>
      
    </div>
  );
};