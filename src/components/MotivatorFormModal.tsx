import { useState, useEffect } from 'react';
import { X, Save, Sparkles, Lightbulb, Mic, Upload, Target, ArrowLeft, Eye, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { UniversalModal } from '@/components/ui/universal-modal';
import { ImageUpload } from '@/components/ImageUpload';
import { WeightGoalVisual } from '@/components/WeightGoalVisual';
import { useToast } from '@/hooks/use-toast';
import { useProfile } from '@/hooks/useProfile';
import { useAdminTemplates } from '@/hooks/useAdminTemplates';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { CircularVoiceButton } from '@/components/CircularVoiceButton';
import { useAccess } from '@/hooks/useAccess';
import { PremiumFoodModal } from './PremiumFoodModal';
import { 
  WeightGoalData, 
  generateWeightGoalTitle, 
  formatWhyReasons, 
  encodeWeightGoalData,
  decodeWeightGoalData,
  isWeightGoal,
  getWeightUnitsForSystem,
  getDefaultWeightUnit,
  parseWeightGoalContent
} from '@/utils/weightGoalUtils';

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
  const [tempMotivatorId, setTempMotivatorId] = useState<string | null>(null);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  
  // Weight goal specific states
  const [isWeightGoalMode, setIsWeightGoalMode] = useState(false);
  const [weight, setWeight] = useState<number>(70);
  const [selectedUnit, setSelectedUnit] = useState<'kg' | 'lbs' | 'stones'>('kg');
  const [whyReason1, setWhyReason1] = useState('');
  const [whyReason2, setWhyReason2] = useState('');
  const [whyReason3, setWhyReason3] = useState('');
  
  const { toast } = useToast();
  const { profile } = useProfile();
  const { templates, loading: templatesLoading } = useAdminTemplates();
  const { isAdmin, hasAIAccess } = useAccess();
  
  const isEditing = !!motivator?.id;
  const availableUnits = profile?.units ? getWeightUnitsForSystem(profile.units) : getWeightUnitsForSystem('metric');

  useEffect(() => {
    if (motivator) {
      const isWeightGoalMotivator = isWeightGoal(motivator);
      setIsWeightGoalMode(isWeightGoalMotivator);
      
      if (isWeightGoalMotivator) {
        // Parse weight goal data
        const weightData = decodeWeightGoalData(motivator.content || '{}');
        if (weightData) {
          setWeight(weightData.weight);
          setSelectedUnit(weightData.unit);
          setWhyReason1(weightData.whyReasons[0] || '');
          setWhyReason2(weightData.whyReasons[1] || '');
          setWhyReason3(weightData.whyReasons[2] || '');
        }
        
        // Don't set title/content for weight goals as they're auto-generated
      } else {
        setTitle(motivator.title || '');
        setContent(motivator.content || '');
        setImageUrl(motivator.imageUrl || '');
      }
    } else {
      // New motivator - set default unit based on user preference
      const defaultUnit = profile?.units ? getDefaultWeightUnit(profile.units) : 'kg';
      setSelectedUnit(defaultUnit);
    }
  }, [motivator, profile?.units]);



  const handleSave = async () => {
    if (isWeightGoalMode) {
      // Weight goal validation
      if (!weight || weight <= 0) {
        toast({
          title: "Weight required",
          description: "Please enter a valid target weight.",
          variant: "destructive",
        });
        return;
      }
      
      if (!whyReason1.trim()) {
        toast({
          title: "Reason required", 
          description: "Please provide at least one reason why you want to reach this weight.",
          variant: "destructive",
        });
        return;
      }
      
      // Create weight goal data
      const weightGoalData: WeightGoalData = {
        weight,
        unit: selectedUnit,
        whyReasons: [whyReason1, whyReason2, whyReason3].filter(r => r.trim().length > 0)
      };
      
      const motivatorData: Motivator = {
        id: motivator?.id || tempMotivatorId || '',
        title: generateWeightGoalTitle(weight, selectedUnit),
        content: encodeWeightGoalData(weightGoalData),
        category: 'weight_goal',
        imageUrl: undefined // Weight goals use auto-generated visual
      };
      
      await handleMotivatorSave(motivatorData);
    } else {
      // Regular goal validation
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
        imageUrl: imageUrl || undefined
      };
      
      await handleMotivatorSave(motivatorData);
    }
  };
  
  const handleMotivatorSave = async (motivatorData: Motivator) => {
    // If we have a temporary motivator, update it instead of creating new
    if (tempMotivatorId && !motivator?.id) {
      try {
        await supabase
          .from('motivators')
          .update({
            title: motivatorData.title,
            content: motivatorData.content,
            image_url: motivatorData.imageUrl,
            category: motivatorData.category
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

  const handleVoiceClick = () => {
    if (!hasAIAccess) {
      setShowPremiumModal(true);
    }
  };

  const handleVoiceTranscription = (transcription: string, context: 'title' | 'content' = 'content') => {
    // Always respect the explicit context from the voice button
    if (context === 'title') {
      setTitle(transcription);
    } else {
      setContent(transcription);
    }
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
      title={
        isWeightGoalMode 
          ? (isEditing ? 'Edit Weight Goal' : 'Create Weight Goal')
          : (isEditing ? 'Edit Motivator' : 'Create New Motivator')
      }
      variant="standard"
      size="sm"
      showCloseButton={true}
      footer={
        <>
          <Button 
            variant="soft"
            onClick={onClose}
            className="flex-1"
          >
            <X className="w-4 h-4" />
          </Button>
          <Button 
            variant="action-primary"
            onClick={handleSave}
            disabled={isWeightGoalMode ? (!weight || !whyReason1.trim()) : !title.trim()}
            className="flex-1"
          >
            {isEditing ? 'Update' : 'Create'}
          </Button>
        </>
      }
    >

        {/* Goal Type Toggle (only for new goals) */}
        {!isEditing && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-4 h-4 text-primary" />
              <Label>Goal Type</Label>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={!isWeightGoalMode ? "default" : "outline"}
                size="sm"
                onClick={() => setIsWeightGoalMode(false)}
                className="flex items-center gap-2"
              >
                <Lightbulb className="w-4 h-4" />
                Regular Goal
              </Button>
              <Button
                type="button"
                variant={isWeightGoalMode ? "default" : "outline"}
                size="sm"
                onClick={() => setIsWeightGoalMode(true)}
                className="flex items-center gap-2"
              >
                <Target className="w-4 h-4" />
                Weight Goal
              </Button>
            </div>
          </div>
        )}

        {/* Weight Goal Form */}
        {isWeightGoalMode ? (
          <div className="space-y-4">
            {/* Weight Input */}
            <div className="space-y-2">
              <Label htmlFor="weight">Target Weight</Label>
              <div className="flex gap-2">
                <Input
                  id="weight"
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(Number(e.target.value))}
                  placeholder="Enter weight"
                  min="1"
                  max="1000"
                  className="flex-1"
                />
                <Select value={selectedUnit} onValueChange={(value: 'kg' | 'lbs' | 'stones') => setSelectedUnit(value)}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background border border-border shadow-lg z-50">
                    {availableUnits.map((unit) => (
                      <SelectItem key={unit.value} value={unit.value}>
                        {unit.value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Weight Preview */}
            {weight > 0 && (
              <div className="flex justify-center">
                <WeightGoalVisual 
                  weight={weight}
                  unit={selectedUnit}
                  size="sm"
                />
              </div>
            )}

            {/* Why Reasons */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label>Why do you want to reach this weight?</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center justify-center w-4 h-4 rounded-full bg-muted border cursor-help">
                      <Eye className="w-2.5 h-2.5 text-muted-foreground" />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p className="text-xs">Think about how reaching this weight will improve your health, confidence, or lifestyle</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              
              <div className="space-y-2">
                <Input
                  value={whyReason1}
                  onChange={(e) => setWhyReason1(e.target.value)}
                  placeholder="First reason (required)"
                  className="border-primary/50"
                />
                <Input
                  value={whyReason2}
                  onChange={(e) => setWhyReason2(e.target.value)}
                  placeholder="Second reason (optional)"
                />
                <Input
                  value={whyReason3}
                  onChange={(e) => setWhyReason3(e.target.value)}
                  placeholder="Third reason (optional)"
                />
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Admin Templates (only for new regular motivators) */}
            {!isEditing && templates.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb className="w-4 h-4 text-primary" />
                  <Label>Get inspired by examples</Label>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-40 overflow-y-auto">
                  {templates.map((template) => (
                    <Card 
                      key={template.id} 
                      className="p-3 cursor-pointer hover:bg-muted transition-colors"
                      onClick={() => useTemplate(template)}
                    >
                      <div className="space-y-1">
                        <p className="font-medium text-ui-sm">{template.title}</p>
                        <p className="text-ui-xs text-muted-foreground line-clamp-2">{template.description}</p>
                        <Badge variant="secondary">
                          {template.category}
                        </Badge>
                      </div>
                    </Card>
                  ))}
                </div>
                <p className="text-ui-xs text-muted-foreground mt-2">
                  💡 Click any example to use as a starting point (you can edit it afterwards)
                </p>
              </div>
            )}

            {/* Regular Goal Form */}
            <div className="space-y-2">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="title">
                    Title
                  </Label>
                  {hasAIAccess ? (
                    <CircularVoiceButton
                      onTranscription={(text) => handleVoiceTranscription(text, 'title')}
                      size="sm"
                      context="title"
                    />
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleVoiceClick}
                      className="w-8 h-8 p-0 rounded-full border border-muted hover:bg-muted/80"
                      title="AI voice features require premium"
                    >
                      <Lock className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  )}
                </div>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="content">
                    Description
                  </Label>
                  {hasAIAccess ? (
                    <CircularVoiceButton
                      onTranscription={(text) => handleVoiceTranscription(text, 'content')}
                      size="sm"
                      context="content"
                    />
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleVoiceClick}
                      className="w-8 h-8 p-0 rounded-full border border-muted hover:bg-muted/80"
                      title="AI voice features require premium"
                    >
                      <Lock className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  )}
                </div>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>

              <div className="space-y-2">
                <Label>Image (Optional)</Label>
                <ImageUpload
                  currentImageUrl={imageUrl}
                  onImageUpload={setImageUrl}
                  onImageRemove={() => setImageUrl('')}
                  showUploadOptionsWhenImageExists={true}
                />
              </div>
            </div>
          </>
        )}

        {/* Minimal spacing before footer buttons */}
        <div className="h-2" />

        {/* Premium Modal for free users */}
        <PremiumFoodModal
          isOpen={showPremiumModal}
          onClose={() => setShowPremiumModal(false)}
        />

    </UniversalModal>
  );
};