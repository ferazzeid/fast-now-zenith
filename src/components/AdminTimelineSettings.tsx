import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { FastingTimelineV2 } from '@/components/FastingTimelineV2';
import { useQueryClient } from '@tanstack/react-query';
import { useFastingHoursQuery, fastingHoursKey } from '@/hooks/optimized/useFastingHoursQuery';
interface FastingHour {
  id?: string;
  hour: number;
  day: number;
  title: string;
  body_state: string;
  encouragement?: string;
  tips?: string[];
  phase: string;
  difficulty: string;
  common_feelings?: string[];
  scientific_info?: string;
  autophagy_milestone?: boolean;
  ketosis_milestone?: boolean;
  fat_burning_milestone?: boolean;
  // Enhanced fields
  benefits_challenges?: string;
  content_snippet?: string;
  content_rotation_data?: {
    current_index: number;
    variants: Array<{
      type: 'metabolic' | 'physiological' | 'mental' | 'benefits' | 'snippet' | 'stage' | 'encouragement' | 'admin_personal_log';
      content: string;
    }>;
  };
  metabolic_changes?: string;
  physiological_effects?: string;
  mental_emotional_state?: string[];
  stage?: string;
}

interface FastingHourEditModalProps {
  fastingHour?: FastingHour;
  isOpen: boolean;
  onSave: (fastingHour: FastingHour) => void;
  onClose: () => void;
}

const FastingHourEditModal: React.FC<FastingHourEditModalProps> = ({
  fastingHour,
  isOpen,
  onSave,
  onClose
}) => {
  const [formData, setFormData] = useState<FastingHour>({
    hour: 1,
    day: 1,
    title: '',
    body_state: '',
    encouragement: '',
    tips: [],
    phase: 'preparation',
    difficulty: 'easy',
    common_feelings: [],
    scientific_info: '',
    autophagy_milestone: false,
    ketosis_milestone: false,
    fat_burning_milestone: false
  });
  const [tipsInput, setTipsInput] = useState('');
  const [feelingsInput, setFeelingsInput] = useState('');

  useEffect(() => {
    if (fastingHour) {
      setFormData(fastingHour);
      setTipsInput(fastingHour.tips?.join('\n') || '');
      setFeelingsInput(fastingHour.common_feelings?.join(', ') || '');
    } else {
      setFormData({
        hour: 1,
        day: 1,
        title: '',
        body_state: '',
        encouragement: '',
        tips: [],
        phase: 'preparation',
        difficulty: 'easy',
        common_feelings: [],
        scientific_info: '',
        autophagy_milestone: false,
        ketosis_milestone: false,
        fat_burning_milestone: false
      });
      setTipsInput('');
      setFeelingsInput('');
    }
  }, [fastingHour, isOpen]);

  const handleSave = () => {
    const tips = tipsInput.split('\n').filter(tip => tip.trim() !== '');
    const feelings = feelingsInput.split(',').map(f => f.trim()).filter(f => f !== '');
    
    onSave({
      ...formData,
      tips,
      common_feelings: feelings
    });
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {fastingHour ? 'Edit Hour Timeline' : 'Create Hour Timeline'}
          </DialogTitle>
          <DialogDescription>
            Customize the information shown for each hour of fasting.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Hour</label>
              <Input
                type="number"
                min={1}
                max={72}
                value={formData.hour}
                onChange={(e) => {
                  const hour = parseInt(e.target.value) || 1;
                  setFormData(prev => ({ 
                    ...prev, 
                    hour,
                    day: Math.ceil(hour / 24)
                  }));
                }}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Day</label>
              <Input
                type="number"
                min={1}
                max={3}
                value={formData.day}
                onChange={(e) => setFormData(prev => ({ ...prev, day: parseInt(e.target.value) || 1 }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Phase</label>
              <Select 
                value={formData.phase} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, phase: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="preparation">Preparation</SelectItem>
                  <SelectItem value="adaptation">Adaptation</SelectItem>
                  <SelectItem value="fat_burning">Fat Burning</SelectItem>
                  <SelectItem value="deep_ketosis">Deep Ketosis</SelectItem>
                  <SelectItem value="autophagy">Autophagy</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Difficulty</label>
              <Select 
                value={formData.difficulty} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, difficulty: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Title</label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., Initial Hunger Pangs"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Body State</label>
            <Textarea
              value={formData.body_state}
              onChange={(e) => setFormData(prev => ({ ...prev, body_state: e.target.value }))}
              placeholder="Describe what's happening in the body..."
              rows={3}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Encouragement</label>
            <Textarea
              value={formData.encouragement || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, encouragement: e.target.value }))}
              placeholder="Motivational message for this hour..."
              rows={2}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Tips (one per line)</label>
            <Textarea
              value={tipsInput}
              onChange={(e) => setTipsInput(e.target.value)}
              placeholder="Drink water&#10;Go for a walk&#10;Practice deep breathing"
              rows={4}
            />
          </div>

          <div>
            <label className="text-sm font-medium">Common Feelings (comma separated)</label>
            <Input
              value={feelingsInput}
              onChange={(e) => setFeelingsInput(e.target.value)}
              placeholder="hunger, fatigue, clarity"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Scientific Info (optional)</label>
            <Textarea
              value={formData.scientific_info || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, scientific_info: e.target.value }))}
              placeholder="Scientific explanation of what's happening..."
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const AdminTimelineSettings = () => {
  const [editingHour, setEditingHour] = useState<FastingHour | undefined>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: fastingHours = [], isLoading } = useFastingHoursQuery();

  const existingHours = new Set(fastingHours.map(h => h.hour));
  const missingHours = Array.from({ length: 72 }, (_, i) => i + 1).filter(h => !existingHours.has(h));

  const saveFastingHour = async (fastingHour: FastingHour) => {
    try {
      // Client-side validation: duplicate hour check
      const duplicate = fastingHours.some(h => h.hour === fastingHour.hour && h.id !== fastingHour.id);
      if (duplicate) {
        toast({
          title: "Duplicate hour",
          description: `Hour ${fastingHour.hour} already exists. Please choose a different hour or edit the existing one.`,
          variant: "destructive"
        });
        return;
      }

      const { error } = await supabase
        .from('fasting_hours')
        .upsert({
          id: fastingHour.id,
          hour: fastingHour.hour,
          day: fastingHour.day,
          title: fastingHour.title,
          body_state: fastingHour.body_state,
          encouragement: fastingHour.encouragement,
          tips: fastingHour.tips,
          phase: fastingHour.phase,
          difficulty: fastingHour.difficulty,
          common_feelings: fastingHour.common_feelings,
          scientific_info: fastingHour.scientific_info,
          autophagy_milestone: fastingHour.autophagy_milestone,
          ketosis_milestone: fastingHour.ketosis_milestone,
          fat_burning_milestone: fastingHour.fat_burning_milestone
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Hour ${fastingHour.hour} timeline updated successfully`
      });

      // refresh cache
      queryClient.invalidateQueries({ queryKey: fastingHoursKey as any });
      setIsModalOpen(false);
      setEditingHour(undefined);
    } catch (error) {
      console.error('Error saving fasting hour:', error);
      toast({
        title: "Error",
        description: "Failed to save timeline data",
        variant: "destructive"
      });
    }
  };
  const deleteFastingHour = async (id: string) => {
    try {
      const { error } = await supabase
        .from('fasting_hours')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Timeline hour deleted successfully"
      });

      // refresh cache
      queryClient.invalidateQueries({ queryKey: fastingHoursKey as any });
    } catch (error) {
      console.error('Error deleting fasting hour:', error);
      toast({
        title: "Error",
        description: "Failed to delete timeline hour",
        variant: "destructive"
      });
    }
  };

  const generateMissingHours = async () => {
    if (missingHours.length === 0) return;
    try {
      const rows = missingHours.map((h) => ({
        hour: h,
        day: Math.ceil(h / 24),
        title: `Hour ${h}`,
        body_state: "Details coming soon",
        encouragement: "You're doing great — keep going!",
        tips: [],
        phase: 'preparation',
        difficulty: 'easy',
        common_feelings: [],
        scientific_info: '',
        autophagy_milestone: false,
        ketosis_milestone: false,
        fat_burning_milestone: false
      }));

      const { error } = await supabase.from('fasting_hours').upsert(rows);
      if (error) throw error;

      toast({
        title: "Hours generated",
        description: `Added ${rows.length} placeholder entr${rows.length === 1 ? 'y' : 'ies'}.`
      });

      queryClient.invalidateQueries({ queryKey: fastingHoursKey as any });
    } catch (error) {
      console.error('Error generating hours:', error);
      toast({
        title: "Error",
        description: "Failed to generate missing hours",
        variant: "destructive"
      });
    }
  };

  const openEditModal = (fastingHour?: FastingHour) => {
    setEditingHour(fastingHour);
    setIsModalOpen(true);
  };
  if (isLoading) {
    return <div className="text-center py-8">Loading timeline settings...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Timeline Hours ({fastingHours.length}/72)
        </CardTitle>
        <CardDescription>
          Configure motivational content for each hour of fasting
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add New Hour Button */}
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            {missingHours.length > 0 && (
              <Button variant="secondary" onClick={generateMissingHours}>
                <Plus className="w-4 h-4 mr-2" />
                Generate Missing ({missingHours.length})
              </Button>
            )}
            <Button onClick={() => openEditModal()}>
              <Plus className="w-4 h-4 mr-2" />
              Add
            </Button>
          </div>
        </div>

        {/* Hours List */}
        <div className="divide-y rounded-md border max-h-96 overflow-y-auto">
          {fastingHours.map((hour) => (
            <div key={hour.id || hour.hour} className="flex items-center justify-between py-2 px-3">
              <span className="text-sm">Hour {hour.hour}</span>
              <div className="flex gap-1">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => openEditModal(hour)}
                  aria-label={`Edit Hour ${hour.hour}`}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => hour.id && deleteFastingHour(hour.id)}
                  aria-label={`Delete Hour ${hour.hour}`}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>

        {fastingHours.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No timeline hours configured yet. Add your first hour to get started.
          </div>
        )}

        <FastingHourEditModal
          fastingHour={editingHour}
          isOpen={isModalOpen}
          onSave={saveFastingHour}
          onClose={() => {
            setIsModalOpen(false);
            setEditingHour(undefined);
          }}
        />
      </CardContent>
    </Card>
  );
};