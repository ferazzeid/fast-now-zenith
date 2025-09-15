import { useState } from 'react';
import { ArrowLeft, ArrowRight, Camera, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ImageUpload } from './ImageUpload';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface MotivatorTemplate {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: React.ElementType;
  examples: string[];
  imagePrompt: string;
}

interface CreatedMotivator {
  title: string;
  content: string;
  category: string;
  imageUrl?: string;
}

interface MotivatorCreationWizardProps {
  templates: MotivatorTemplate[];
  onComplete: (motivators: CreatedMotivator[]) => void;
  onCancel: () => void;
}

export const MotivatorCreationWizard = ({ templates, onComplete, onCancel }: MotivatorCreationWizardProps) => {
  const [currentTemplateIndex, setCurrentTemplateIndex] = useState(0);
  const [createdMotivators, setCreatedMotivators] = useState<CreatedMotivator[]>([]);
  const [currentMotivator, setCurrentMotivator] = useState({
    title: '',
    content: '',
    imageUrl: ''
  });
  const { toast } = useToast();

  const currentTemplate = templates[currentTemplateIndex];
  const isLastTemplate = currentTemplateIndex === templates.length - 1;


  const handleNext = () => {
    if (!currentMotivator.title.trim()) {
      toast({
        title: "Title required",
        description: "Please add a title for your motivator.",
        variant: "destructive",
      });
      return;
    }

    const motivator: CreatedMotivator = {
      title: currentMotivator.title,
      content: currentMotivator.content || '',
      category: currentTemplate.category,
      imageUrl: currentMotivator.imageUrl || undefined
    };

    const newCreatedMotivators = [...createdMotivators, motivator];
    setCreatedMotivators(newCreatedMotivators);

    if (isLastTemplate) {
      onComplete(newCreatedMotivators);
    } else {
      setCurrentTemplateIndex(prev => prev + 1);
      setCurrentMotivator({ title: '', content: '', imageUrl: '' });
    }
  };

  const handlePrevious = () => {
    if (currentTemplateIndex > 0) {
      setCurrentTemplateIndex(prev => prev - 1);
      // Restore previous motivator data
      const previousMotivator = createdMotivators[currentTemplateIndex - 1];
      if (previousMotivator) {
        setCurrentMotivator({
          title: previousMotivator.title,
          content: previousMotivator.content,
          imageUrl: previousMotivator.imageUrl || ''
        });
        // Remove it from created list since we're editing
        setCreatedMotivators(prev => prev.slice(0, -1));
      }
    }
  };

  const Icon = currentTemplate.icon;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="bg-ceramic-plate p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-ceramic-shadow">
        <div className="space-y-6">
          {/* Progress Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-warm-text">{currentTemplate.title}</h2>
                <p className="text-sm text-muted-foreground">
                  Step {currentTemplateIndex + 1} of {templates.length}
                </p>
              </div>
            </div>
            <Badge variant="outline">
              {currentTemplate.category}
            </Badge>
          </div>

          {/* Template Description & Examples */}
          <div className="bg-ceramic-base p-4 rounded-lg space-y-3">
            <p className="text-sm text-muted-foreground">{currentTemplate.description}</p>
            <div>
              <p className="text-xs font-medium text-warm-text mb-2">Example ideas:</p>
              <div className="flex flex-wrap gap-1">
                {currentTemplate.examples.map((example, idx) => (
                  <Badge 
                    key={idx} 
                    variant="secondary" 
                    className="text-xs cursor-pointer hover:bg-primary hover:text-primary-foreground"
                    onClick={() => setCurrentMotivator(prev => ({ ...prev, title: example }))}
                  >
                    {example}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-warm-text font-medium">
                Motivator Title *
              </Label>
              <Input
                id="title"
                value={currentMotivator.title}
                onChange={(e) => setCurrentMotivator(prev => ({ ...prev, title: e.target.value }))}
                placeholder="What motivates you to fast?"
                className="bg-ceramic-base border border-ceramic-shadow"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content" className="text-warm-text font-medium">
                Description (optional)
              </Label>
              <Textarea
                id="content"
                value={currentMotivator.content}
                onChange={(e) => setCurrentMotivator(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Add more details about this motivation..."
                className="bg-ceramic-base border border-ceramic-shadow min-h-[80px]"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-warm-text font-medium">
                Motivator Image
              </Label>
              
              <div className="space-y-3">
                <ImageUpload
                  currentImageUrl={currentMotivator.imageUrl}
                  onImageUpload={(url) => setCurrentMotivator(prev => ({ ...prev, imageUrl: url }))}
                  onImageRemove={() => setCurrentMotivator(prev => ({ ...prev, imageUrl: '' }))}
                />
              </div>
              
              <p className="text-xs text-muted-foreground">
                💡 <strong>Pro tip:</strong> Personal photos (loved ones, goal outfits, progress pics) 
                are usually more motivating than AI-generated images.
              </p>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            
            {currentTemplateIndex > 0 && (
              <Button variant="outline" onClick={handlePrevious}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
            )}
            
            <Button 
              onClick={handleNext} 
              disabled={!currentMotivator.title.trim()}
              className="flex-1 bg-primary"
            >
              {isLastTemplate ? (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Create Motivators
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};