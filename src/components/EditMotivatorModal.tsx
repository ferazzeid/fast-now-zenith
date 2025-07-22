import { useState } from 'react';
import { X, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ImageUpload } from './ImageUpload';

interface Motivator {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  createdAt: Date;
}

interface EditMotivatorModalProps {
  motivator: Motivator;
  onSave: (motivator: Motivator) => void;
  onClose: () => void;
}

export const EditMotivatorModal = ({ motivator, onSave, onClose }: EditMotivatorModalProps) => {
  const [title, setTitle] = useState(motivator.title);
  const [description, setDescription] = useState(motivator.description || '');
  const [imageUrl, setImageUrl] = useState(motivator.imageUrl || '');

  const handleSave = () => {
    onSave({
      ...motivator,
      title,
      description: description || undefined,
      imageUrl: imageUrl || undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-ceramic-plate rounded-3xl p-6 w-full max-w-md border border-ceramic-rim shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-warm-text">Edit Motivator</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="hover:bg-ceramic-rim"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Form */}
        <div className="space-y-4 mb-6">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-warm-text font-medium">
              Title
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-ceramic-base border-ceramic-rim"
              placeholder="Enter motivator title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-warm-text font-medium">
              Description
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-ceramic-base border-ceramic-rim min-h-[100px]"
              placeholder="Enter motivator description"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-warm-text font-medium">
              Image
            </Label>
            <ImageUpload
              currentImageUrl={imageUrl}
              onImageUpload={setImageUrl}
              onImageRemove={() => setImageUrl('')}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 bg-ceramic-base border-ceramic-rim"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
};