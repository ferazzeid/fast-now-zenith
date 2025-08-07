import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';

interface ProfileOnboardingFlowProps {
  onComplete: () => void;
  onSkip: () => void;
}

export const ProfileOnboardingFlow = ({ onComplete, onSkip }: ProfileOnboardingFlowProps) => {
  const { updateProfile, loading: isUpdating } = useProfile();
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    weight: '',
    weightUnit: '',
    height: '',
    heightUnit: '',
    age: '',
    sex: '',
  });

  const steps = ['Weight', 'Height', 'Age', 'Sex'];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    try {
      // Infer units from user selections
      const isMetric = formData.weightUnit === 'kg' || formData.heightUnit === 'cm';
      const units = isMetric ? 'metric' : 'imperial';

      // Convert height for imperial system
      let heightValue = parseFloat(formData.height);
      if (formData.heightUnit === 'ft') {
        heightValue = heightValue * 12; // Convert feet to inches for storage
      }

      // Convert weight to kg if using pounds or stones
      let weightValue = parseFloat(formData.weight);
      if (formData.weightUnit === 'lbs') {
        weightValue = weightValue * 0.453592; // Convert lbs to kg
      } else if (formData.weightUnit === 'st') {
        weightValue = weightValue * 6.35029; // Convert stones to kg
      }

      await updateProfile({
        units: units as 'metric' | 'imperial',
        weight: weightValue,
        height: heightValue,
        age: parseInt(formData.age),
      });

      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated!",
      });

      onComplete();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 0: return formData.weight !== '' && formData.weightUnit !== '';
      case 1: return formData.height !== '' && formData.heightUnit !== '';
      case 2: return formData.age !== '';
      case 3: return formData.sex !== '';
      default: return false;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="flex justify-center items-center gap-4">
            <Select value={formData.weight} onValueChange={(value) => setFormData({ ...formData, weight: value })}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Weight" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 271 }, (_, i) => (
                  <SelectItem key={30 + i} value={(30 + i).toString()}>
                    {30 + i}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={formData.weightUnit} onValueChange={(value) => setFormData({ ...formData, weightUnit: value })}>
              <SelectTrigger className="w-20">
                <SelectValue placeholder="Unit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="kg">kg</SelectItem>
                <SelectItem value="lbs">lbs</SelectItem>
                <SelectItem value="st">st</SelectItem>
              </SelectContent>
            </Select>
          </div>
        );

      case 1:
        return (
          <div className="flex justify-center items-center gap-4">
            <Select value={formData.height} onValueChange={(value) => setFormData({ ...formData, height: value })}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Height" />
              </SelectTrigger>
              <SelectContent>
                {formData.heightUnit === 'cm' ? (
                  Array.from({ length: 151 }, (_, i) => (
                    <SelectItem key={100 + i} value={(100 + i).toString()}>
                      {100 + i}
                    </SelectItem>
                  ))
                ) : formData.heightUnit === 'ft' ? (
                  Array.from({ length: 7 }, (_, i) => (
                    <SelectItem key={3 + i} value={(3 + i).toString()}>
                      {3 + i}
                    </SelectItem>
                  ))
                ) : (
                  Array.from({ length: 151 }, (_, i) => (
                    <SelectItem key={100 + i} value={(100 + i).toString()}>
                      {100 + i}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            
            <Select value={formData.heightUnit} onValueChange={(value) => setFormData({ ...formData, heightUnit: value })}>
              <SelectTrigger className="w-20">
                <SelectValue placeholder="Unit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cm">cm</SelectItem>
                <SelectItem value="ft">ft</SelectItem>
              </SelectContent>
            </Select>
          </div>
        );

      case 2:
        return (
          <div className="flex justify-center items-center gap-4">
            <Select value={formData.age} onValueChange={(value) => setFormData({ ...formData, age: value })}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Age" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 108 }, (_, i) => (
                  <SelectItem key={13 + i} value={(13 + i).toString()}>
                    {13 + i}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <div className="w-20 text-center text-muted-foreground">
              years
            </div>
          </div>
        );

      case 3:
        return (
          <div className="flex justify-center items-center gap-4">
            <Select value={formData.sex} onValueChange={(value) => setFormData({ ...formData, sex: value })}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Sex" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
              </SelectContent>
            </Select>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      {/* Step content */}
      <div className="min-h-[200px] flex items-center justify-center">
        {renderStepContent()}
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center pt-6">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={currentStep === 0 || isUpdating}
        >
          Back
        </Button>

        <Button
          variant="ghost"
          onClick={onSkip}
          className="text-muted-foreground hover:text-foreground"
          disabled={isUpdating}
        >
          Skip for now
        </Button>

        {currentStep === steps.length - 1 ? (
          <Button
            onClick={handleComplete}
            disabled={!isStepValid() || isUpdating}
          >
            {isUpdating ? 'Completing...' : 'Complete'}
          </Button>
        ) : (
          <Button
            onClick={handleNext}
            disabled={!isStepValid() || isUpdating}
          >
            Next
          </Button>
        )}
      </div>
    </div>
  );
};