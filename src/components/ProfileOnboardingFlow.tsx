import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EnhancedWeightSelector } from '@/components/EnhancedWeightSelector';
import { EnhancedHeightSelector } from '@/components/EnhancedHeightSelector';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';

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
  
  // Initialize form data with existing profile values
  const [formData, setFormData] = useState<FormData>({
    weight: profile?.weight ? profile.weight.toString() : '',
    height: profile?.height ? profile.height.toString() : '',
    age: profile?.age ? profile.age.toString() : '',
    sex: profile?.sex || '',
    activityLevel: profile?.activity_level || '',
  });

  // Update form data when profile loads
  useEffect(() => {
    if (profile) {
      setFormData({
        weight: profile.weight ? profile.weight.toString() : '',
        height: profile.height ? profile.height.toString() : '',
        age: profile.age ? profile.age.toString() : '',
        sex: profile.sex || '',
        activityLevel: profile.activity_level || '',
      });
    }
  }, [profile]);

  const [activeModal, setActiveModal] = useState<'weight' | 'height' | 'age' | 'sex' | 'activityLevel' | null>(null);
  const [tempValue, setTempValue] = useState('');
  

  const [isLoading, setIsLoading] = useState(false);

  const handleComplete = async () => {
    if (!isFormValid()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields to continue.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);
      
      const { error } = await updateProfile({
        weight: Number(formData.weight),
        height: Number(formData.height),
        age: Number(formData.age),
        sex: formData.sex as 'male' | 'female',
        activity_level: formData.activityLevel,
        onboarding_completed: true
      });

      if (error) {
        toast({
          title: "Error",
          description: "Failed to save profile information.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Profile Complete",
          description: "Your profile has been set up successfully!"
        });
        onComplete();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = () => {
    return formData.weight && formData.height && 
           formData.age && formData.sex && formData.activityLevel;
  };

  const openModal = (field: 'weight' | 'height' | 'age' | 'sex' | 'activityLevel') => {
    setActiveModal(field);
    if (field === 'weight') {
      setTempValue(formData.weight);
    } else if (field === 'height') {
      setTempValue(formData.height);
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
      setFormData(prev => ({ ...prev, weight: tempValue }));
    } else if (activeModal === 'height') {
      setFormData(prev => ({ ...prev, height: tempValue }));
    } else if (activeModal === 'age') {
      setFormData(prev => ({ ...prev, age: tempValue }));
    } else if (activeModal === 'sex') {
      setFormData(prev => ({ ...prev, sex: tempValue }));
    } else if (activeModal === 'activityLevel') {
      setFormData(prev => ({ ...prev, activityLevel: tempValue }));
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
        const activityLabels = { sedentary: 'Low', moderately_active: 'Medium', very_active: 'High' };
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
            value={tempValue}
            onChange={setTempValue}
            className="space-y-2"
          />
        );

      case 'height':
        return (
          <EnhancedHeightSelector
            value={tempValue}
            onChange={setTempValue}
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
                value={tempValue}
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
              <Select value={tempValue} onValueChange={setTempValue}>
                <SelectTrigger>
                  <SelectValue placeholder="Select sex" />
                </SelectTrigger>
                <SelectContent className="bg-background border z-50">
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'activityLevel':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Activity Level</label>
              <Select value={tempValue} onValueChange={setTempValue}>
                <SelectTrigger>
                  <SelectValue placeholder="Select activity level" />
                </SelectTrigger>
                <SelectContent className="bg-background border z-50">
                  <SelectItem value="sedentary">Low</SelectItem>
                  <SelectItem value="moderately_active">Medium</SelectItem>
                  <SelectItem value="very_active">High</SelectItem>
                </SelectContent>
              </Select>
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
          className="p-4 border rounded-lg hover:bg-muted/50 transition-colors text-left"
        >
          <div className="text-sm text-muted-foreground">Weight</div>
          <div className="font-medium">{formatDisplayValue('weight')}</div>
        </button>

        <button
          onClick={() => openModal('height')}
          className="p-4 border rounded-lg hover:bg-muted/50 transition-colors text-left"
        >
          <div className="text-sm text-muted-foreground">Height</div>
          <div className="font-medium">{formatDisplayValue('height')}</div>
        </button>

        <button
          onClick={() => openModal('age')}
          className="p-4 border rounded-lg hover:bg-muted/50 transition-colors text-left"
        >
          <div className="text-sm text-muted-foreground">Age</div>
          <div className="font-medium">{formatDisplayValue('age')}</div>
        </button>

        <button
          onClick={() => openModal('sex')}
          className="p-4 border rounded-lg hover:bg-muted/50 transition-colors text-left"
        >
          <div className="text-sm text-muted-foreground">Sex</div>
          <div className="font-medium">{formatDisplayValue('sex')}</div>
        </button>

        <button
          onClick={() => openModal('activityLevel')}
          className="p-4 border rounded-lg hover:bg-muted/50 transition-colors text-left col-span-2"
        >
          <div className="text-sm text-muted-foreground">Activity Level</div>
          <div className="font-medium">{formatDisplayValue('activityLevel')}</div>
        </button>
      </div>

      {/* Navigation */}
      <div className="mt-8">
        <Button 
          onClick={handleComplete}
          className="w-full"
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
      <Dialog open={!!activeModal} onOpenChange={() => setActiveModal(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {activeModal && activeModal.charAt(0).toUpperCase() + activeModal.slice(1)}
            </DialogTitle>
          </DialogHeader>
          {renderModalContent()}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setActiveModal(null)}>
              Cancel
            </Button>
            <Button 
              onClick={saveModal}
              disabled={!tempValue}
            >
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};