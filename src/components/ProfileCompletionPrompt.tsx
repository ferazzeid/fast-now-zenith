import { useState } from 'react';
import { UniversalModal } from '@/components/ui/universal-modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import { X } from 'lucide-react';

interface ProfileCompletionPromptProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
  requiredFor?: string;
}

export const ProfileCompletionPrompt = ({ 
  isOpen, 
  onClose, 
  onComplete, 
  requiredFor = "this feature" 
}: ProfileCompletionPromptProps) => {
  const { profile, updateProfile, loading } = useProfile();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    weight: profile?.weight || '',
    height: profile?.height || '',
    age: profile?.age || ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.weight || !formData.height || !formData.age) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields to continue.",
        variant: "destructive"
      });
      return;
    }

    const { error } = await updateProfile({
      weight: Number(formData.weight),
      height: Number(formData.height),
      age: Number(formData.age)
    });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to save profile information.",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Profile Updated",
        description: "Your profile information has been saved."
      });
      onComplete();
    }
  };

  return (
    <UniversalModal
      isOpen={isOpen}
      onClose={onClose}
      title="Complete Your Profile"
      description={`We need some basic information to enable ${requiredFor}. This helps us provide accurate calculations.`}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="weight">Weight (lbs)</Label>
          <Input
            id="weight"
            type="number"
            value={formData.weight}
            onChange={(e) => handleInputChange('weight', e.target.value)}
            placeholder="Enter your weight"
            min="50"
            max="500"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="height">Height (inches)</Label>
          <Input
            id="height"
            type="number"
            value={formData.height}
            onChange={(e) => handleInputChange('height', e.target.value)}
            placeholder="Enter your height"
            min="36"
            max="96"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="age">Age (years)</Label>
          <Input
            id="age"
            type="number"
            value={formData.age}
            onChange={(e) => handleInputChange('age', e.target.value)}
            placeholder="Enter your age"
            min="13"
            max="120"
          />
        </div>
        
        <div className="flex gap-3 pt-4">
          <Button 
            type="button" 
            variant="ghost" 
            size="action-secondary"
            onClick={onClose} 
            className="w-12"
          >
            <X className="w-4 h-4" />
          </Button>
          <Button 
            type="submit" 
            variant="action-primary"
            size="action-main"
            disabled={loading} 
            className="flex-1 shadow-lg"
          >
            {loading ? "Saving..." : "Save"}
          </Button>
        </div>
      </form>
    </UniversalModal>
  );
};