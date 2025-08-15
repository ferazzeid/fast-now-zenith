
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { UniversalModal } from '@/components/ui/universal-modal';
import { AdminImageUpload } from './AdminImageUpload';
import { useToast } from '@/hooks/use-toast';
import { Save } from 'lucide-react';

interface AdminGoalIdea {
  id: string;
  title: string;
  description: string;
  category: string;
  imageUrl?: string;
  gender?: 'male' | 'female';
}

interface AdminGoalEditModalProps {
  goal: AdminGoalIdea | null;
  onSave: (goal: AdminGoalIdea) => void;
  onClose: () => void;
}

export const AdminGoalEditModal = ({ goal, onSave, onClose }: AdminGoalEditModalProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [componentKey, setComponentKey] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    if (goal) {
      console.log('📝 Loading goal data into form:', goal);
      setTitle(goal.title || '');
      setDescription(goal.description || '');
      setImageUrl(goal.imageUrl || '');
      setGender(goal.gender || 'male');
      setIsSubmitting(false);
      setComponentKey(prev => prev + 1);
    }
  }, [goal]);

  const handleSave = async () => {
    if (!title.trim()) {
      toast({
        title: "Title required",
        description: "Please add a title for this idea.",
        variant: "destructive",
      });
      return;
    }

    if (!goal) return;

    setIsSubmitting(true);
    
    try {
      const updatedGoal: AdminGoalIdea = {
        ...goal,
        title: title.trim(),
        description: description.trim(),
        imageUrl: imageUrl || undefined,
        gender: gender,
      };

      console.log('💾 Saving goal data:', updatedGoal);
      await onSave(updatedGoal);
      
      // Clear form state and close modal
      setTitle('');
      setDescription('');
      setImageUrl('');
      setGender('male');
      setIsSubmitting(false);
      onClose();
    } catch (error) {
      console.error('❌ Error saving goal:', error);
      toast({
        title: "Error",
        description: "Failed to save changes",
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  };

  if (!goal) return null;

  return (
    <UniversalModal
      key={componentKey}
      isOpen={true}
      onClose={onClose}
      title="Edit Motivator Idea"
      variant="standard"
      size="sm"
      showCloseButton={true}
      footer={
        <>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-full bg-ceramic-base border-ceramic-rim"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!title.trim() || isSubmitting}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {isSubmitting ? (
              <>
                <Save className="w-4 h-4 mr-2 animate-pulse" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="goal-title" className="text-warm-text font-medium">
            Title *
          </Label>
          <Input
            id="goal-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="bg-ceramic-base border-ceramic-rim"
            placeholder="Enter the motivator title..."
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="goal-description" className="text-warm-text font-medium">
            Description
          </Label>
          <Textarea
            id="goal-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="bg-ceramic-base border-ceramic-rim min-h-[80px]"
            placeholder="Enter the motivator description..."
            disabled={isSubmitting}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-warm-text font-medium">Gender</Label>
          <RadioGroup value={gender} onValueChange={(value: 'male' | 'female') => setGender(value)}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="male" id="male" />
              <Label htmlFor="male" className="text-warm-text">Male 🔵</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="female" id="female" />
              <Label htmlFor="female" className="text-warm-text">Female 🔴</Label>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-2">
          <Label className="text-warm-text font-medium">Image</Label>
          <AdminImageUpload
            currentImageUrl={imageUrl}
            onImageUpload={setImageUrl}
            onImageRemove={() => setImageUrl('')}
          />
        </div>
      </div>
    </UniversalModal>
  );
};
