import { AdminSubnav } from '@/components/AdminSubnav';
import { AdminHealthCheck } from '@/components/AdminHealthCheck';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import { useCelebrationMilestones, MilestoneEvent } from '@/hooks/useCelebrationMilestones';
import { EnhancedCelebrationSystem } from '@/components/EnhancedCelebrationSystem';
import { SpectacularCelebrationSystem } from '@/components/SpectacularCelebrationSystem';
import { usePageSEO } from '@/hooks/usePageSEO';
import { useState, useEffect } from 'react';

export default function AdminAnimations() {
  usePageSEO({
    title: "Admin - Animations & Celebrations",
    description: "Configure celebration animations and milestone settings",
    canonicalPath: "/admin/animations",
  });

  const { profile, updateProfile } = useProfile();
  const { toast } = useToast();
  const { celebration, triggerCelebration } = useCelebrationMilestones();
  
  // Animation settings state
  const [enableFastingSlideshow, setEnableFastingSlideshow] = useState(true);
  const [enableWalkingSlideshow, setEnableWalkingSlideshow] = useState(true);
  const [enableFoodSlideshow, setEnableFoodSlideshow] = useState(true);
  const [enableHourlyTimer, setEnableHourlyTimer] = useState(true);
  const [enableQuotesInAnimations, setEnableQuotesInAnimations] = useState(true);
  const [enableNotesInAnimations, setEnableNotesInAnimations] = useState(true);
  const [enableGoalsInAnimations, setEnableGoalsInAnimations] = useState(true);
  const [animationDuration, setAnimationDuration] = useState([10]);
  
  // Celebration mode settings
  const [celebrationMode, setCelebrationMode] = useState<'modest' | 'spectacular'>('spectacular');
  const [celebrationIntensity, setCelebrationIntensity] = useState([8]);
  const [enableScreenFlash, setEnableScreenFlash] = useState(true);
  const [enableConfetti, setEnableConfetti] = useState(true);
  const [enableFireworks, setEnableFireworks] = useState(true);
  const [enableScreenShake, setEnableScreenShake] = useState(true);

  // Populate settings from profile
  useEffect(() => {
    if (profile) {
      setEnableFastingSlideshow((profile as any)?.enable_fasting_slideshow ?? true);
      setEnableWalkingSlideshow((profile as any)?.enable_walking_slideshow ?? true);
      setEnableFoodSlideshow((profile as any)?.enable_food_slideshow ?? true);
      setEnableHourlyTimer((profile as any)?.enable_hourly_timer ?? true);
      setEnableQuotesInAnimations((profile as any)?.enable_quotes_in_animations ?? true);
      setEnableNotesInAnimations((profile as any)?.enable_notes_in_animations ?? true);
      setEnableGoalsInAnimations((profile as any)?.enable_goals_in_animations ?? true);
      setAnimationDuration([(profile as any)?.animation_duration_seconds ?? 10]);
      setCelebrationMode((profile as any)?.celebration_mode ?? 'spectacular');
      setCelebrationIntensity([(profile as any)?.celebration_intensity ?? 8]);
      setEnableScreenFlash((profile as any)?.enable_screen_flash ?? true);
      setEnableConfetti((profile as any)?.enable_confetti ?? true);
      setEnableFireworks((profile as any)?.enable_fireworks ?? true);
      setEnableScreenShake((profile as any)?.enable_screen_shake ?? true);
    }
  }, [profile]);

  const handleAnimationToggle = async (key: string, value: boolean) => {
    try {
      await updateProfile({ [key]: value });
      toast({
        title: "Settings Updated",
        description: `Animation setting ${value ? 'enabled' : 'disabled'}`,
        duration: 2000,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update animation settings",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const handleSliderChange = async (key: string, value: number[]) => {
    try {
      await updateProfile({ [key]: value[0] });
      toast({
        title: "Settings Updated", 
        description: `${key.replace(/_/g, ' ')} updated to ${value[0]}`,
        duration: 2000,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update settings",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const testCelebration = (type: 'hourly' | 'completion', hours: number, message: string) => {
    triggerCelebration({
      type,
      hours,
      message: `🎉 Testing: ${message}`
    });
    toast({
      title: "Celebration Triggered",
      description: `Testing ${message} celebration`,
      duration: 2000,
    });
  };

  return (
    <AdminHealthCheck>
      <div className="min-h-screen bg-background">
        <AdminSubnav />
        
        <div className="container mx-auto p-6 mt-6 space-y-6">
          {/* Slideshow Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Slideshow Animations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="fasting-slideshow">Fasting Slideshow</Label>
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
                  <Label htmlFor="walking-slideshow">Walking Slideshow</Label>
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
                  <Label htmlFor="food-slideshow">Food Slideshow</Label>
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
                  <Label htmlFor="hourly-timer">Hourly Timer Animations</Label>
                  <Switch
                    id="hourly-timer"
                    checked={enableHourlyTimer}
                    onCheckedChange={(checked) => {
                      setEnableHourlyTimer(checked);
                      handleAnimationToggle('enable_hourly_timer', checked);
                    }}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Animation Duration: {animationDuration[0]} seconds</Label>
                <Slider
                  value={animationDuration}
                  onValueChange={(value) => {
                    setAnimationDuration(value);
                    handleSliderChange('animation_duration_seconds', value);
                  }}
                  max={30}
                  min={3}
                  step={1}
                  className="w-full"
                />
              </div>
            </CardContent>
          </Card>

          {/* Content in Animations */}
          <Card>
            <CardHeader>
              <CardTitle>Content in Animations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="quotes-in-animations">Quotes</Label>
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
                  <Label htmlFor="notes-in-animations">Notes</Label>
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
                  <Label htmlFor="goals-in-animations">Goals</Label>
                  <Switch
                    id="goals-in-animations"
                    checked={enableGoalsInAnimations}
                    onCheckedChange={(checked) => {
                      setEnableGoalsInAnimations(checked);
                      handleAnimationToggle('enable_goals_in_animations', checked);
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Celebration Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Celebration System</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Celebration Mode</Label>
                  <div className="flex gap-2">
                    <Button
                      variant={celebrationMode === 'modest' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setCelebrationMode('modest');
                        handleAnimationToggle('celebration_mode', 'modest' as any);
                      }}
                    >
                      Modest
                    </Button>
                    <Button
                      variant={celebrationMode === 'spectacular' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setCelebrationMode('spectacular');
                        handleAnimationToggle('celebration_mode', 'spectacular' as any);
                      }}
                    >
                      Spectacular
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Celebration Intensity: {celebrationIntensity[0]}/10</Label>
                  <Slider
                    value={celebrationIntensity}
                    onValueChange={(value) => {
                      setCelebrationIntensity(value);
                      handleSliderChange('celebration_intensity', value);
                    }}
                    max={10}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <Label className="text-sm font-medium">Celebration Effects</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="screen-flash">Screen Flash</Label>
                    <Switch
                      id="screen-flash"
                      checked={enableScreenFlash}
                      onCheckedChange={(checked) => {
                        setEnableScreenFlash(checked);
                        handleAnimationToggle('enable_screen_flash', checked);
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="confetti">Confetti Rain</Label>
                    <Switch
                      id="confetti"
                      checked={enableConfetti}
                      onCheckedChange={(checked) => {
                        setEnableConfetti(checked);
                        handleAnimationToggle('enable_confetti', checked);
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="fireworks">Fireworks</Label>
                    <Switch
                      id="fireworks"
                      checked={enableFireworks}
                      onCheckedChange={(checked) => {
                        setEnableFireworks(checked);
                        handleAnimationToggle('enable_fireworks', checked);
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="screen-shake">Screen Shake</Label>
                    <Switch
                      id="screen-shake"
                      checked={enableScreenShake}
                      onCheckedChange={(checked) => {
                        setEnableScreenShake(checked);
                        handleAnimationToggle('enable_screen_shake', checked);
                      }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Test Celebrations */}
          <Card>
            <CardHeader>
              <CardTitle>Test Celebrations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium mb-2 block">Short Fast Tests (1-12 hours)</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <Button variant="outline" size="sm" onClick={() => testCelebration('hourly', 1, '1 hour milestone')}>1h</Button>
                    <Button variant="outline" size="sm" onClick={() => testCelebration('hourly', 3, '3 hour milestone')}>3h</Button>
                    <Button variant="outline" size="sm" onClick={() => testCelebration('hourly', 6, '6 hour milestone')}>6h</Button>
                    <Button variant="outline" size="sm" onClick={() => testCelebration('hourly', 12, '12 hour milestone')}>12h</Button>
                  </div>
                </div>

                <Separator />

                <div>
                  <Label className="text-sm font-medium mb-2 block">Medium Fast Tests (12-24 hours)</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <Button variant="outline" size="sm" onClick={() => testCelebration('hourly', 15, '15 hour milestone')}>15h</Button>
                    <Button variant="outline" size="sm" onClick={() => testCelebration('hourly', 18, '18 hour milestone')}>18h</Button>
                    <Button variant="outline" size="sm" onClick={() => testCelebration('completion', 24, '1 Day Complete!')}>24h (1 Day)</Button>
                  </div>
                </div>

                <Separator />

                <div>
                  <Label className="text-sm font-medium mb-2 block">Long Fast Tests (24-72 hours)</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <Button variant="outline" size="sm" onClick={() => testCelebration('hourly', 36, '36 hour milestone')}>36h</Button>
                    <Button variant="outline" size="sm" onClick={() => testCelebration('completion', 48, '2 Days Complete!')}>48h (2 Days)</Button>
                    <Button variant="outline" size="sm" onClick={() => testCelebration('hourly', 60, '60 hour milestone')}>60h</Button>
                    <Button variant="outline" size="sm" onClick={() => testCelebration('completion', 72, '3 Days Complete!')}>72h (3 Days)</Button>
                  </div>
                </div>

                <Separator />

                <div>
                  <Label className="text-sm font-medium mb-2 block">Epic Fast Tests (72+ hours)</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <Button variant="outline" size="sm" onClick={() => testCelebration('completion', 96, '4 Days Complete!')}>96h (4 Days)</Button>
                    <Button variant="outline" size="sm" onClick={() => testCelebration('completion', 120, '5 Days Complete!')}>120h (5 Days)</Button>
                    <Button variant="outline" size="sm" onClick={() => testCelebration('completion', 168, '1 Week Complete!')}>168h (1 Week)</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Celebration Systems */}
        {celebrationMode === 'spectacular' ? (
          <SpectacularCelebrationSystem
            isVisible={celebration.enhancedVisible}
            type={celebration.currentEvent?.type || 'hourly'}
            hours={celebration.currentEvent?.hours || 1}
            message={celebration.currentEvent?.message || ''}
            onClose={() => {}}
            intensity={celebrationIntensity[0]}
            enableScreenFlash={enableScreenFlash}
            enableConfetti={enableConfetti}
            enableFireworks={enableFireworks}
            enableScreenShake={enableScreenShake}
          />
        ) : (
          <EnhancedCelebrationSystem
            isVisible={celebration.enhancedVisible}
            type={celebration.currentEvent?.type || 'hourly'}
            hours={celebration.currentEvent?.hours || 1}
            message={celebration.currentEvent?.message || ''}
            onClose={() => {}}
          />
        )}
      </div>
    </AdminHealthCheck>
  );
}