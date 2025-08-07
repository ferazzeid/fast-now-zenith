import React, { useState } from 'react';
import { PageOnboardingModal } from '@/components/PageOnboardingModal';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useProfileQuery } from '@/hooks/useProfileQuery';
import { useToast } from '@/hooks/use-toast';
import { WeightSelector } from '@/components/WeightSelector';
import { HeightSelector } from '@/components/HeightSelector';
import { ModernNumberPicker } from '@/components/ModernNumberPicker';
import { User, Target, Activity } from 'lucide-react';

interface GlobalProfileOnboardingProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalProfileOnboarding = ({ isOpen, onClose }: GlobalProfileOnboardingProps) => {
  const { updateProfile, isUpdating } = useProfileQuery();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    detectedUnits: 'metric' as 'metric' | 'imperial',
    weightKg: 70,
    heightCm: 170,
    age: 30,
    sex: '' as 'male' | 'female' | '',
  });

  const handleComplete = async () => {
    if (!formData.sex) {
      toast({
        title: "Missing Information",
        description: "Please select your biological sex to complete your profile.",
        variant: "destructive",
      });
      return;
    }

    try {
      const profileData = {
        units: formData.detectedUnits,
        weight: formData.weightKg,
        height: formData.heightCm,
        age: formData.age,
        sex: formData.sex,
        onboarding_completed: true,
      };

      await updateProfile(profileData);
      onClose();
    } catch (error) {
      console.error('Profile update error:', error);
    }
  };

  const handleSkip = () => {
    updateProfile({ onboarding_completed: true });
    onClose();
  };

  const isFormValid = formData.sex !== '';

  const content = (
    <div className="space-y-8">
      {/* Weight section */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Target className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Your Weight</h3>
            <p className="text-sm text-muted-foreground">Help us calculate your calorie needs</p>
          </div>
        </div>
        <WeightSelector
          value={formData.weightKg}
          onChange={(kg, detectedUnits) => 
            setFormData({ ...formData, weightKg: kg, detectedUnits })
          }
        />
      </div>

      {/* Height section */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Activity className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Your Height</h3>
            <p className="text-sm text-muted-foreground">For accurate BMR calculations</p>
          </div>
        </div>
        <HeightSelector
          value={formData.heightCm}
          onChange={(cm, detectedUnits) => 
            setFormData({ ...formData, heightCm: cm, detectedUnits })
          }
        />
      </div>

      {/* Age section */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Your Age</h3>
            <p className="text-sm text-muted-foreground">Affects your metabolic rate</p>
          </div>
        </div>
        <ModernNumberPicker
          value={formData.age}
          onChange={(age) => setFormData({ ...formData, age })}
          min={13}
          max={120}
          suffix="years"
          className="max-w-xs"
        />
      </div>

      {/* Sex section */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">Biological Sex</h3>
          <p className="text-sm text-muted-foreground mb-4">
            This helps us calculate accurate calorie requirements based on metabolic differences.
          </p>
        </div>
        <RadioGroup
          value={formData.sex}
          onValueChange={(value: 'male' | 'female') => 
            setFormData({ ...formData, sex: value })
          }
          className="grid grid-cols-2 gap-4"
        >
          <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-muted/50">
            <RadioGroupItem value="male" id="male" />
            <Label htmlFor="male" className="flex-1 cursor-pointer font-medium">
              Male
            </Label>
          </div>
          <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-muted/50">
            <RadioGroupItem value="female" id="female" />
            <Label htmlFor="female" className="flex-1 cursor-pointer font-medium">
              Female
            </Label>
          </div>
        </RadioGroup>
      </div>
    </div>
  );

  return (
    <PageOnboardingModal
      isOpen={isOpen}
      onClose={() => {}} // Prevent closing until completed or skipped
      title="Complete Your Profile"
      subtitle="Help us personalize your experience with accurate calorie calculations"
      heroQuote="Your journey to better health starts with understanding your body"
    >
      {content}
      
      {/* Footer actions */}
      <div className="flex justify-between items-center pt-6 border-t border-border/30">
        <Button variant="ghost" onClick={handleSkip} disabled={isUpdating}>
          Skip for now
        </Button>
        
        <Button 
          onClick={handleComplete} 
          disabled={!isFormValid || isUpdating}
          className="min-w-[120px]"
        >
          {isUpdating ? 'Saving...' : 'Complete Setup'}
        </Button>
      </div>
    </PageOnboardingModal>
  );
};