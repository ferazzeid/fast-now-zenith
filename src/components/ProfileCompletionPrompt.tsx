import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';

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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Complete Your Profile</DialogTitle>
          <DialogDescription>
            We need some basic information to enable {requiredFor}. This helps us provide accurate calculations.
          </DialogDescription>
        </DialogHeader>
        
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
          
          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Skip for Now
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Saving..." : "Save & Continue"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};