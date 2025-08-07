import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';

interface ProfileOnboardingFlowProps {
  onComplete: () => void;
  onSkip: () => void;
}

interface FormData {
  weight: string;
  weightUnit: string;
  height: string;
  heightUnit: string;
  age: string;
  sex: string;
  activityLevel: string;
}

export const ProfileOnboardingFlow = ({ onComplete, onSkip }: ProfileOnboardingFlowProps) => {
  const { updateProfile, loading: isUpdating } = useProfile();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<FormData>({
    weight: '',
    weightUnit: '',
    height: '',
    heightUnit: '',
    age: '',
    sex: '',
    activityLevel: '',
  });

  const [activeModal, setActiveModal] = useState<'weight' | 'height' | 'age' | 'sex' | 'activityLevel' | null>(null);
  const [tempValue, setTempValue] = useState('');
  const [tempUnit, setTempUnit] = useState('');

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

      const profileData = {
        units: units as 'metric' | 'imperial',
        weight: weightValue,
        height: heightValue,
        age: parseInt(formData.age),
        activity_level: formData.activityLevel,
        sex: formData.sex,
      };

      console.log('About to save profile data:', profileData);

      const result = await updateProfile(profileData);

      console.log('Profile update result:', result);

      if (result?.error) {
        console.error('Profile update failed:', result.error);
        throw new Error(result.error.message || 'Failed to update profile');
      }

      if (!result?.data) {
        console.error('No data returned from profile update');
        throw new Error('No data returned from profile update');
      }

      console.log('Profile successfully saved:', result.data);

      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated!",
      });

      // Wait a moment to ensure the data is saved before completing
      setTimeout(() => {
        onComplete();
      }, 500);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: `Failed to update profile: ${error instanceof Error ? error.message : 'Please try again.'}`,
        variant: "destructive",
      });
    }
  };

  const isFormValid = () => {
    return formData.weight && formData.weightUnit && 
           formData.height && formData.heightUnit && 
           formData.age && formData.sex && formData.activityLevel;
  };

  const openModal = (field: 'weight' | 'height' | 'age' | 'sex' | 'activityLevel') => {
    setActiveModal(field);
    if (field === 'weight') {
      setTempValue(formData.weight);
      setTempUnit(formData.weightUnit);
    } else if (field === 'height') {
      setTempValue(formData.height);
      setTempUnit(formData.heightUnit);
    } else if (field === 'age') {
      setTempValue(formData.age);
      setTempUnit('');
    } else if (field === 'sex') {
      setTempValue(formData.sex);
      setTempUnit('');
    } else if (field === 'activityLevel') {
      setTempValue(formData.activityLevel);
      setTempUnit('');
    }
  };

  const saveModal = () => {
    if (activeModal === 'weight') {
      setFormData(prev => ({ ...prev, weight: tempValue, weightUnit: tempUnit }));
    } else if (activeModal === 'height') {
      setFormData(prev => ({ ...prev, height: tempValue, heightUnit: tempUnit }));
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
        return `${value} ${formData.weightUnit}`;
      case 'height':
        return `${value} ${formData.heightUnit}`;
      case 'age':
        return `${value} years`;
      case 'sex':
        return value.charAt(0).toUpperCase() + value.slice(1);
      case 'activityLevel':
        return value ? value.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Not set';
      default:
        return value;
    }
  };

  const renderModalContent = () => {
    if (!activeModal) return null;

    switch (activeModal) {
      case 'weight':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Weight</label>
              <Input
                type="number"
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
                placeholder="Enter weight"
                min="30"
                max="300"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Unit</label>
              <Select value={tempUnit} onValueChange={setTempUnit}>
                <SelectTrigger>
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent className="bg-background border z-50">
                  <SelectItem value="kg">kg</SelectItem>
                  <SelectItem value="lbs">lbs</SelectItem>
                  <SelectItem value="st">st</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Or select from list</label>
              <Select value={tempValue} onValueChange={setTempValue}>
                <SelectTrigger>
                  <SelectValue placeholder="Select weight" />
                </SelectTrigger>
                <SelectContent className="bg-background border z-50 max-h-60">
                  {Array.from({ length: 271 }, (_, i) => (
                    <SelectItem key={30 + i} value={(30 + i).toString()}>
                      {30 + i}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'height':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Height</label>
              <Input
                type="number"
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
                placeholder="Enter height"
                min="100"
                max="250"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Unit</label>
              <Select value={tempUnit} onValueChange={setTempUnit}>
                <SelectTrigger>
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent className="bg-background border z-50">
                  <SelectItem value="cm">cm</SelectItem>
                  <SelectItem value="ft">ft</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Or select from list</label>
              <Select value={tempValue} onValueChange={setTempValue}>
                <SelectTrigger>
                  <SelectValue placeholder="Select height" />
                </SelectTrigger>
                <SelectContent className="bg-background border z-50 max-h-60">
                  {tempUnit === 'cm' ? (
                    Array.from({ length: 151 }, (_, i) => (
                      <SelectItem key={100 + i} value={(100 + i).toString()}>
                        {100 + i}
                      </SelectItem>
                    ))
                  ) : tempUnit === 'ft' ? (
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
            </div>
          </div>
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
                placeholder="Enter age"
                min="13"
                max="120"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Or select from list</label>
              <Select value={tempValue} onValueChange={setTempValue}>
                <SelectTrigger>
                  <SelectValue placeholder="Select age" />
                </SelectTrigger>
                <SelectContent className="bg-background border z-50 max-h-60">
                  {Array.from({ length: 108 }, (_, i) => (
                    <SelectItem key={13 + i} value={(13 + i).toString()}>
                      {13 + i}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                  <SelectItem value="sedentary">Sedentary</SelectItem>
                  <SelectItem value="lightly-active">Lightly Active</SelectItem>
                  <SelectItem value="moderately-active">Moderately Active</SelectItem>
                  <SelectItem value="very-active">Very Active</SelectItem>
                  <SelectItem value="extra-active">Extra Active</SelectItem>
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
      <div className="flex justify-between items-center pt-6">
        <Button
          variant="ghost"
          onClick={onSkip}
          className="text-muted-foreground hover:text-foreground"
          disabled={isUpdating}
        >
          Skip for now
        </Button>

        <Button
          onClick={handleComplete}
          disabled={!isFormValid() || isUpdating}
        >
          {isUpdating ? 'Completing...' : 'Complete Profile'}
        </Button>
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
              disabled={!tempValue || (activeModal !== 'sex' && activeModal !== 'age' && activeModal !== 'activityLevel' && !tempUnit)}
            >
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};