import { useState } from 'react';
import { Plus, Mic, Image, Save, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { VoiceRecorder } from './VoiceRecorder';
import { ImageUpload } from './ImageUpload';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { validateInput, validateJsonInput } from '@/utils/inputValidation';

interface AdminMotivatorTemplate {
  id: string;
  title: string;
  description: string;
  category: string;
  imageUrl?: string;
}

interface AdminMotivatorCreationProps {
  onTemplateCreated: (template: AdminMotivatorTemplate) => void;
  existingTemplates: AdminMotivatorTemplate[];
}

export const AdminMotivatorCreation = ({ onTemplateCreated, existingTemplates }: AdminMotivatorCreationProps) => {
  const [newTemplate, setNewTemplate] = useState<AdminMotivatorTemplate>({
    id: '',
    title: '',
    description: '',
    category: 'health',
    imageUrl: ''
  });
  const [isCreating, setIsCreating] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const { toast } = useToast();

  const categories = [
    'health',
    'appearance',
    'energy',
    'mental-clarity',
    'spiritual',
    'achievement',
    'social',
    'lifestyle'
  ];

  const handleVoiceTranscription = (transcription: string) => {
    // Validate and sanitize voice input
    const titleValidation = validateInput('title', transcription);
    if (!titleValidation.isValid) {
      toast({
        title: "Invalid Voice Input",
        description: titleValidation.errors.join(', '),
        variant: "destructive",
      });
      return;
    }

    // Use AI to parse the voice input into title and description
    const lines = titleValidation.sanitizedValue.split('\n').filter(line => line.trim());
    if (lines.length > 0) {
      const titleLine = lines[0].trim();
      const descriptionLine = lines.slice(1).join(' ').trim() || titleLine;
      
      // Validate description
      const descValidation = validateInput('description', descriptionLine);
      
      setNewTemplate(prev => ({
        ...prev,
        title: titleLine,
        description: descValidation.sanitizedValue
      }));
    }
    setShowVoiceRecorder(false);
  };

  const handleImageUpload = (imageUrl: string) => {
    setNewTemplate(prev => ({ ...prev, imageUrl }));
  };

  const createTemplate = async () => {
    // Validate inputs
    const titleValidation = validateInput('title', newTemplate.title);
    const descValidation = validateInput('description', newTemplate.description);
    
    if (!titleValidation.isValid || !descValidation.isValid) {
      const allErrors = [...titleValidation.errors, ...descValidation.errors];
      toast({
        title: "Validation Error",
        description: allErrors.join(', '),
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      const sanitizedTemplate = {
        ...newTemplate,
        id: crypto.randomUUID(),
        title: titleValidation.sanitizedValue,
        description: descValidation.sanitizedValue
      };

      // Validate and save to shared_settings as admin template
      const currentTemplates = [...existingTemplates, sanitizedTemplate];
      const jsonValidation = validateJsonInput(JSON.stringify(currentTemplates));
      
      if (!jsonValidation.isValid) {
        throw new Error('Template data validation failed: ' + jsonValidation.errors.join(', '));
      }
      
      const { error } = await supabase
        .from('shared_settings')
        .update({ 
          setting_value: jsonValidation.sanitizedValue
        })
        .eq('setting_key', 'ai_admin_motivator_templates');

      if (error) throw error;

      onTemplateCreated(sanitizedTemplate);
      setNewTemplate({ id: '', title: '', description: '', category: 'health', imageUrl: '' });
      
      toast({
        title: "Success",
        description: "Admin motivator template created successfully",
      });
    } catch (error) {
      console.error('Error creating template:', error);
      toast({
        title: "Error",
        description: "Failed to create motivator template",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const deleteTemplate = async (templateId: string) => {
    try {
      const updatedTemplates = existingTemplates.filter(t => t.id !== templateId);
      const jsonValidation = validateJsonInput(JSON.stringify(updatedTemplates));
      
      if (!jsonValidation.isValid) {
        throw new Error('Template data validation failed: ' + jsonValidation.errors.join(', '));
      }
      
      const { error } = await supabase
        .from('shared_settings')
        .update({ 
          setting_value: jsonValidation.sanitizedValue
        })
        .eq('setting_key', 'ai_admin_motivator_templates');

      if (error) throw error;

      toast({
        title: "Success",
        description: "Template deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting template:', error);
      toast({
        title: "Error",
        description: "Failed to delete template",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Create New Template */}
      <Card className="p-6 bg-ceramic-base border-ceramic-rim">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-semibold text-warm-text">Create Admin Motivator Template</h4>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowVoiceRecorder(true)}
                className="bg-ceramic-plate border-ceramic-rim"
              >
                <Mic className="w-4 h-4 mr-2" />
                Voice Input
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="template-title" className="text-warm-text">Title</Label>
              <Input
                id="template-title"
                value={newTemplate.title}
                onChange={(e) => {
                  const validation = validateInput('title', e.target.value);
                  setNewTemplate(prev => ({ ...prev, title: validation.sanitizedValue }));
                }}
                placeholder="e.g., Look Amazing in Summer"
                className="bg-ceramic-plate border-ceramic-rim"
                maxLength={200}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-warm-text">Category</Label>
              <Select
                value={newTemplate.category}
                onValueChange={(value) => setNewTemplate(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger className="bg-ceramic-plate border-ceramic-rim">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="template-description" className="text-warm-text">Description</Label>
            <Textarea
              id="template-description"
              value={newTemplate.description}
              onChange={(e) => {
                const validation = validateInput('description', e.target.value);
                setNewTemplate(prev => ({ ...prev, description: validation.sanitizedValue }));
              }}
              placeholder="Describe the motivational goal or outcome..."
              className="bg-ceramic-plate border-ceramic-rim min-h-[100px]"
              maxLength={1000}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-warm-text">Template Image (Optional)</Label>
            <ImageUpload
              onImageUpload={handleImageUpload}
              onImageRemove={() => setNewTemplate(prev => ({ ...prev, imageUrl: '' }))}
              currentImageUrl={newTemplate.imageUrl}
            />
          </div>

          <Button
            onClick={createTemplate}
            disabled={isCreating || !newTemplate.title.trim() || !newTemplate.description.trim()}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Save className="w-4 h-4 mr-2" />
            {isCreating ? 'Creating...' : 'Create Template'}
          </Button>
        </div>
      </Card>

      {/* Existing Templates */}
      {existingTemplates.length > 0 && (
        <Card className="p-6 bg-ceramic-base border-ceramic-rim">
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-warm-text">Admin Motivator Templates</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {existingTemplates.map((template) => (
                <div
                  key={template.id}
                  className="p-4 bg-ceramic-plate border border-ceramic-rim rounded-lg space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h5 className="font-medium text-warm-text">{template.title}</h5>
                      <p className="text-sm text-muted-foreground">{template.category}</p>
                      <p className="text-sm text-warm-text mt-2">{template.description}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => template.id && deleteTemplate(template.id)}
                      className="text-destructive hover:text-destructive/90"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  {template.imageUrl && (
                    <img
                      src={template.imageUrl}
                      alt={template.title}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Voice Recorder Modal */}
      {showVoiceRecorder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-ceramic-plate p-6 rounded-lg border border-ceramic-rim max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-warm-text mb-4">Voice Input</h3>
            <VoiceRecorder
              onTranscription={handleVoiceTranscription}
            />
            <div className="flex justify-end space-x-2 mt-4">
              <Button
                variant="outline"
                onClick={() => setShowVoiceRecorder(false)}
                className="bg-ceramic-base border-ceramic-rim"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
