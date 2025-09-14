import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { UniversalModal } from '@/components/ui/universal-modal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Settings, RotateCcw } from 'lucide-react';
import { useDailyActivityOverride } from '@/hooks/useDailyActivityOverride';
import { useProfile } from '@/hooks/useProfile';

interface ActivityLevelOverrideProps {
  currentDisplayLevel: string;
}

const ACTIVITY_LEVELS = {
  sedentary: 'Sedentary',
  lightly_active: 'Lightly Active',
  moderately_active: 'Moderately Active',
  very_active: 'Very Active'
};

export const ActivityLevelOverride: React.FC<ActivityLevelOverrideProps> = ({ currentDisplayLevel }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState('');
  const [isPermanent, setIsPermanent] = useState(false);
  const { todayOverride, loading, setActivityOverride, clearTodayOverride } = useDailyActivityOverride();
  const { profile } = useProfile();

  const handleSave = async () => {
    if (!selectedLevel) return;
    
    await setActivityOverride(selectedLevel, isPermanent);
    setIsOpen(false);
    setSelectedLevel('');
    setIsPermanent(false);
  };

  const handleClear = async () => {
    await clearTodayOverride();
    setIsOpen(false);
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="h-auto p-1 text-xs text-muted-foreground hover:text-foreground"
        onClick={() => setIsOpen(true)}
      >
        <Settings className="w-3 h-3 mr-1" />
        {todayOverride ? 'Override Active' : 'Override'}
      </Button>

      <UniversalModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Daily Activity Override"
        description="Change your activity level for today's calorie calculations."
        size="md"
        footer={
          <div className="flex justify-between w-full">
            <div>
              {todayOverride && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClear}
                  disabled={loading}
                >
                  <RotateCcw className="w-4 h-4 mr-1" />
                  Clear Override
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={!selectedLevel || loading}
              >
                {isPermanent ? 'Save Permanently' : 'Apply for Today'}
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-4">
          {/* Current Status */}
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="text-sm font-medium text-foreground mb-2">Current Status:</div>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">
                Default: {ACTIVITY_LEVELS[profile?.activity_level as keyof typeof ACTIVITY_LEVELS] || 'Not set'}
              </div>
              {todayOverride && (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    Today's Override: {ACTIVITY_LEVELS[todayOverride.activity_level as keyof typeof ACTIVITY_LEVELS]}
                  </Badge>
                </div>
              )}
            </div>
          </div>

          {/* Activity Level Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">New Activity Level:</label>
            <Select value={selectedLevel} onValueChange={setSelectedLevel}>
              <SelectTrigger>
                <SelectValue placeholder="Choose activity level for today" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ACTIVITY_LEVELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Permanent Toggle */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="permanent"
              checked={isPermanent}
              onChange={(e) => setIsPermanent(e.target.checked)}
              className="w-4 h-4 text-primary"
            />
            <label htmlFor="permanent" className="text-sm text-muted-foreground">
              Make this my new default activity level
            </label>
          </div>
        </div>
      </UniversalModal>
    </>
  );
};