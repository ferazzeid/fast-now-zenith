import { useState, useEffect } from 'react';
import { UniversalModal } from '@/components/ui/universal-modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EnhancedWeightSelector } from '@/components/EnhancedWeightSelector';
import { EnhancedHeightSelector } from '@/components/EnhancedHeightSelector';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import { useStandardizedLoading } from '@/hooks/useStandardizedLoading';
import { X } from 'lucide-react';

interface ProfileOnboardingFlowProps {
  onComplete: () => void;
  onSkip: () => void;
}

interface FormData {
  weight: string;
  height: string;
  age: string;
  sex: string;
  activityLevel: string;
}

export const ProfileOnboardingFlow = ({ onComplete, onSkip }: ProfileOnboardingFlowProps) => {
  const { profile, updateProfile, loading: isUpdating } = useProfile();
  const { toast } = useToast();
  const { isLoading, execute } = useStandardizedLoading();
  
  // Initialize form data with existing profile values
  const [formData, setFormData] = useState<FormData>({
    weight: profile?.weight ? profile.weight.toString() : '',
    height: profile?.height ? profile.height.toString() : '',
    age: profile?.age ? profile.age.toString() : '',
    sex: profile?.sex || '',
    activityLevel: profile?.activity_level || 'lightly_active',
  });

  // Update form data when profile loads
  useEffect(() => {
    if (profile) {
      setFormData({
        weight: profile.weight ? profile.weight.toString() : '',
        height: profile.height ? profile.height.toString() : '',
        age: profile.age ? profile.age.toString() : '',
        sex: profile.sex || '',
        activityLevel: profile.activity_level || 'lightly_active',
      });
    }
  }, [profile]);

  const [activeModal, setActiveModal] = useState<'weight' | 'height' | 'age' | 'sex' | 'activityLevel' | null>(null);
  const [tempValue, setTempValue] = useState<{weight?: string, height?: string} | string>('');

  const handleComplete = async () => {
    if (!isFormValid()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields to continue.",
        variant: "destructive"
      });
      return;
    }

    await execute(async () => {
      // Detect unit preference from user selections
      let detectedUnits: 'metric' | 'imperial' = 'imperial'; // default
      
      // Check if user's selections suggest metric preference
      if (typeof tempValue === 'object' && tempValue) {
        // If user has weight that suggests kg (30-300 range typically indicates kg)
        const weightVal = tempValue.weight ? parseFloat(tempValue.weight) : parseFloat(formData.weight);
        if (weightVal && weightVal <= 300) {
          detectedUnits = 'metric';
        }
        
        // If user has height that suggests cm (120-250 range indicates cm)
        const heightVal = tempValue.height ? parseInt(tempValue.height) : parseInt(formData.height);
        if (heightVal && heightVal >= 120 && heightVal <= 250) {
          detectedUnits = 'metric';
        }
      } else {
        // Fallback to form data analysis
        const weightVal = parseFloat(formData.weight);
        const heightVal = parseInt(formData.height);
        
        if ((weightVal && weightVal <= 300) || (heightVal && heightVal >= 120 && heightVal <= 250)) {
          detectedUnits = 'metric';
        }
      }

      const { error } = await updateProfile({
        weight: Number(formData.weight),
        height: Number(formData.height),
        age: Number(formData.age),
        sex: formData.sex as 'male' | 'female',
        activity_level: formData.activityLevel,
        onboarding_completed: true,
        units: detectedUnits
      });

      if (error) {
        throw new Error("Failed to save profile information.");
      }
      
      toast({
        title: "Profile Complete",
        description: "Your profile has been set up successfully!"
      });
      onComplete();
    }, {
      onError: (error) => {
        toast({
          title: "Error",
          description: "Failed to save profile information.",
          variant: "destructive"
        });
      }
    });
  };

  const isFormValid = () => {
    return formData.weight && formData.height && 
           formData.age && formData.sex && formData.activityLevel;
  };

  const openModal = (field: 'weight' | 'height' | 'age' | 'sex' | 'activityLevel') => {
    setActiveModal(field);
    if (field === 'weight') {
      setTempValue({ weight: formData.weight });
    } else if (field === 'height') {
      setTempValue({ height: formData.height });
    } else if (field === 'age') {
      setTempValue(formData.age);
    } else if (field === 'sex') {
      setTempValue(formData.sex);
    } else if (field === 'activityLevel') {
      setTempValue(formData.activityLevel);
    }
  };

  const saveModal = () => {
    if (activeModal === 'weight') {
      const weightValue = typeof tempValue === 'object' && tempValue?.weight ? tempValue.weight : '';
      setFormData(prev => ({ ...prev, weight: weightValue }));
    } else if (activeModal === 'height') {
      const heightValue = typeof tempValue === 'object' && tempValue?.height ? tempValue.height : '';
      setFormData(prev => ({ ...prev, height: heightValue }));
    } else if (activeModal === 'age') {
      setFormData(prev => ({ ...prev, age: typeof tempValue === 'string' ? tempValue : '' }));
    } else if (activeModal === 'sex') {
      setFormData(prev => ({ ...prev, sex: typeof tempValue === 'string' ? tempValue : '' }));
    } else if (activeModal === 'activityLevel') {
      setFormData(prev => ({ ...prev, activityLevel: typeof tempValue === 'string' ? tempValue : '' }));
    }
    setActiveModal(null);
  };

  const formatDisplayValue = (field: keyof FormData) => {
    const value = formData[field];
    if (!value) return 'Not set';
    
    switch (field) {
      case 'weight':
        // Always display in user's preferred unit (default kg)
        return `${Number(value).toFixed(1)} kg`;
      case 'height':
        // Always display in user's preferred unit (default cm)
        return `${value} cm`;
      case 'age':
        return `${value} years`;
      case 'sex':
        return value.charAt(0).toUpperCase() + value.slice(1);
      case 'activityLevel':
        const activityLabels = { 
          sedentary: 'Sedentary', 
          lightly_active: 'Lightly Active',
          moderately_active: 'Moderately Active', 
          very_active: 'Very Active' 
        };
        return value ? activityLabels[value as keyof typeof activityLabels] || value : 'Not set';
      default:
        return value;
    }
  };

  const renderModalContent = () => {
    if (!activeModal) return null;

    switch (activeModal) {
      case 'weight':
        return (
          <EnhancedWeightSelector
            value={typeof tempValue === 'object' && tempValue?.weight ? tempValue.weight : ''}
            onChange={(val) => setTempValue(prev => 
              typeof prev === 'object' ? { ...prev, weight: val } : { weight: val }
            )}
            className="space-y-2"
          />
        );

      case 'height':
        return (
          <EnhancedHeightSelector
            value={typeof tempValue === 'object' && tempValue?.height ? tempValue.height : ''}
            onChange={(val) => setTempValue(prev => 
              typeof prev === 'object' ? { ...prev, height: val } : { height: val }
            )}
            className="space-y-2"
          />
        );

      case 'age':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Age</label>
              <Input
                type="number"
                value={typeof tempValue === 'string' ? tempValue : ''}
                onChange={(e) => setTempValue(e.target.value)}
                placeholder="Enter age (13-120)"
                min="13"
                max="120"
              />
            </div>
          </div>
        );

      case 'sex':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Biological Sex</label>
              <Select 
                value={typeof tempValue === 'string' ? tempValue : ''} 
                onValueChange={setTempValue}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select sex" />
                </SelectTrigger>
                <SelectContent className="bg-background border border-subtle shadow-lg z-50">
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'activityLevel':
        const calculateBMR = () => {
          if (!formData.weight || !formData.height || !formData.age || !formData.sex) return 0;
          
          const weightKg = Number(formData.weight);
          const heightCm = Number(formData.height);
          const age = Number(formData.age);
          
          // Mifflin-St Jeor Equation with sex-specific calculation
          let bmr: number;
          if (formData.sex === 'female') {
            bmr = Math.round(10 * weightKg + 6.25 * heightCm - 5 * age - 161);
          } else {
            bmr = Math.round(10 * weightKg + 6.25 * heightCm - 5 * age + 5);
          }
          return bmr;
        };

        const getCalorieAddition = (level: string) => {
          const bmr = calculateBMR();
          if (bmr === 0) return 0;
          
          const activityMultipliers = {
            sedentary: 1.2,
            lightly_active: 1.375,
            moderately_active: 1.55,
            very_active: 1.725
          };
          
          const sedentaryTdee = bmr * 1.2;
          const levelTdee = bmr * (activityMultipliers[level as keyof typeof activityMultipliers] || 1.2);
          
          return Math.round(levelTdee - sedentaryTdee);
        };

        const activityOptions = [
          {
            value: 'sedentary',
            title: 'Sedentary',
            description: 'Office job, minimal walking, mostly sitting',
            example: 'Desk work, driving, watching TV'
          },
          {
            value: 'lightly_active',
            title: 'Lightly Active',
            description: 'Light exercise 1-3 days/week, regular daily activities',
            example: 'Walking to restaurants, casual strolls, light housework'
          },
          {
            value: 'moderately_active',
            title: 'Moderately Active',
            description: 'Moderate exercise 3-5 days/week, active lifestyle',
            example: 'Gym sessions, cycling, hiking, sports'
          },
          {
            value: 'very_active',
            title: 'Very Active',
            description: 'Hard exercise 6-7 days/week, very physically demanding',
            example: 'Athletic training, physical job, daily intense workouts'
          }
        ];

        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Activity Level</label>
              <p className="text-xs text-muted-foreground">
                Choose the option that best describes your typical weekly activity
              </p>
            </div>
            <div className="space-y-3">
              {activityOptions.map((option) => {
                const calorieAddition = getCalorieAddition(option.value);
                const isSelected = tempValue === option.value;
                
                return (
                  <div
                    key={option.value}
                    onClick={() => setTempValue(option.value)}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      isSelected 
                        ? 'border-primary bg-primary/5' 
                        : 'border-subtle hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-sm">
                          {option.title}
                          {calorieAddition > 0 && (
                            <span className="ml-2 text-primary font-semibold">
                              +{calorieAddition} cal/day
                            </span>
                          )}
                          {calorieAddition === 0 && (
                            <span className="ml-2 text-muted-foreground text-xs">
                              Base Rate
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {option.description}
                        </div>
                        <div className="text-xs text-muted-foreground/80 mt-1 italic">
                          Examples: {option.example}
                        </div>
                      </div>
                      {isSelected && (
                        <div className="w-4 h-4 rounded-full bg-primary flex-shrink-0 mt-0.5" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Fields Grid */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => openModal('weight')}
          className="p-4 bg-muted/30 border border-subtle rounded-lg hover:bg-muted/50 hover:border-emphasis transition-all duration-200 text-left"
        >
          <div className="text-sm text-muted-foreground">Weight</div>
          <div className="font-medium">{formatDisplayValue('weight')}</div>
        </button>

        <button
          onClick={() => openModal('height')}
          className="p-4 bg-muted/30 border border-subtle rounded-lg hover:bg-muted/50 hover:border-emphasis transition-all duration-200 text-left"
        >
          <div className="text-sm text-muted-foreground">Height</div>
          <div className="font-medium">{formatDisplayValue('height')}</div>
        </button>

        <button
          onClick={() => openModal('age')}
          className="p-4 bg-muted/30 border border-subtle rounded-lg hover:bg-muted/50 hover:border-emphasis transition-all duration-200 text-left"
        >
          <div className="text-sm text-muted-foreground">Age</div>
          <div className="font-medium">{formatDisplayValue('age')}</div>
        </button>

        <button
          onClick={() => openModal('sex')}
          className="p-4 bg-muted/30 border border-subtle rounded-lg hover:bg-muted/50 hover:border-emphasis transition-all duration-200 text-left"
        >
          <div className="text-sm text-muted-foreground">Sex</div>
          <div className="font-medium">{formatDisplayValue('sex')}</div>
        </button>

        <button
          onClick={() => openModal('activityLevel')}
          className="p-4 bg-muted/30 border border-subtle rounded-lg hover:bg-muted/50 hover:border-emphasis transition-all duration-200 text-left col-span-2"
        >
          <div className="text-sm text-muted-foreground">Activity Level</div>
          <div className="font-medium">{formatDisplayValue('activityLevel')}</div>
        </button>
      </div>

      {/* Navigation */}
      <div className="mt-8">
        <Button 
          onClick={handleComplete}
          variant="action-primary"
          size="action-main"
          className="w-full shadow-lg"
          disabled={isLoading || !isFormValid()}
        >
          {isLoading ? "Saving..." : "Complete Profile"}
        </Button>
        {!isFormValid() && (
          <p className="text-sm text-muted-foreground mt-2 text-center">
            Please fill in all required fields to continue
          </p>
        )}
      </div>

      {/* Modal */}
      <UniversalModal
        isOpen={!!activeModal}
        onClose={() => setActiveModal(null)}
        title={activeModal ? activeModal.charAt(0).toUpperCase() + activeModal.slice(1) : ''}
        size="md"
        footer={
          <>
            <Button 
              variant="outline" 
              size="action-secondary"
              onClick={() => setActiveModal(null)}
              className="flex-1"
            >
              <X className="w-4 h-4" />
            </Button>
            <Button 
              variant="action-primary"
              size="action-secondary"
              onClick={saveModal}
              disabled={
                (typeof tempValue === 'object' && !tempValue?.weight && !tempValue?.height) ||
                (typeof tempValue === 'string' && !tempValue)
              }
              className="flex-1"
            >
              Save
            </Button>
          </>
        }
      >
        {renderModalContent()}
      </UniversalModal>
    </div>
  );
};