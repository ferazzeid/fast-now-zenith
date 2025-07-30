import { useState } from 'react';
import { Plus, Mic, Image, Save, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { VoiceRecorder } from './VoiceRecorder';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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
    // Add transcribed text to description
    setNewTemplate(prev => ({
      ...prev,
      description: prev.description ? `${prev.description}\n${transcription}` : transcription
    }));
    setShowVoiceRecorder(false);
  };

  const handleImageUpload = (imageUrl: string) => {
    setNewTemplate(prev => ({ ...prev, imageUrl }));
  };

  const createTemplate = async () => {
    // Simple validation
    if (!newTemplate.title.trim() || !newTemplate.description.trim()) {
      toast({
        title: "Validation Error",
        description: "Title and description are required",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      const template = {
        ...newTemplate,
        id: crypto.randomUUID(),
        title: newTemplate.title.trim(),
        description: newTemplate.description.trim()
      };

      // Save to shared_settings as admin template
      const currentTemplates = [...existingTemplates, template];
      
      const { error } = await supabase
        .from('shared_settings')
        .update({ 
          setting_value: JSON.stringify(currentTemplates)
        })
        .eq('setting_key', 'ai_admin_motivator_templates');

      if (error) throw error;

      onTemplateCreated(template);
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
      
      const { error } = await supabase
        .from('shared_settings')
        .update({ 
          setting_value: JSON.stringify(updatedTemplates)
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
            </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="template-title" className="text-warm-text">Title</Label>
              <Input
                id="template-title"
                value={newTemplate.title}
                onChange={(e) => setNewTemplate(prev => ({ ...prev, title: e.target.value }))}
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
              onChange={(e) => setNewTemplate(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe the motivational goal or outcome..."
              className="bg-ceramic-plate border-ceramic-rim min-h-[100px]"
              maxLength={1000}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-warm-text">Template Image & Voice Input</Label>
            <div className="grid grid-cols-2 gap-3">
              {/* Voice Button */}
              <VoiceRecorder
                onTranscription={handleVoiceTranscription}
                isDisabled={isCreating}
              />
              
              {/* Image Button - matching food tracking style */}
              <Button
                type="button"
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'image/*';
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) {
                      // Handle actual file upload here
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        const dataUrl = event.target?.result as string;
                        handleImageUpload(dataUrl);
                      };
                      reader.readAsDataURL(file);
                    }
                  };
                  input.click();
                }}
                className="h-20 flex flex-col items-center justify-center bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Image className="w-6 h-6 mb-1" />
                <span className="text-sm font-medium">Image</span>
              </Button>
            </div>
            
            {/* Show uploaded image if exists */}
            {newTemplate.imageUrl && (
              <div className="mt-3 relative">
                <img
                  src={newTemplate.imageUrl}
                  alt="Template preview"
                  className="w-full h-32 object-cover rounded-lg border border-ceramic-rim"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setNewTemplate(prev => ({ ...prev, imageUrl: '' }))}
                  className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
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

    </div>
  );
};
