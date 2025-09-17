import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import { useCelebrationMilestones } from '@/hooks/useCelebrationMilestones';

export const AdminAnimationSettings = () => {
  const { profile, updateProfile } = useProfile();
  const { toast } = useToast();
  const { triggerCelebration } = useCelebrationMilestones();
  
  const [enableFastingSlideshow, setEnableFastingSlideshow] = useState(true);
  const [enableWalkingSlideshow, setEnableWalkingSlideshow] = useState(true);
  const [enableFoodSlideshow, setEnableFoodSlideshow] = useState(true);
  const [enableCeramicAnimations, setEnableCeramicAnimations] = useState(true);
  const [enableQuotesInAnimations, setEnableQuotesInAnimations] = useState(true);
  const [enableNotesInAnimations, setEnableNotesInAnimations] = useState(true);
  const [enableGoalsInAnimations, setEnableGoalsInAnimations] = useState(true);
  const [animationDuration, setAnimationDuration] = useState(10);

  useEffect(() => {
    if (profile) {
      setEnableFastingSlideshow(profile.enable_fasting_slideshow ?? true);
      setEnableWalkingSlideshow(profile.enable_walking_slideshow ?? true);
      setEnableFoodSlideshow((profile as any).enable_food_slideshow ?? true);
      setEnableCeramicAnimations(profile.enable_ceramic_animations ?? true);
      setEnableQuotesInAnimations((profile as any).enable_quotes_in_animations ?? true);
      setEnableNotesInAnimations((profile as any).enable_notes_in_animations ?? true);
      setEnableGoalsInAnimations((profile as any).enable_goals_in_animations ?? true);
      setAnimationDuration((profile as any).animation_duration_seconds ?? 10);
    }
  }, [profile]);

  const handleAnimationToggle = async (setting: string, value: boolean) => {
    try {
      const updates = { [setting]: value };
      await updateProfile(updates);
      
      toast({
        title: "Animation Settings Updated",
        description: "Your animation preferences have been saved.",
      });
    } catch (error) {
      console.error('Error updating animation settings:', error);
      toast({
        title: "Error",
        description: "Failed to update animation settings. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDurationChange = async (value: number[]) => {
    const duration = value[0];
    setAnimationDuration(duration);
    
    try {
      await updateProfile({ animation_duration_seconds: duration } as any);
      
      toast({
        title: "Animation Duration Updated",
        description: `Animation duration set to ${duration} seconds.`,
      });
    } catch (error) {
      console.error('Error updating animation duration:', error);
      toast({
        title: "Error",
        description: "Failed to update animation duration. Please try again.",
        variant: "destructive",
      });
    }
  };

  const testCelebration = (type: 'hourly' | 'completion', hours: number, message: string) => {
    triggerCelebration({
      type,
      hours,
      message
    });
    toast({
      title: "Celebration Triggered",
      description: `Testing ${message} celebration`,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Animation Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="fasting-slideshow">
              Fasting Motivator Slideshow
            </Label>
            <Switch
              id="fasting-slideshow"
              checked={enableFastingSlideshow}
              onCheckedChange={(checked) => {
                setEnableFastingSlideshow(checked);
                handleAnimationToggle('enable_fasting_slideshow', checked);
              }}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="walking-slideshow">
              Walking Motivator Slideshow
            </Label>
            <Switch
              id="walking-slideshow"
              checked={enableWalkingSlideshow}
              onCheckedChange={(checked) => {
                setEnableWalkingSlideshow(checked);
                handleAnimationToggle('enable_walking_slideshow', checked);
              }}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="food-slideshow">
              Food Tracking Slideshow
            </Label>
            <Switch
              id="food-slideshow"
              checked={enableFoodSlideshow}
              onCheckedChange={(checked) => {
                setEnableFoodSlideshow(checked);
                handleAnimationToggle('enable_food_slideshow', checked);
              }}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="ceramic-animations">
              Hourly Timer Animations
            </Label>
            <Switch
              id="ceramic-animations"
              checked={enableCeramicAnimations}
              onCheckedChange={(checked) => {
                setEnableCeramicAnimations(checked);
                handleAnimationToggle('enable_ceramic_animations', checked);
              }}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="quotes-in-animations">
              Show Quotes in Timer Animations
            </Label>
            <Switch
              id="quotes-in-animations"
              checked={enableQuotesInAnimations}
              onCheckedChange={(checked) => {
                setEnableQuotesInAnimations(checked);
                handleAnimationToggle('enable_quotes_in_animations', checked);
              }}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="notes-in-animations">
              Show Notes in Timer Animations
            </Label>
            <Switch
              id="notes-in-animations"
              checked={enableNotesInAnimations}
              onCheckedChange={(checked) => {
                setEnableNotesInAnimations(checked);
                handleAnimationToggle('enable_notes_in_animations', checked);
              }}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="goals-in-animations">
              Show Goals/Motivators in Timer Animations
            </Label>
            <Switch
              id="goals-in-animations"
              checked={enableGoalsInAnimations}
              onCheckedChange={(checked) => {
                setEnableGoalsInAnimations(checked);
                handleAnimationToggle('enable_goals_in_animations', checked);
              }}
            />
          </div>
          
          <div className="space-y-3">
            <Label htmlFor="animation-duration">
              Animation Duration: {animationDuration} seconds
            </Label>
            <Slider
              id="animation-duration"
              min={3}
              max={20}
              step={1}
              value={[animationDuration]}
              onValueChange={handleDurationChange}
              className="w-full"
            />
            <p className="text-sm text-muted-foreground">
              Controls how long each timer phase and content display lasts
            </p>
          </div>

          {/* Celebration Test Buttons */}
          <div className="space-y-3 pt-4 border-t border-border">
            <Label className="text-base font-medium">Test Celebrations</Label>
            <p className="text-sm text-muted-foreground mb-3">
              Test different milestone celebrations without waiting for actual milestones
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => testCelebration('hourly', 1, '1 Hour Strong!')}
                className="text-xs"
              >
                Test 1 Hour
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => testCelebration('hourly', 4, '4 Hours of Power!')}
                className="text-xs"
              >
                Test 4 Hours
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => testCelebration('hourly', 12, '12 Hours of Strength!')}
                className="text-xs"
              >
                Test 12 Hours
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => testCelebration('hourly', 24, '24 Hours of Mastery!')}
                className="text-xs"
              >
                Test 24 Hours
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => testCelebration('completion', 48, 'Fasting Goal Complete!')}
                className="text-xs col-span-2"
              >
                Test Completion
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};