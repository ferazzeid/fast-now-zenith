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
import { ArrowLeft, ArrowRight } from 'lucide-react';

interface GlobalProfileOnboardingProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalProfileOnboarding = ({ isOpen, onClose }: GlobalProfileOnboardingProps) => {
  const { updateProfile, isUpdating } = useProfileQuery();
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    detectedUnits: 'metric' as 'metric' | 'imperial',
    weightKg: 70,
    heightCm: 170,
    age: 30,
    sex: '' as 'male' | 'female' | '',
  });

  const totalSteps = 4;

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

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

  const isStepValid = () => {
    switch (currentStep) {
      case 1: return formData.weightKg > 0;
      case 2: return formData.heightCm > 0;
      case 3: return formData.age > 0;
      case 4: return !!formData.sex;
      default: return false;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="text-center space-y-8">
            <h2 className="text-2xl font-bold">Weight</h2>
            <WeightSelector
              value={formData.weightKg}
              onChange={(kg, detectedUnits) => 
                setFormData({ ...formData, weightKg: kg, detectedUnits })
              }
            />
          </div>
        );

      case 2:
        return (
          <div className="text-center space-y-8">
            <h2 className="text-2xl font-bold">Height</h2>
            <HeightSelector
              value={formData.heightCm}
              onChange={(cm, detectedUnits) => 
                setFormData({ ...formData, heightCm: cm, detectedUnits })
              }
            />
          </div>
        );

      case 3:
        return (
          <div className="text-center space-y-8">
            <h2 className="text-2xl font-bold">Age</h2>
            <div className="flex justify-center">
              <ModernNumberPicker
                value={formData.age}
                onChange={(age) => setFormData({ ...formData, age })}
                min={13}
                max={120}
                suffix="years"
                className="max-w-xs"
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="text-center space-y-8">
            <h2 className="text-2xl font-bold">Biological Sex</h2>
            <RadioGroup
              value={formData.sex}
              onValueChange={(value: 'male' | 'female') => 
                setFormData({ ...formData, sex: value })
              }
              className="grid grid-cols-2 gap-4 max-w-md mx-auto"
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
        );

      default:
        return null;
    }
  };

  return (
    <PageOnboardingModal
      isOpen={isOpen}
      onClose={() => {}} // Prevent closing until completed or skipped
      title={`Step ${currentStep} of ${totalSteps}`}
    >
      {renderStep()}
      
      {/* Footer actions */}
      <div className="flex justify-between items-center pt-6 border-t border-border/30">
        <div className="flex items-center gap-2">
          {currentStep > 1 ? (
            <Button variant="outline" onClick={handleBack} disabled={isUpdating}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          ) : (
            <Button variant="ghost" onClick={handleSkip} disabled={isUpdating}>
              Skip
            </Button>
          )}
        </div>
        
        <div>
          {currentStep < totalSteps ? (
            <Button 
              onClick={handleNext} 
              disabled={!isStepValid() || isUpdating}
            >
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button 
              onClick={handleComplete} 
              disabled={!isStepValid() || isUpdating}
              className="min-w-[120px]"
            >
              {isUpdating ? 'Saving...' : 'Complete'}
            </Button>
          )}
        </div>
      </div>
    </PageOnboardingModal>
  );
};