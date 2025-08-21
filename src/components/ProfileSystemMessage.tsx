import { useState } from 'react';
import { ChevronDown, ChevronRight, User, Scale, Ruler, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useProfile } from '@/hooks/useProfile';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface ProfileSystemMessageProps {
  onProfileUpdate?: () => void;
}

export const ProfileSystemMessage = ({ onProfileUpdate }: ProfileSystemMessageProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [age, setAge] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { profile, isProfileComplete, updateProfile } = useProfile();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Don't show if profile is complete - use conditional rendering instead of early return
  if (isProfileComplete()) {
    return null;
  }

  const missingFields = [];
  if (!profile?.weight) missingFields.push({ icon: Scale, label: 'Weight', key: 'weight' });
  if (!profile?.height) missingFields.push({ icon: Ruler, label: 'Height', key: 'height' });
  if (!profile?.age) missingFields.push({ icon: Calendar, label: 'Age', key: 'age' });

  const handleQuickSave = async () => {
    if (!weight && !height && !age) {
      toast({
        title: "Please fill in at least one field",
        description: "Enter your weight, height, or age to continue.",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    try {
      const updates: any = {};
      
      if (weight) {
        const weightNum = parseFloat(weight);
        if (weightNum >= 20 && weightNum <= 500) {
          updates.weight = weightNum;
        }
      }
      
      if (height) {
        const heightNum = parseFloat(height);
        if (heightNum >= 100 && heightNum <= 250) {
          updates.height = heightNum;
        }
      }
      
      if (age) {
        const ageNum = parseInt(age);
        if (ageNum >= 10 && ageNum <= 120) {
          updates.age = ageNum;
        }
      }

      if (Object.keys(updates).length === 0) {
        toast({
          title: "Invalid values",
          description: "Please check your input values are realistic.",
          variant: "destructive"
        });
        return;
      }

      const result = await updateProfile(updates);
      
      if (result.error) {
        throw new Error(result.error.message);
      }

      toast({
        title: "Profile updated",
        description: "Your information has been saved successfully."
      });

      // Clear form
      setWeight('');
      setHeight('');
      setAge('');
      setIsExpanded(false);
      
      // Notify parent
      onProfileUpdate?.();
    } catch (error) {
      toast({
        title: "Error saving profile",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mb-4 p-3 rounded-lg bg-amber-50/80 border border-amber-200/50 dark:bg-amber-900/10 dark:border-amber-800/30">
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-2">
          <User className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <span className="text-sm font-medium text-amber-800 dark:text-amber-200">
            Profile information needed
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-amber-600 dark:text-amber-400">
            {missingFields.length} missing
          </span>
          {isExpanded ? (
            <ChevronDown className="h-3 w-3 text-amber-600 dark:text-amber-400" />
          ) : (
            <ChevronRight className="h-3 w-3 text-amber-600 dark:text-amber-400" />
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="mt-3 space-y-3">
          <p className="text-xs text-amber-700 dark:text-amber-300">
            I need this information to calculate your daily calorie burn and provide accurate recommendations.
          </p>
          
          <div className="grid grid-cols-3 gap-2">
            {!profile?.weight && (
              <div>
                <label className="text-xs text-amber-700 dark:text-amber-300 block mb-1">
                  Weight (kg)
                </label>
                <Input
                  type="number"
                  placeholder="70"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="h-8 text-xs bg-white/50 border-amber-300 dark:bg-amber-900/20 dark:border-amber-600"
                />
              </div>
            )}
            
            {!profile?.height && (
              <div>
                <label className="text-xs text-amber-700 dark:text-amber-300 block mb-1">
                  Height (cm)
                </label>
                <Input
                  type="number"
                  placeholder="175"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className="h-8 text-xs bg-white/50 border-amber-300 dark:bg-amber-900/20 dark:border-amber-600"
                />
              </div>
            )}
            
            {!profile?.age && (
              <div>
                <label className="text-xs text-amber-700 dark:text-amber-300 block mb-1">
                  Age
                </label>
                <Input
                  type="number"
                  placeholder="30"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="h-8 text-xs bg-white/50 border-amber-300 dark:bg-amber-900/20 dark:border-amber-600"
                />
              </div>
            )}
          </div>

          <div className="flex space-x-2">
            <Button 
              size="sm" 
              variant="outline"
              className="h-7 text-xs border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-600 dark:text-amber-300 dark:hover:bg-amber-800/20"
              onClick={() => navigate('/settings')}
            >
              Settings
            </Button>
            <Button 
              size="sm"
              className="h-7 text-xs bg-amber-600 hover:bg-amber-700 text-white dark:bg-amber-500 dark:hover:bg-amber-600"
              onClick={handleQuickSave}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};