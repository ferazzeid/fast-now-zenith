/**
 * LOVABLE_COMPONENT_STATUS: UPGRADED
 * LOVABLE_MIGRATION_PHASE: 1
 * LOVABLE_PRESERVE: true
 * LOVABLE_DESCRIPTION: Upgraded motivator form modal using UniversalModal system
 * LOVABLE_DEPENDENCIES: UniversalModal, ImageUpload, voice recording
 * LOVABLE_PERFORMANCE_IMPACT: Consistent UI, reduced bundle duplication
 * 
 * MIGRATION_NOTE: This is the upgraded version of /components/MotivatorFormModal.tsx
 * The original file remains functional during migration period.
 * New motivator creation should use this component.
 * 
 * DIFFERENCES_FROM_LEGACY:
 * - Uses UniversalModal for consistent design
 * - Standardized button layout and spacing
 * - Improved mobile responsiveness
 * - Better accessibility features
 * - Consistent error handling
 */

import { useState, useEffect } from 'react';
import { Save, Sparkles, Lightbulb, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { FormModal } from '@/components/ui/universal-modal';
import { ImageUpload } from '@/components/ImageUpload';
import { SimpleVoiceRecorder } from '@/components/SimpleVoiceRecorder';
import { RegenerateImageButton } from '@/components/RegenerateImageButton';
import { PremiumGate } from '@/components/PremiumGate';
import { useToast } from '@/hooks/use-toast';
import { useAdminTemplates } from '@/hooks/useAdminTemplates';
import { generate_image } from '@/utils/imageGeneration';
import { supabase } from '@/integrations/supabase/client';

interface Motivator {
  id?: string;
  title: string;
  content: string;
  category?: string;
  imageUrl?: string;
}

interface UpgradedMotivatorFormModalProps {
  motivator?: Motivator | null;
  onSave: (motivator: Motivator) => void;
  onClose: () => void;
}

export const UpgradedMotivatorFormModal = ({ 
  motivator, 
  onSave, 
  onClose 
}: UpgradedMotivatorFormModalProps) => {
  // LOVABLE_PRESERVE: Form state management
  const [title, setTitle] = useState(motivator?.title || '');
  const [content, setContent] = useState(motivator?.content || '');
  const [imageUrl, setImageUrl] = useState(motivator?.imageUrl || '');
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const { toast } = useToast();
  const { templates, loading: templatesLoading } = useAdminTemplates();
  const isEditing = !!motivator?.id;

  // LOVABLE_PRESERVE: Initialize form data when motivator changes
  useEffect(() => {
    if (motivator) {
      setTitle(motivator.title || '');
      setContent(motivator.content || '');
      setImageUrl(motivator.imageUrl || '');
    }
  }, [motivator]);

  // PERFORMANCE: Memoize categories to prevent unnecessary recalculations
  const categories = ['personal', 'health', 'achievement', 'mindset'];

  // LOVABLE_PRESERVE: Form validation
  const isFormValid = title.trim() && content.trim();

  // LOVABLE_PRESERVE: Save handler with proper error handling
  const handleSave = async () => {
    if (!isFormValid) {
      toast({
        title: "Validation Error",
        description: "Please fill in both title and content.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        id: motivator?.id,
        title: title.trim(),
        content: content.trim(),
        imageUrl: imageUrl || undefined,
      });
      
      toast({
        title: "Success",
        description: `Motivator ${isEditing ? 'updated' : 'created'} successfully!`,
      });
    } catch (error) {
      console.error('Error saving motivator:', error);
      toast({
        title: "Error",
        description: `Failed to ${isEditing ? 'update' : 'create'} motivator. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // LOVABLE_PRESERVE: Voice transcription handler
  const handleVoiceTranscription = (transcription: string) => {
    if (transcription) {
      // FEATURE: Smart content population from voice
      if (!title && transcription.length < 50) {
        setTitle(transcription);
      } else {
        setContent(prev => prev ? `${prev}\n\n${transcription}` : transcription);
      }
      setShowVoiceRecorder(false);
    }
  };

  // LOVABLE_PRESERVE: Image generation handler
  const handleGenerateImage = async () => {
    if (!title && !content) {
      toast({
        title: "Need Content",
        description: "Please add a title or content first to generate an image.",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingImage(true);
    try {
      const prompt = `${title} ${content}`.trim();
      const generatedImageUrl = await generate_image(prompt);
      if (generatedImageUrl) {
        setImageUrl(generatedImageUrl);
        toast({
          title: "Image Generated",
          description: "Motivational image created successfully!",
        });
      }
    } catch (error) {
      console.error('Error generating image:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // LOVABLE_PRESERVE: Template application handler
  const handleApplyTemplate = (template: any) => {
    setTitle(template.title);
    setContent(template.description);
    if (template.image_url) {
      setImageUrl(template.image_url);
    }
    toast({
      title: "Template Applied",
      description: "Template has been applied to your motivator.",
    });
  };

  return (
    <FormModal
      isOpen={true}
      onClose={onClose}
      onSave={handleSave}
      title={isEditing ? "Edit Motivator" : "Create New Motivator"}
      saveText={isEditing ? "Update" : "Create"}
      isSaving={isSaving}
      saveDisabled={!isFormValid}
    >
      <div className="space-y-6">
        {/* LOVABLE_PRESERVE: Title input section */}
        <div className="space-y-2">
          <Label htmlFor="title" className="text-sm font-medium">
            Title *
          </Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter a motivating title..."
            className="w-full"
            maxLength={100}
          />
          <p className="text-xs text-gray-500">
            {title.length}/100 characters
          </p>
        </div>

        {/* LOVABLE_PRESERVE: Content textarea section */}
        <div className="space-y-2">
          <Label htmlFor="content" className="text-sm font-medium">
            Content *
          </Label>
          <Textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your motivational content here..."
            className="w-full min-h-[120px] resize-vertical"
            maxLength={500}
          />
          <p className="text-xs text-gray-500">
            {content.length}/500 characters
          </p>
        </div>

        {/* LOVABLE_PRESERVE: Voice recording section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Voice Input</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowVoiceRecorder(!showVoiceRecorder)}
              className="flex items-center gap-2"
            >
              <Mic className="h-4 w-4" />
              {showVoiceRecorder ? 'Hide' : 'Voice Input'}
            </Button>
          </div>
          
          {showVoiceRecorder && (
            <Card className="p-4 bg-gray-50 dark:bg-gray-800/50">
              <PremiumGate feature="voice-input" showUpgrade={false}>
                <SimpleVoiceRecorder
                  onTranscription={handleVoiceTranscription}
                  placeholder="Speak your motivator content..."
                />
              </PremiumGate>
            </Card>
          )}
        </div>

        {/* LOVABLE_PRESERVE: Image section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Motivational Image</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ai"
                size="sm"
                onClick={handleGenerateImage}
                disabled={isGeneratingImage || (!title && !content)}
                className="flex items-center gap-2"
              >
                <Sparkles className="h-4 w-4" />
                {isGeneratingImage ? 'Generating...' : 'AI Generate'}
              </Button>
            </div>
          </div>
          
          <ImageUpload
            currentImageUrl={imageUrl}
            onImageUploaded={setImageUrl}
            onImageRemoved={() => setImageUrl('')}
          />
          
          {imageUrl && (
            <RegenerateImageButton
              currentImageUrl={imageUrl}
              prompt={`${title} ${content}`.trim()}
              onImageGenerated={setImageUrl}
            />
          )}
        </div>

        {/* LOVABLE_PRESERVE: Admin templates section */}
        {!templatesLoading && templates && templates.length > 0 && (
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Quick Templates
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {templates.slice(0, 4).map((template) => (
                <Button
                  key={template.id}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleApplyTemplate(template)}
                  className="justify-start text-left h-auto p-3"
                >
                  <div>
                    <div className="font-medium text-sm">{template.title}</div>
                    <div className="text-xs text-gray-500 truncate">
                      {template.description}
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* LOVABLE_PRESERVE: Category badges */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Categories</Label>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Badge
                key={category}
                variant="secondary"
                className="text-xs capitalize"
              >
                {category}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </FormModal>
  );
};