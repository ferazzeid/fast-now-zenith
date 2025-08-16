import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Sparkles, Heart, Timer } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';

export const AdminAnimationSettings = () => {
  const { profile, updateProfile } = useProfile();
  const { toast } = useToast();
  
  const [enableFastingSlideshow, setEnableFastingSlideshow] = useState(true);
  const [enableWalkingSlideshow, setEnableWalkingSlideshow] = useState(true);
  const [enableCeramicAnimations, setEnableCeramicAnimations] = useState(true);

  useEffect(() => {
    if (profile) {
      setEnableFastingSlideshow(profile.enable_fasting_slideshow ?? true);
      setEnableWalkingSlideshow(profile.enable_walking_slideshow ?? true);
      setEnableCeramicAnimations(profile.enable_ceramic_animations ?? true);
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
    <Card className="bg-ceramic-plate border-ceramic-rim">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-warm-text">
          <Sparkles className="w-5 h-5" />
          Animation Controls
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Heart className="w-4 h-4 text-primary" />
              <Label htmlFor="fasting-slideshow" className="text-warm-text">
                Fasting Motivator Slideshow
              </Label>
            </div>
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
            <div className="flex items-center space-x-3">
              <Heart className="w-4 h-4 text-primary" />
              <Label htmlFor="walking-slideshow" className="text-warm-text">
                Walking Motivator Slideshow
              </Label>
            </div>
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
            <div className="flex items-center space-x-3">
              <Timer className="w-4 h-4 text-primary" />
              <Label htmlFor="ceramic-animations" className="text-warm-text">
                Hourly Ceramic Timer Animations
              </Label>
            </div>
            <Switch
              id="ceramic-animations"
              checked={enableCeramicAnimations}
              onCheckedChange={(checked) => {
                setEnableCeramicAnimations(checked);
                handleAnimationToggle('enable_ceramic_animations', checked);
              }}
            />
          </div>
        </div>
        
        <div className="text-xs text-muted-foreground">
          Control visual animations and effects throughout the app. Disabling animations can improve performance on slower devices.
        </div>
      </CardContent>
    </Card>
  );
};