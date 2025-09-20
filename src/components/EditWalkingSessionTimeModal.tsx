import React, { useState } from 'react';
import { parseISO } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { Zap } from 'lucide-react';
import { useOptimizedProfile } from '@/hooks/optimized/useOptimizedProfile';
import { estimateSteps } from '@/utils/stepEstimation';
import { 
  UniversalHistoryEditModal, 
  UniversalEditField, 
  UniversalEditPreview,
  formatForDateTimeInput,
  formatDuration
} from '@/components/ui/universal-history-edit-modal';

interface WalkingSession {
  id: string;
  start_time: string;
  end_time?: string;
  duration_minutes?: number;
  calories_burned?: number;
  distance?: number;
  estimated_steps?: number;
  is_edited?: boolean;
  speed_mph?: number;
}

interface EditWalkingSessionTimeModalProps {
  session: WalkingSession;
  isOpen: boolean;
  onClose: () => void;
  onSessionEdited: () => void;
}

export const EditWalkingSessionTimeModal: React.FC<EditWalkingSessionTimeModalProps> = ({
  session,
  isOpen,
  onClose,
  onSessionEdited,
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const user = useAuthStore(state => state.user);
  const { profile, calculateWalkingCalories } = useOptimizedProfile();

  // Convert UTC times to local datetime-local format
  const [startTime, setStartTime] = useState(
    session.start_time ? formatForDateTimeInput(session.start_time) : ''
  );
  const [endTime, setEndTime] = useState(
    session.end_time ? formatForDateTimeInput(session.end_time) : ''
  );
  const [speed, setSpeed] = useState(session.speed_mph || 3.2);
  const [editReason, setEditReason] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [recalculateValues, setRecalculateValues] = useState(false);

  const calculateDuration = () => {
    if (!startTime || !endTime) return 0;
    const start = new Date(startTime);
    const end = new Date(endTime);
    return Math.round((end.getTime() - start.getTime()) / (1000 * 60));
  };

  const calculatePreviewValues = () => {
    const duration = calculateDuration();
    if (!duration || !recalculateValues) return null;

    const distanceMiles = (speed * duration) / 60;
    const caloriesBurned = profile && calculateWalkingCalories 
      ? calculateWalkingCalories(duration, speed)
      : Math.round(duration * 3.5);
    const estimatedSteps = estimateSteps({ 
      durationMinutes: duration, 
      speedMph: speed,
      userHeight: profile?.height || 175
    });

    return {
      distance: distanceMiles,
      calories: caloriesBurned,
      steps: estimatedSteps
    };
  };

  const handleSave = async () => {
    if (!user || !startTime || !endTime) {
      toast({
        title: "Invalid Input",
        description: "Please fill in both start and end times.",
        variant: "destructive",
      });
      return;
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (end <= start) {
      toast({
        title: "Invalid Time Range",
        description: "End time must be after start time.",
        variant: "destructive",
      });
      return;
    }

    const newDuration = calculateDuration();
    
    if (newDuration <= 0 || newDuration > 1440) { // Max 24 hours
      toast({
        title: "Invalid Duration",
        description: "Duration must be between 1 minute and 24 hours.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      // Store original duration if not already edited
      const originalDuration = session.is_edited 
        ? session.duration_minutes 
        : Math.round((parseISO(session.end_time!).getTime() - parseISO(session.start_time).getTime()) / (1000 * 60));

      const previewValues = calculatePreviewValues();
      
      const updateData: any = {
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        speed_mph: speed,
        is_edited: true,
        original_duration_minutes: session.is_edited ? session.duration_minutes : originalDuration,
        edit_reason: editReason || null,
        updated_at: new Date().toISOString(),
      };

      // Either recalculate or null out calculated fields
      if (recalculateValues && previewValues) {
        updateData.distance = previewValues.distance;
        updateData.calories_burned = previewValues.calories;
        updateData.estimated_steps = previewValues.steps;
      } else {
        updateData.calories_burned = null;
        updateData.distance = null;
        updateData.estimated_steps = null;
      }

      const { error } = await supabase
        .from('walking_sessions')
        .update(updateData)
        .eq('id', session.id)
        .eq('user_id', user.id);

      if (error) throw error;

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['walking-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['daily-deficit'] });
      queryClient.invalidateQueries({ queryKey: ['walking-calories'] });

      toast({
        title: "Session Updated",
        description: recalculateValues 
          ? "Walking session has been updated with recalculated values."
          : "Walking session has been updated. Calculated data has been removed.",
      });

      onSessionEdited();
      onClose();
    } catch (error) {
      console.error('Error updating session:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update walking session.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const duration = calculateDuration();
  const previewValues = calculatePreviewValues();

  // Define form fields
  const fields: UniversalEditField[] = [
    {
      key: 'start-time',
      label: 'Start Time',
      type: 'datetime-local',
      value: startTime,
      onChange: setStartTime,
      required: true,
    },
    {
      key: 'end-time', 
      label: 'End Time',
      type: 'datetime-local',
      value: endTime,
      onChange: setEndTime,
      required: true,
    },
    {
      key: 'walking-speed',
      label: 'Walking Speed (mph)',
      type: 'number',
      value: speed,
      onChange: setSpeed,
      min: 0.5,
      max: 15,
      step: 0.1,
      required: true,
    },
  ];

  // Define preview data
  const preview: UniversalEditPreview[] = [
    { label: 'New Duration', value: formatDuration(duration) },
    { label: 'Speed', value: `${speed} mph` },
    ...(recalculateValues && previewValues ? [
      { label: 'Distance', value: `${previewValues.distance.toFixed(2)} miles` },
      { label: 'Calories', value: previewValues.calories },
      { label: 'Steps', value: previewValues.steps.toLocaleString() },
    ] : []),
  ].filter(item => duration > 0);

  return (
    <UniversalHistoryEditModal
      isOpen={isOpen}
      onClose={onClose}
      onSave={handleSave}
      title="Edit Walking Session"
      fields={fields}
      preview={preview}
      recalculateOption={{
        enabled: true,
        label: "Recalculate values after editing",
        description: "Automatically recalculate calories, distance, and steps based on new values",
        checked: recalculateValues,
        onChange: setRecalculateValues,
      }}
      editReasonField={{
        value: editReason,
        onChange: setEditReason,
        placeholder: "e.g., Forgot to stop timer",
      }}
      isSaving={isSaving}
      saveDisabled={!startTime || !endTime || speed <= 0}
    />
  );
};