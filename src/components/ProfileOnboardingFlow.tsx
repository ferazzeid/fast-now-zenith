import React, { useState } from 'react';
import { ArrowRight, ArrowLeft, User, Scale, Ruler, Calendar, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PickerWheel } from '@/components/PickerWheel';
import { SegmentedControl } from '@/components/SegmentedControl';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ProfileOnboardingFlowProps {
  onComplete: () => void;
  onSkip: () => void;
}

export const ProfileOnboardingFlow = ({ onComplete, onSkip }: ProfileOnboardingFlowProps) => {
  const { updateProfile, loading: isUpdating } = useProfile();
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    units: 'imperial' as 'metric' | 'imperial',
    weight: 150,
    height: 68, // inches or cm
    age: 30,
    sex: '' as 'male' | 'female' | '',
  });

  const steps = [
    { icon: Scale, title: "Units", description: "Choose your preferred measurement system" },
    { icon: Scale, title: "Weight", description: "Select your current weight" },
    { icon: Ruler, title: "Height", description: "Tell us how tall you are" },
    { icon: Calendar, title: "Age", description: "What's your age?" },
    { icon: Users, title: "Sex", description: "This helps calculate accurate calorie needs" }
  ];

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
    if (!formData.sex) {
      toast({
        title: "Missing Information",
        description: "Please select your biological sex.",
        variant: "destructive",
      });
      return;
    }

    let profileData: any = {
      units: formData.units,
      age: formData.age,
      sex: formData.sex,
    };

    if (formData.units === 'imperial') {
      // Convert to metric for storage
      profileData.weight = formData.weight * 0.453592; // lbs to kg
      profileData.height = formData.height * 2.54; // inches to cm
    } else {
      profileData.weight = formData.weight;
      profileData.height = formData.height;
    }

    await updateProfile(profileData);
    
    toast({
      title: "Profile Complete!",
      description: "Your profile has been set up successfully.",
    });
    
    onComplete();
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 0: return !!formData.units;
      case 1: return !!formData.weight;
      case 2: return !!formData.height;
      case 3: return !!formData.age;
      case 4: return !!formData.sex;
      default: return false;
    }
  };

  const renderStepContent = () => {
    const step = steps[currentStep];

    switch (currentStep) {
      case 0: // Units
        return (
          <div className="text-center space-y-8">
            <div className="space-y-3">
              <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                <step.icon className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-warm-text">{step.title}</h2>
              <p className="text-warm-text/70 max-w-md mx-auto">{step.description}</p>
            </div>
            
            <SegmentedControl
              options={[
                { value: 'imperial', label: 'Imperial (lbs, ft)' },
                { value: 'metric', label: 'Metric (kg, cm)' }
              ]}
              value={formData.units}
              onChange={(value: string) => {
                const newUnits = value as 'metric' | 'imperial';
                setFormData(prev => ({
                  ...prev,
                  units: newUnits,
                  weight: newUnits === 'metric' ? 68 : 150,
                  height: newUnits === 'metric' ? 173 : 68
                }));
              }}
              className="mx-auto"
            />
          </div>
        );

      case 1: // Weight
        return (
          <div className="text-center space-y-8">
            <div className="space-y-3">
              <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                <step.icon className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-warm-text">{step.title}</h2>
              <p className="text-warm-text/70">{step.description}</p>
            </div>

            <div className="space-y-6">
              <PickerWheel
                value={formData.weight}
                onChange={(value) => setFormData(prev => ({ ...prev, weight: value }))}
                min={formData.units === 'metric' ? 30 : 70}
                max={formData.units === 'metric' ? 200 : 400}
                step={formData.units === 'metric' ? 1 : 1}
                suffix={formData.units === 'metric' ? 'kg' : 'lbs'}
              />
              
              <SegmentedControl
                options={formData.units === 'metric' 
                  ? [{ value: 'metric', label: 'kg' }]
                  : [
                      { value: 'imperial', label: 'lbs' },
                      { value: 'stone', label: 'st' }
                    ]
                }
                value={formData.units}
                onChange={() => {}} // Read-only for this step
                className="mx-auto opacity-50"
              />
            </div>
          </div>
        );

      case 2: // Height
        return (
          <div className="text-center space-y-8">
            <div className="space-y-3">
              <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                <step.icon className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-warm-text">{step.title}</h2>
              <p className="text-warm-text/70">{step.description}</p>
            </div>

            <div className="space-y-6">
              {formData.units === 'imperial' ? (
                <div className="flex justify-center space-x-8">
                  <div className="text-center">
                    <p className="text-sm text-warm-text/60 mb-2">Feet</p>
                    <PickerWheel
                      value={Math.floor(formData.height / 12)}
                      onChange={(feet) => {
                        const inches = formData.height % 12;
                        setFormData(prev => ({ ...prev, height: feet * 12 + inches }));
                      }}
                      min={3}
                      max={8}
                      step={1}
                      suffix="'"
                      className="w-20"
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-warm-text/60 mb-2">Inches</p>
                    <PickerWheel
                      value={formData.height % 12}
                      onChange={(inches) => {
                        const feet = Math.floor(formData.height / 12);
                        setFormData(prev => ({ ...prev, height: feet * 12 + inches }));
                      }}
                      min={0}
                      max={11}
                      step={1}
                      suffix='"'
                      className="w-20"
                    />
                  </div>
                </div>
              ) : (
                <PickerWheel
                  value={formData.height}
                  onChange={(value) => setFormData(prev => ({ ...prev, height: value }))}
                  min={120}
                  max={220}
                  step={1}
                  suffix="cm"
                />
              )}
              
              <SegmentedControl
                options={[
                  { value: formData.units === 'metric' ? 'metric' : 'imperial', 
                    label: formData.units === 'metric' ? 'cm' : 'ft & in' }
                ]}
                value={formData.units}
                onChange={() => {}} // Read-only
                className="mx-auto opacity-50"
              />
            </div>
          </div>
        );

      case 3: // Age
        return (
          <div className="text-center space-y-8">
            <div className="space-y-3">
              <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                <step.icon className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-warm-text">{step.title}</h2>
              <p className="text-warm-text/70">{step.description}</p>
            </div>

            <div className="space-y-6">
              <PickerWheel
                value={formData.age}
                onChange={(value) => setFormData(prev => ({ ...prev, age: value }))}
                min={13}
                max={120}
                step={1}
                suffix=" years"
              />
            </div>
          </div>
        );

      case 4: // Sex
        return (
          <div className="text-center space-y-8">
            <div className="space-y-3">
              <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                <step.icon className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-warm-text">{step.title}</h2>
              <p className="text-warm-text/70">{step.description}</p>
            </div>

            <div className="space-y-4 max-w-xs mx-auto">
              <button
                onClick={() => setFormData(prev => ({ ...prev, sex: 'male' }))}
                className={cn(
                  "w-full p-4 rounded-xl border-2 transition-all text-left",
                  formData.sex === 'male'
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-primary/50"
                )}
              >
                <div className="font-medium">Male</div>
                <div className="text-sm opacity-70">Biological male</div>
              </button>
              
              <button
                onClick={() => setFormData(prev => ({ ...prev, sex: 'female' }))}
                className={cn(
                  "w-full p-4 rounded-xl border-2 transition-all text-left",
                  formData.sex === 'female'
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:border-primary/50"
                )}
              >
                <div className="font-medium">Female</div>
                <div className="text-sm opacity-70">Biological female</div>
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      {/* Progress dots */}
      <div className="flex justify-center space-x-2">
        {steps.map((_, index) => (
          <div
            key={index}
            className={cn(
              "w-2 h-2 rounded-full transition-all",
              index === currentStep ? "bg-primary w-6" : "bg-muted-foreground/30"
            )}
          />
        ))}
      </div>

      {/* Content */}
      <div className="min-h-[400px] flex items-center">
        {renderStepContent()}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {currentStep > 0 ? (
            <Button variant="outline" onClick={handleBack} disabled={isUpdating}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          ) : (
            <Button variant="ghost" onClick={onSkip} disabled={isUpdating}>
              Skip for now
            </Button>
          )}
        </div>
        
        <div className="text-xs text-warm-text/50">
          {currentStep + 1} of {steps.length}
        </div>
        
        <div>
          {currentStep < steps.length - 1 ? (
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
              {isUpdating ? 'Completing...' : 'Complete'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};