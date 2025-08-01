import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDailyActivityOverride } from '@/hooks/useDailyActivityOverride';
import { useProfile } from '@/hooks/useProfile';

interface InlineActivitySelectorProps {
  currentDisplayLevel: string;
}

const ACTIVITY_LEVELS = {
  sedentary: 'Sedentary',
  lightly_active: 'Lightly Active',
  moderately_active: 'Moderately Active',
  very_active: 'Very Active',
  extremely_active: 'Extremely Active'
};

export const InlineActivitySelector: React.FC<InlineActivitySelectorProps> = ({ 
  currentDisplayLevel 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { todayOverride, loading, setActivityOverride, clearTodayOverride } = useDailyActivityOverride();
  const { profile } = useProfile();

  const handleValueChange = async (value: string) => {
    if (value === 'clear-override' && todayOverride) {
      await clearTodayOverride();
    } else if (value !== currentDisplayLevel) {
      await setActivityOverride(value, false);
    }
    setIsOpen(false);
  };

  const getCurrentValue = () => {
    return todayOverride ? todayOverride.activity_level : (profile?.activity_level || 'sedentary');
  };

  const getDisplayLabel = (level: string) => {
    const baseLabel = ACTIVITY_LEVELS[level as keyof typeof ACTIVITY_LEVELS] || level;
    return todayOverride ? `${baseLabel} (Override)` : baseLabel;
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
            <div className="flex items-center gap-1">
              <span>{getDisplayLabel(getCurrentValue())}</span>
              {todayOverride && (
                <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">
                  Today
                </Badge>
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
                <span>{label}</span>
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
      
      {todayOverride && (
        <div className="text-[10px] text-muted-foreground text-center">
          Override active for today only
        </div>
      )}
    </div>
  );
};