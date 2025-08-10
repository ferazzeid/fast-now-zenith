import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { UniversalModal } from '@/components/ui/universal-modal';
import { ImageUpload } from './ImageUpload';
import { useToast } from '@/hooks/use-toast';
import { Save } from 'lucide-react';

interface AdminGoalIdea {
  id: string;
  title: string;
  description: string;
  category: string;
  imageUrl?: string;
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
  const { toast } = useToast();

  useEffect(() => {
    if (goal) {
      setTitle(goal.title || '');
      setDescription(goal.description || '');
      setImageUrl(goal.imageUrl || '');
    }
  }, [goal]);

  const handleSave = () => {
    if (!title.trim()) {
      toast({
        title: "Title required",
        description: "Please add a title for this idea.",
        variant: "destructive",
      });
      return;
    }

    if (!goal) return;

    const updatedGoal: AdminGoalIdea = {
      ...goal,
      title: title.trim(),
      description: description.trim(),
      imageUrl: imageUrl || undefined,
    };

    console.log('AdminGoalEditModal: Saving goal data:', updatedGoal);
    onSave(updatedGoal);
  };

  if (!goal) return null;

  return (
    <UniversalModal
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
            className="w-full bg-ceramic-base border-ceramic-rim"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={!title.trim()}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Changes
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
          />
        </div>

        <div className="space-y-2">
          <Label className="text-warm-text font-medium">Image</Label>
          <ImageUpload
            currentImageUrl={imageUrl}
            onImageUpload={setImageUrl}
            onImageRemove={() => setImageUrl('')}
            showUploadOptionsWhenImageExists={true}
          />
        </div>
      </div>
    </UniversalModal>
  );
};