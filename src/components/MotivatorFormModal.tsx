import { useState, useEffect } from 'react';
import { X, Save, Sparkles, Lightbulb, Mic, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { UniversalModal } from '@/components/ui/universal-modal';
import { ImageUpload } from './ImageUpload';
import { useToast } from '@/hooks/use-toast';
import { useAdminTemplates } from '@/hooks/useAdminTemplates';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { SimpleVoiceRecorder } from './SimpleVoiceRecorder';
import { PremiumGate } from '@/components/PremiumGate';

interface Motivator {
  id?: string;
  title: string;
  content: string;
  category?: string;
  imageUrl?: string;
  linkUrl?: string;
}

interface MotivatorFormModalProps {
  motivator?: Motivator | null;
  onSave: (motivator: Motivator) => void;
  onClose: () => void;
}

export const MotivatorFormModal = ({ motivator, onSave, onClose }: MotivatorFormModalProps) => {
  const [title, setTitle] = useState(motivator?.title || '');
  const [content, setContent] = useState(motivator?.content || '');
  const [imageUrl, setImageUrl] = useState(motivator?.imageUrl || '');
  const [linkUrl, setLinkUrl] = useState(motivator?.linkUrl || '');
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [tempMotivatorId, setTempMotivatorId] = useState<string | null>(null);
  
  const { toast } = useToast();
  const { templates, loading: templatesLoading } = useAdminTemplates();
  
  const isEditing = !!motivator?.id;

  useEffect(() => {
    if (motivator) {
      setTitle(motivator.title || '');
      setContent(motivator.content || '');
      setImageUrl(motivator.imageUrl || '');
      setLinkUrl(motivator.linkUrl || '');
    }
  }, [motivator]);



  const handleSave = async () => {
    if (!title.trim()) {
      toast({
        title: "Title required",
        description: "Please add a title for your motivator.",
        variant: "destructive",
      });
      return;
    }

    const motivatorData: Motivator = {
      id: motivator?.id || tempMotivatorId || '',
      title: title.trim(),
      content: content.trim(),
      imageUrl: imageUrl || undefined,
      linkUrl: linkUrl.trim() || undefined
    };

    // If we have a temporary motivator, update it instead of creating new
    if (tempMotivatorId && !motivator?.id) {
      try {
        await supabase
          .from('motivators')
          .update({
            title: motivatorData.title,
            content: motivatorData.content,
            image_url: motivatorData.imageUrl,
            link_url: motivatorData.linkUrl
          })
          .eq('id', tempMotivatorId);
        
        // Include the temp ID in the data for the parent component
        motivatorData.id = tempMotivatorId;
      } catch (error) {
        console.error('Error updating temporary motivator:', error);
      }
    }

    console.log('MotivatorFormModal: Saving motivator data:', motivatorData);
    onSave(motivatorData);
  };

  const handleVoiceTranscription = (transcription: string) => {
    // If short (likely a title), put in title field
    // If longer, put in content field
    if (transcription.length < 50) {
      setTitle(transcription);
    } else {
      setContent(transcription);
    }
    setShowVoiceRecorder(false);
  };

  const useTemplate = (template: any) => {
    setTitle(template.title);
    setContent(template.description);
    if (template.imageUrl) {
      setImageUrl(template.imageUrl);
    }
  };

  return (
    <UniversalModal
      isOpen={true}
      onClose={onClose}
      title={isEditing ? 'Edit Motivator' : 'Create New Motivator'}
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
            {isEditing ? 'Save' : 'Create'}
          </Button>
        </>
      }
    >

        {/* Admin Templates (only for new motivators) */}
        {!isEditing && templates.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-4 h-4 text-primary" />
              <Label className="text-warm-text font-medium">Get inspired by examples</Label>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-40 overflow-y-auto">
              {templates.map((template) => (
                <Card 
                  key={template.id} 
                  className="p-3 cursor-pointer hover:bg-ceramic-base border-ceramic-rim transition-colors"
                  onClick={() => useTemplate(template)}
                >
                  <div className="space-y-1">
                    <p className="font-medium text-sm text-warm-text">{template.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{template.description}</p>
                    <Badge variant="secondary" className="text-xs">
                      {template.category}
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              💡 Click any example to use as a starting point (you can edit it afterwards)
            </p>
          </div>
        )}

        {/* Form */}
        <div className="space-y-2">{/* Further reduced spacing to make content more compact */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="title" className="text-warm-text font-medium">
                Title *
              </Label>
              <PremiumGate feature="Voice Input" showUpgrade={false}>
                <button
                  onClick={() => setShowVoiceRecorder(true)}
                  className="w-6 h-6 rounded-full bg-ai hover:bg-ai/90 text-ai-foreground transition-all duration-200"
                >
                  <Mic className="w-3 h-3 mx-auto" />
                </button>
              </PremiumGate>
            </div>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-ceramic-base border-ceramic-rim"
              placeholder="What motivates you to fast?"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="content" className="text-warm-text font-medium">
                Description (Optional)
              </Label>
              <PremiumGate feature="Voice Input" showUpgrade={false}>
                <button
                  onClick={() => setShowVoiceRecorder(true)}
                  className="w-6 h-6 rounded-full bg-ai hover:bg-ai/90 text-ai-foreground transition-all duration-200"
                >
                  <Mic className="w-3 h-3 mx-auto" />
                </button>
              </PremiumGate>
            </div>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="bg-ceramic-base border-ceramic-rim min-h-[40px]"
              placeholder="Optional: Add more details about this motivation..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="linkUrl" className="text-warm-text font-medium">
              Link URL (Optional)
            </Label>
            <Input
              id="linkUrl"
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              className="bg-ceramic-base border-ceramic-rim"
              placeholder="https://example.com/more-info"
            />
            <p className="text-xs text-muted-foreground">
              Optional URL to a detailed story or description on your website
            </p>
          </div>

          <div className="space-y-2">
            <ImageUpload
              currentImageUrl={imageUrl}
              onImageUpload={setImageUrl}
              onImageRemove={() => setImageUrl('')}
              showUploadOptionsWhenImageExists={true}
            />
          </div>
          
          {/* Minimal spacing before footer buttons */}
          <div className="h-2" />
        </div>

        {/* Voice Recorder Modal */}
        {showVoiceRecorder && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60]">
            <div className="bg-ceramic-plate rounded-2xl p-6 w-full max-w-sm">
              <div className="text-center mb-4">
                <h4 className="font-semibold text-warm-text mb-2">Voice Input</h4>
                <p className="text-sm text-muted-foreground">
                  Speak your motivator title or description
                </p>
              </div>
              
              <div className="space-y-4">
                <PremiumGate feature="Voice Input" grayOutForFree={true}>
                  <SimpleVoiceRecorder
                    onTranscription={handleVoiceTranscription}
                  />
                </PremiumGate>
                
                <Button
                  variant="outline"
                  onClick={() => setShowVoiceRecorder(false)}
                  className="w-full"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

    </UniversalModal>
  );
};