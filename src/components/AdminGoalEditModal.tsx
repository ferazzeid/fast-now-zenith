
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { UniversalModal } from '@/components/ui/universal-modal';
import { AdminImageUploadSilent } from './AdminImageUploadSilent';
import { useToast } from '@/hooks/use-toast';
import { Save } from 'lucide-react';

interface AdminGoalIdea {
  id: string;
  title: string;
  description: string;
  category: string;
  imageUrl?: string;
  gender?: 'male' | 'female';
  linkUrl?: string;
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
  const [linkUrl, setLinkUrl] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [componentKey, setComponentKey] = useState(0);
  const [inlineError, setInlineError] = useState<string>('');
  const [inlineSuccess, setInlineSuccess] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    if (goal) {
      console.log('📝 Loading goal data into form:', goal);
      setTitle(goal.title || '');
      setDescription(goal.description || '');
      setImageUrl(goal.imageUrl || '');
      setLinkUrl(goal.linkUrl || '');
      setGender(goal.gender || 'male');
      setIsSubmitting(false);
      setInlineError('');
      setInlineSuccess('');
      setComponentKey(prev => prev + 1);
    }
  }, [goal]);

  const handleSave = async () => {
    if (!title.trim()) {
      setInlineError("Title is required");
      return;
    }

    if (!goal) return;

    setIsSubmitting(true);
    setInlineError('');
    setInlineSuccess('');
    
    try {
      const updatedGoal: AdminGoalIdea = {
        ...goal,
        title: title.trim(),
        description: description.trim(),
        imageUrl: imageUrl || undefined,
        linkUrl: linkUrl.trim() || undefined,
        gender: gender,
      };

      console.log('💾 Saving goal data:', updatedGoal);
      await onSave(updatedGoal);
      
      setInlineSuccess("Changes saved successfully!");
      
      // Clear form state and close modal after a brief delay
      setTimeout(() => {
        setTitle('');
        setDescription('');
        setImageUrl('');
        setLinkUrl('');
        setGender('male');
        setIsSubmitting(false);
        setInlineError('');
        setInlineSuccess('');
        onClose();
      }, 1000);
    } catch (error) {
      console.error('❌ Error saving goal:', error);
      setInlineError("Failed to save changes. Please try again.");
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
      {/* Mark this modal as editing to suppress toasts */}
      <div data-modal-editing="true" className="space-y-4">
        {/* Inline Status Messages */}
        {inlineError && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            {inlineError}
          </div>
        )}
        {inlineSuccess && (
          <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-600 text-sm">
            {inlineSuccess}
          </div>
        )}

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
          <Label htmlFor="goal-link" className="text-warm-text font-medium">
            Read More Link
          </Label>
          <Input
            id="goal-link"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            className="bg-ceramic-base border-ceramic-rim"
            placeholder="https://website.com/detailed-story..."
            disabled={isSubmitting}
            type="url"
          />
          <p className="text-xs text-muted-foreground">
            Optional URL to a detailed story or description on your website
          </p>
        </div>

        <div className="space-y-2">
          <Label className="text-warm-text font-medium">Image</Label>
          <AdminImageUploadSilent
            currentImageUrl={imageUrl}
            onImageUpload={setImageUrl}
            onImageRemove={() => setImageUrl('')}
            onError={(error) => setInlineError(error)}
            onSuccess={(message) => setInlineSuccess(message)}
          />
        </div>
      </div>
    </UniversalModal>
  );
};
