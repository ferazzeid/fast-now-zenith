import React, { useState } from 'react';
import { UniversalModal } from '@/components/ui/universal-modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import { useProfileQuery } from '@/hooks/useProfileQuery';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react';

interface GlobalProfileOnboardingProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalProfileOnboarding = ({ isOpen, onClose }: GlobalProfileOnboardingProps) => {
  const { updateProfile, isUpdating } = useProfileQuery();
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    units: 'imperial' as 'metric' | 'imperial',
    weight: '',
    height: '',
    age: '',
    sex: '' as 'male' | 'female' | '',
  });

  const totalSteps = 6;
  const progress = (currentStep / totalSteps) * 100;

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
    if (!formData.weight || !formData.height || !formData.age || !formData.sex) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    let profileData: any = {
      units: formData.units,
      age: parseInt(formData.age),
      sex: formData.sex,
      onboarding_completed: true,
    };

    if (formData.units === 'imperial') {
      // Convert to metric for storage
      profileData.weight = parseFloat(formData.weight) * 0.453592; // lbs to kg
      profileData.height = parseFloat(formData.height) * 2.54; // inches to cm
    } else {
      profileData.weight = parseFloat(formData.weight);
      profileData.height = parseFloat(formData.height);
    }

    updateProfile(profileData);
    
    toast({
      title: "Profile Complete!",
      description: "Your profile has been set up successfully.",
    });
    
    onClose();
  };

  const handleSkip = () => {
    updateProfile({ onboarding_completed: true });
    onClose();
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1: return true; // Welcome
      case 2: return !!formData.units; // Units
      case 3: return !!formData.weight; // Weight
      case 4: return !!formData.height; // Height
      case 5: return !!formData.age; // Age
      case 6: return !!formData.sex; // Sex
      default: return false;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="text-center space-y-4">
            <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">Complete Your Profile</h2>
            <p className="text-muted-foreground">
              Help us personalize your experience by providing some basic information about yourself. 
              This will enable accurate calorie calculations and better recommendations.
            </p>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Choose Your Units</h2>
            <RadioGroup
              value={formData.units}
              onValueChange={(value: 'metric' | 'imperial') => 
                setFormData({ ...formData, units: value })
              }
              className="space-y-3"
            >
              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                <RadioGroupItem value="imperial" id="imperial" />
                <Label htmlFor="imperial" className="flex-1 cursor-pointer">
                  <div className="font-medium">Imperial</div>
                  <div className="text-sm text-muted-foreground">Pounds, feet & inches</div>
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                <RadioGroupItem value="metric" id="metric" />
                <Label htmlFor="metric" className="flex-1 cursor-pointer">
                  <div className="font-medium">Metric</div>
                  <div className="text-sm text-muted-foreground">Kilograms & centimeters</div>
                </Label>
              </div>
            </RadioGroup>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">What's Your Weight?</h2>
            <div className="space-y-2">
              <Label htmlFor="weight">
                Weight ({formData.units === 'imperial' ? 'lbs' : 'kg'})
              </Label>
              <Input
                id="weight"
                type="number"
                placeholder={formData.units === 'imperial' ? '150' : '68'}
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">What's Your Height?</h2>
            <div className="space-y-2">
              <Label htmlFor="height">
                Height ({formData.units === 'imperial' ? 'inches' : 'cm'})
              </Label>
              <Input
                id="height"
                type="number"
                placeholder={formData.units === 'imperial' ? '68' : '173'}
                value={formData.height}
                onChange={(e) => setFormData({ ...formData, height: e.target.value })}
              />
              {formData.units === 'imperial' && (
                <p className="text-xs text-muted-foreground">
                  Tip: 5'8" = 68 inches
                </p>
              )}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">What's Your Age?</h2>
            <div className="space-y-2">
              <Label htmlFor="age">Age (years)</Label>
              <Input
                id="age"
                type="number"
                placeholder="30"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
              />
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Biological Sex</h2>
            <p className="text-sm text-muted-foreground">
              This helps us calculate accurate calorie requirements based on metabolic differences.
            </p>
            <RadioGroup
              value={formData.sex}
              onValueChange={(value: 'male' | 'female') => 
                setFormData({ ...formData, sex: value })
              }
              className="space-y-3"
            >
              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                <RadioGroupItem value="male" id="male" />
                <Label htmlFor="male" className="flex-1 cursor-pointer">
                  Male
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                <RadioGroupItem value="female" id="female" />
                <Label htmlFor="female" className="flex-1 cursor-pointer">
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

  const footer = (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-2">
        {currentStep > 1 && (
          <Button variant="outline" onClick={handleBack} disabled={isUpdating}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        )}
        {currentStep === 1 && (
          <Button variant="ghost" onClick={handleSkip} disabled={isUpdating}>
            Skip for now
          </Button>
        )}
      </div>
      
      <div className="text-xs text-muted-foreground">
        Step {currentStep} of {totalSteps}
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
          >
            {isUpdating ? 'Completing...' : 'Complete Profile'}
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <UniversalModal
      isOpen={isOpen}
      onClose={() => {}} // Prevent closing until completed or skipped
      title=""
      showCloseButton={false}
      closeOnOverlay={false}
      size="md"
      footer={footer}
    >
      <div className="space-y-6">
        <Progress value={progress} className="w-full h-2" />
        {renderStep()}
      </div>
    </UniversalModal>
  );
};