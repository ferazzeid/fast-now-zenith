
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { UniversalModal } from '@/components/ui/universal-modal';
import { AdminImageUploadSilent } from './AdminImageUploadSilent';
import { useToast } from '@/hooks/use-toast';
import { useAccess } from '@/hooks/useAccess';
import { Save } from 'lucide-react';

interface AdminGoalIdea {
  id: string;
  title: string;
  description: string;
  category: string;
  imageUrl?: string;
  maleImageUrl?: string;
  femaleImageUrl?: string;
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
  const [maleImageUrl, setMaleImageUrl] = useState('');
  const [femaleImageUrl, setFemaleImageUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [componentKey, setComponentKey] = useState(0);
  const [inlineError, setInlineError] = useState<string>('');
  const [inlineSuccess, setInlineSuccess] = useState<string>('');
  const { toast } = useToast();
  const { isAdmin } = useAccess();

  useEffect(() => {
    if (goal) {
      setTitle(goal.title || '');
      setDescription(goal.description || '');
      setImageUrl(goal.imageUrl || '');
      setMaleImageUrl(goal.maleImageUrl || '');
      setFemaleImageUrl(goal.femaleImageUrl || '');
      setLinkUrl(goal.linkUrl || '');
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
        maleImageUrl: maleImageUrl || undefined,
        femaleImageUrl: femaleImageUrl || undefined,
        linkUrl: linkUrl.trim() || undefined,
      };

      // Saving goal data
      await onSave(updatedGoal);
      
      setInlineSuccess("Changes saved successfully!");
      
      // Clear form state and close modal after a brief delay
      setTimeout(() => {
        setTitle('');
        setDescription('');
        setImageUrl('');
        setMaleImageUrl('');
        setFemaleImageUrl('');
        setLinkUrl('');
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
      size="lg"
      showCloseButton={true}
      contentClassName="max-h-[65vh] overflow-y-auto pb-4"
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
          <Label className="text-warm-text font-medium">General Image (Fallback)</Label>
          <AdminImageUploadSilent
            currentImageUrl={imageUrl}
            onImageUpload={setImageUrl}
            onImageRemove={() => setImageUrl('')}
            onError={(error) => setInlineError(error)}
            onSuccess={(message) => setInlineSuccess(message)}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-warm-text font-medium">Male-Specific Image</Label>
          <AdminImageUploadSilent
            currentImageUrl={maleImageUrl}
            onImageUpload={setMaleImageUrl}
            onImageRemove={() => setMaleImageUrl('')}
            onError={(error) => setInlineError(error)}
            onSuccess={(message) => setInlineSuccess(message)}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-warm-text font-medium">Female-Specific Image</Label>
          <AdminImageUploadSilent
            currentImageUrl={femaleImageUrl}
            onImageUpload={setFemaleImageUrl}
            onImageRemove={() => setFemaleImageUrl('')}
            onError={(error) => setInlineError(error)}
            onSuccess={(message) => setInlineSuccess(message)}
          />
        </div>

        {isAdmin && (
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
        )}

      </div>
    </UniversalModal>
  );
};
