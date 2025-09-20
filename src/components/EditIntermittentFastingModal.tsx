import React, { useState, useEffect } from 'react';
import { UniversalHistoryEditModal, UniversalEditField, UniversalEditPreview, formatForDateTimeInput } from '@/components/ui/universal-history-edit-modal';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface IntermittentFastingSession {
  id: string;
  user_id: string;
  session_date: string;
  fasting_window_hours: number;
  eating_window_hours: number;
  fasting_start_time: string | null;
  fasting_end_time: string | null;
  eating_start_time: string | null;
  eating_end_time: string | null;
  completed: boolean;
  status: 'active' | 'completed' | 'cancelled' | 'incomplete';
  is_edited?: boolean;
  edit_reason?: string;
  original_fasting_window_hours?: number;
  original_eating_window_hours?: number;
  original_fasting_start_time?: string;
  original_eating_start_time?: string;
}

interface EditIntermittentFastingModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: IntermittentFastingSession | null;
  onSessionUpdated: () => void;
}

export const EditIntermittentFastingModal: React.FC<EditIntermittentFastingModalProps> = ({
  isOpen,
  onClose,
  session,
  onSessionUpdated,
}) => {
  const [fastingHours, setFastingHours] = useState(16);
  const [eatingHours, setEatingHours] = useState(8);
  const [fastingStartTime, setFastingStartTime] = useState('');
  const [fastingEndTime, setFastingEndTime] = useState('');
  const [eatingStartTime, setEatingStartTime] = useState('');
  const [eatingEndTime, setEatingEndTime] = useState('');
  const [sessionStatus, setSessionStatus] = useState<'active' | 'completed' | 'cancelled' | 'incomplete'>('completed');
  const [editReason, setEditReason] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // Preset options for fasting windows
  const fastingPresets = [
    { hours: 12, label: '12:12' },
    { hours: 14, label: '14:10' },
    { hours: 16, label: '16:8' },
    { hours: 18, label: '18:6' },
    { hours: 20, label: '20:4' },
    { hours: 22, label: '22:2' },
  ];

  useEffect(() => {
    if (session && isOpen) {
      setFastingHours(session.fasting_window_hours);
      setEatingHours(session.eating_window_hours);
      setFastingStartTime(session.fasting_start_time ? formatForDateTimeInput(session.fasting_start_time) : '');
      setFastingEndTime(session.fasting_end_time ? formatForDateTimeInput(session.fasting_end_time) : '');
      setEatingStartTime(session.eating_start_time ? formatForDateTimeInput(session.eating_start_time) : '');
      setEatingEndTime(session.eating_end_time ? formatForDateTimeInput(session.eating_end_time) : '');
      setSessionStatus(session.status);
      setEditReason(session.edit_reason || '');
    }
  }, [session, isOpen]);

  // Auto-calculate eating hours when fasting hours change
  useEffect(() => {
    setEatingHours(24 - fastingHours);
  }, [fastingHours]);

  const handleSave = async () => {
    if (!session) return;

    setIsSaving(true);
    try {
      // Store original values if this is the first edit
      const updateData: any = {
        fasting_window_hours: fastingHours,
        eating_window_hours: eatingHours,
        fasting_start_time: fastingStartTime || null,
        fasting_end_time: fastingEndTime || null,
        eating_start_time: eatingStartTime || null,
        eating_end_time: eatingEndTime || null,
        status: sessionStatus,
        completed: sessionStatus === 'completed',
        is_edited: true,
        edit_reason: editReason.trim() || null,
        updated_at: new Date().toISOString(),
      };

      // Store original values if this is the first edit
      if (!session.is_edited) {
        updateData.original_fasting_window_hours = session.fasting_window_hours;
        updateData.original_eating_window_hours = session.eating_window_hours;
        updateData.original_fasting_start_time = session.fasting_start_time;
        updateData.original_eating_start_time = session.eating_start_time;
      }

      const { error } = await supabase
        .from('intermittent_fasting_sessions')
        .update(updateData)
        .eq('id', session.id);

      if (error) throw error;

      toast({
        title: "Session Updated",
        description: "Intermittent fasting session has been updated successfully.",
      });

      onSessionUpdated();
      onClose();
    } catch (error) {
      console.error('Error updating IF session:', error);
      toast({
        title: "Error",
        description: "Failed to update intermittent fasting session. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!session) return null;

  const fields: UniversalEditField[] = [
    {
      key: 'fasting_preset',
      label: 'Fasting Schedule',
      type: 'custom',
      value: fastingHours,
      onChange: setFastingHours,
      customComponent: (
        <div className="space-y-2">
          <label className="text-sm font-medium">Fasting Schedule</label>
          <div className="grid grid-cols-3 gap-2">
            {fastingPresets.map((preset) => (
              <button
                key={preset.hours}
                type="button"
                className={`px-3 py-2 text-sm rounded-md border transition-colors ${
                  fastingHours === preset.hours
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background border-border hover:bg-muted'
                }`}
                onClick={() => setFastingHours(preset.hours)}
              >
                {preset.label}
              </button>
            ))}
          </div>
          <div className="text-xs text-muted-foreground">
            {fastingHours}h fasting, {eatingHours}h eating window
          </div>
        </div>
      ),
    },
    {
      key: 'fasting_start_time',
      label: 'Fasting Start Time',
      type: 'datetime-local',
      value: fastingStartTime,
      onChange: setFastingStartTime,
      placeholder: 'When did the fast begin?',
    },
    {
      key: 'fasting_end_time',
      label: 'Fasting End Time',
      type: 'datetime-local',
      value: fastingEndTime,
      onChange: setFastingEndTime,
      placeholder: 'When did the fast end?',
    },
    {
      key: 'eating_start_time',
      label: 'Eating Start Time',
      type: 'datetime-local',
      value: eatingStartTime,
      onChange: setEatingStartTime,
      placeholder: 'When did eating begin?',
    },
    {
      key: 'eating_end_time',
      label: 'Eating End Time',
      type: 'datetime-local',
      value: eatingEndTime,
      onChange: setEatingEndTime,
      placeholder: 'When did eating end?',
    },
    {
      key: 'status',
      label: 'Session Status',
      type: 'custom',
      value: sessionStatus,
      onChange: setSessionStatus,
      customComponent: (
        <div className="space-y-2">
          <label className="text-sm font-medium">Session Status</label>
          <select
            value={sessionStatus}
            onChange={(e) => setSessionStatus(e.target.value as any)}
            className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background"
          >
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="incomplete">Incomplete</option>
            {session.status === 'active' && <option value="active">Active</option>}
          </select>
        </div>
      ),
    },
  ];

  const calculateDuration = () => {
    if (fastingStartTime && fastingEndTime) {
      const start = new Date(fastingStartTime);
      const end = new Date(fastingEndTime);
      const diffHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      return diffHours > 0 ? diffHours : 0;
    }
    return 0;
  };

  const preview: UniversalEditPreview[] = [
    {
      label: 'Schedule',
      value: `${fastingHours}:${eatingHours}`,
    },
    {
      label: 'Status',
      value: sessionStatus.charAt(0).toUpperCase() + sessionStatus.slice(1),
    },
    ...(fastingStartTime && fastingEndTime ? [{
      label: 'Fasting Duration',
      value: calculateDuration(),
      format: (hours: number) => hours > 0 ? `${hours.toFixed(1)}h` : 'Not calculated',
    }] : []),
  ];

  return (
    <UniversalHistoryEditModal
      isOpen={isOpen}
      onClose={onClose}
      onSave={handleSave}
      title="Edit Intermittent Fasting Session"
      fields={fields}
      preview={preview}
      editReasonField={{
        value: editReason,
        onChange: setEditReason,
        placeholder: "e.g., Corrected fasting window, Updated times",
      }}
      warningMessage={
        session.status === 'active' ? {
          title: "Editing Active Session",
          description: "This session is currently active. Changes may affect ongoing tracking.",
        } : undefined
      }
      isSaving={isSaving}
    />
  );
};