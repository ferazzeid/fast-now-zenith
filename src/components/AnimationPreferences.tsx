import React from 'react';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Sparkles } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';

export const AnimationPreferences = () => {
  const { profile, updateProfile } = useProfile();
  const { toast } = useToast();

  const handleToggle = async (setting: string, value: boolean) => {
    try {
      await updateProfile({ [setting]: value });
      toast({
        title: "Animation setting updated",
        description: `Successfully ${value ? 'enabled' : 'disabled'} ${setting.replace('enable_', '').replace('_', ' ')}`
      });
    } catch (error) {
      console.error('Error updating animation setting:', error);
      toast({
        title: "Error",
        description: "Failed to update animation setting. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="p-6 bg-card border-ceramic-rim">
      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          <Sparkles className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold text-warm-text">Timer Animations</h3>
        </div>
        
        <p className="text-sm text-muted-foreground">
          Control what content appears during your fasting and walking timer sessions
        </p>
        
        <div className="space-y-4">
          {/* Quotes in Animations */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="quotes-toggle" className="text-warm-text font-medium">
                Show Quotes in Timers
              </Label>
              <p className="text-xs text-muted-foreground">
                Display saved quotes during fasting and walking sessions
              </p>
            </div>
            <Switch
              id="quotes-toggle"
              checked={profile?.enable_quotes_in_animations ?? true}
              onCheckedChange={(checked) => handleToggle('enable_quotes_in_animations', checked)}
            />
          </div>

          {/* Notes in Animations */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="notes-toggle" className="text-warm-text font-medium">
                Show Notes in Timers
              </Label>
              <p className="text-xs text-muted-foreground">
                Display your personal notes during fasting and walking sessions
              </p>
            </div>
            <Switch
              id="notes-toggle"
              checked={profile?.enable_notes_in_animations ?? true}
              onCheckedChange={(checked) => handleToggle('enable_notes_in_animations', checked)}
            />
          </div>
        </div>
      </div>
    </Card>
  );
};