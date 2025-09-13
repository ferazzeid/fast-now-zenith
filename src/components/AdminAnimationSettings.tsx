import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';

export const AdminAnimationSettings = () => {
  const { profile, updateProfile } = useProfile();
  const { toast } = useToast();
  
  const [enableFastingSlideshow, setEnableFastingSlideshow] = useState(true);
  const [enableWalkingSlideshow, setEnableWalkingSlideshow] = useState(true);
  const [enableCeramicAnimations, setEnableCeramicAnimations] = useState(true);
  const [enableQuotesInAnimations, setEnableQuotesInAnimations] = useState(true);
  const [enableNotesInAnimations, setEnableNotesInAnimations] = useState(true);

  useEffect(() => {
    if (profile) {
      setEnableFastingSlideshow(profile.enable_fasting_slideshow ?? true);
      setEnableWalkingSlideshow(profile.enable_walking_slideshow ?? true);
      setEnableCeramicAnimations(profile.enable_ceramic_animations ?? true);
      setEnableQuotesInAnimations(profile.enable_quotes_in_animations ?? true);
      setEnableNotesInAnimations(profile.enable_notes_in_animations ?? true);
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
            <Label htmlFor="ceramic-animations">
              Hourly Ceramic Timer Animations
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
        </div>
        
        <div className="text-xs text-muted-foreground">
          Control visual animations and effects throughout the app. Disabling animations can improve performance on slower devices. Goals will always appear in timer animations regardless of these settings.
        </div>
      </CardContent>
    </Card>
  );
};