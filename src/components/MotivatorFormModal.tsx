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
import { generate_image } from '@/utils/imageGeneration';
import { useAdminTemplates } from '@/hooks/useAdminTemplates';
import { RegenerateImageButton } from '@/components/RegenerateImageButton';
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
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [bgPending, setBgPending] = useState(false);
  const { toast } = useToast();
  const { templates, loading: templatesLoading } = useAdminTemplates();
  const [conceptOverride, setConceptOverride] = useState('');
  const [detectedConcept, setDetectedConcept] = useState<string | null>(null);
  const [promptPreview, setPromptPreview] = useState<string>('');
  const isEditing = !!motivator?.id;

  useEffect(() => {
    if (motivator) {
      setTitle(motivator.title || '');
      setContent(motivator.content || '');
      setImageUrl(motivator.imageUrl || '');
    }
  }, [motivator]);

  // Real-time: attach image when background generation completes
  useEffect(() => {
    if (!motivator?.id || !bgPending) return;
    const channel = supabase
      .channel(`motivator-image-${motivator.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'motivators',
        filter: `id=eq.${motivator.id}`
      }, (payload: any) => {
        const url = payload?.new?.image_url;
        if (url) {
          setImageUrl(url);
          setBgPending(false);
          toast({ title: 'Image ready', description: 'AI image generated and saved.' });
        }
      })
      .subscribe();

    return () => {
      try { supabase.removeChannel(channel); } catch {}
    };
  }, [motivator?.id, bgPending]);

  const handleGenerateImage = async () => {
    if (!title.trim() && !content.trim()) {
      toast({
        title: "Add some content first",
        description: "Please add a title or description before generating an image.",
        variant: "destructive",
      });
      return;
    }

    const t = title.trim();
    const c = content.trim();

    // Extract concept
    let concept = t;
    try {
      // Get user's OpenAI API key
      const { data: profile } = await supabase
        .from('profiles')
        .select('openai_api_key, use_own_api_key')
        .maybeSingle();

      let apiKey = profile?.use_own_api_key ? (profile.openai_api_key || undefined) : undefined;
      if (!apiKey && typeof window !== 'undefined' && profile?.use_own_api_key) {
        const localKey = localStorage.getItem('openai_api_key');
        if (localKey) apiKey = localKey;
      }

      const { data: conceptData } = await supabase.functions.invoke('extract-motivator-concept', {
        body: { title: t, content: c, apiKey }
      });
      if (conceptData?.concept) concept = conceptData.concept;
    } catch {}

    // Brand color and admin template
    let primaryColor = "220 35% 45%";
    let adminTemplate: string | undefined;
    try {
      const { data: settingsData } = await supabase
        .from('shared_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['brand_primary_color', 'ai_image_motivator_prompt']);
      settingsData?.forEach((s) => {
        if (s.setting_key === 'brand_primary_color' && s.setting_value) primaryColor = s.setting_value;
        if (s.setting_key === 'ai_image_motivator_prompt' && s.setting_value) adminTemplate = s.setting_value;
      });
    } catch {}

    const defaultConceptTemplate = "Simple black and white icon of {concept}";
    const templateToUse = adminTemplate && adminTemplate.includes('{concept}')
      ? adminTemplate
      : defaultConceptTemplate;
    const conceptValue = (conceptOverride.trim() || concept);
    const finalPrompt = templateToUse
      .replace(/{concept}/g, conceptValue)
      .replace(/{primary_color}/g, 'black and white');

    // Update transparency state
    setDetectedConcept(conceptValue);
    setPromptPreview(finalPrompt);

    // If editing existing motivator, use background generation
    if (motivator?.id) {
      try {
        let apiKey: string | undefined = undefined;
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('use_own_api_key, openai_api_key')
            .maybeSingle();
          if (profile?.use_own_api_key) {
            apiKey = profile.openai_api_key || localStorage.getItem('openai_api_key') || undefined;
          }
        } catch {}

        const { data: authData } = await supabase.auth.getUser();
        const uid = authData?.user?.id;
        const { error } = await supabase.functions.invoke('generate-image', {
          body: {
            prompt: finalPrompt,
            filename: `motivator-${motivator.id}-${Date.now()}.jpg`,
            motivatorId: motivator.id,
            userId: uid,
            apiKey
          }
        });

        if (error) throw error;

        setBgPending(true);
        toast({
          title: "✨ Generating image...",
          description: "You can close this modal; the image will attach automatically when ready.",
        });
      } catch (error) {
        toast({
          title: "Generation failed",
          description: "Please try again or add your own image.",
          variant: "destructive",
        });
      }
      return;
    }

    // For new motivators, use direct generation
    setIsGeneratingImage(true);
    try {
      const newImageUrl = await generate_image(finalPrompt, `motivator-${Date.now()}.jpg`);
      setImageUrl(newImageUrl);
      toast({
        title: "✨ Image Generated!",
        description: "Your AI-generated motivator image is ready.",
      });
    } catch (error) {
      toast({
        title: "Image generation failed",
        description: "Please try again or add your own image.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleSave = () => {
    if (!title.trim()) {
      toast({
        title: "Title required",
        description: "Please add a title for your motivator.",
        variant: "destructive",
      });
      return;
    }

    const motivatorData: Motivator = {
      id: motivator?.id || '', // Ensure ID is always included for editing
      title: title.trim(),
      content: content.trim(),
      imageUrl: imageUrl || undefined
    };

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
            {isEditing ? 'Save' : 'Create Motivator'}
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
            {bgPending && (
              <div className="text-xs text-muted-foreground bg-muted/40 border border-muted rounded-md p-2">
                Generating image in background… You can close this modal; it will attach automatically.
              </div>
            )}
            <ImageUpload
              currentImageUrl={imageUrl}
              onImageUpload={setImageUrl}
              onImageRemove={() => setImageUrl('')}
              showUploadOptionsWhenImageExists={true}
              regenerateButton={
                imageUrl && (title || content) ? (
                  <RegenerateImageButton
                    prompt={`${title}. ${content}`}
                    filename={`motivator-${motivator?.id || Date.now()}.jpg`}
                    onImageGenerated={setImageUrl}
                    motivatorId={motivator?.id}
                    mode="motivator"
                    disabled={isGeneratingImage}
                  />
                ) : undefined
              }
              aiGenerationPrompt={title || content ? `${title}. ${content}` : undefined}
              motivatorId={motivator?.id}
              onAiGenerate={handleGenerateImage}
              isGenerating={isGeneratingImage}
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