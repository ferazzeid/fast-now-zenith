import React, { useState, useEffect } from 'react';
import { UniversalHistoryEditModal, UniversalEditField, UniversalEditPreview } from '@/components/ui/universal-history-edit-modal';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Slider } from '@/components/ui/slider';

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
  const [startDay, setStartDay] = useState(0); // 0 for today, 1 for tomorrow, -1 for yesterday
  const [startHour, setStartHour] = useState(18); // Hour of the day (0-23)
  const [sessionStatus, setSessionStatus] = useState<'active' | 'completed' | 'cancelled' | 'incomplete'>('completed');
  const [editReason, setEditReason] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const fastingRatios = [
    { hours: 12, label: '12:12' },
    { hours: 14, label: '14:10' },
    { hours: 16, label: '16:8' },
    { hours: 18, label: '18:6' },
    { hours: 20, label: '20:4' },
    { hours: 21, label: '21:3' },
  ];

  const getDayLabel = (dayOffset: number) => {
    if (dayOffset === -1) return 'Yesterday';
    if (dayOffset === 0) return 'Today';
    if (dayOffset === 1) return 'Tomorrow';
    return `${dayOffset > 0 ? '+' : ''}${dayOffset} days`;
  };

  const formatHour = (hour: number) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:00 ${period}`;
  };

  useEffect(() => {
    if (session && isOpen) {
      setFastingHours(session.fasting_window_hours);
      setSessionStatus(session.status);
      setEditReason(session.edit_reason || '');
      
      // Extract start day and hour from existing data if available
      if (session.fasting_start_time) {
        const startTime = new Date(session.fasting_start_time);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const sessionDay = new Date(startTime);
        sessionDay.setHours(0, 0, 0, 0);
        
        const dayDiff = Math.round((sessionDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        setStartDay(dayDiff);
        setStartHour(startTime.getHours());
      }
    }
  }, [session, isOpen]);

  const handleSave = async () => {
    if (!session) return;

    setIsSaving(true);
    try {
      const eatingHours = 24 - fastingHours;
      
      // Calculate start and end times based on day/hour selection
      const baseDate = new Date();
      baseDate.setDate(baseDate.getDate() + startDay);
      baseDate.setHours(startHour, 0, 0, 0);
      
      const fastingStartTime = baseDate.toISOString();
      const fastingEndTime = new Date(baseDate.getTime() + fastingHours * 60 * 60 * 1000).toISOString();
      const eatingStartTime = fastingEndTime;
      const eatingEndTime = new Date(baseDate.getTime() + 24 * 60 * 60 * 1000).toISOString();

      const updateData: any = {
        fasting_window_hours: fastingHours,
        eating_window_hours: eatingHours,
        fasting_start_time: fastingStartTime,
        fasting_end_time: fastingEndTime,
        eating_start_time: eatingStartTime,
        eating_end_time: eatingEndTime,
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

  const eatingHours = 24 - fastingHours;
  const currentRatio = fastingRatios.find(r => r.hours === fastingHours);

  const fields: UniversalEditField[] = [
    {
      key: 'fasting_ratio',
      label: 'Fasting Ratio',
      type: 'custom',
      value: fastingHours,
      onChange: setFastingHours,
      customComponent: (
        <div className="space-y-4">
          <label className="text-sm font-medium">Fasting Ratio</label>
          <div className="px-2">
            <Slider
              value={[fastingHours]}
              onValueChange={([value]) => setFastingHours(value)}
              min={12}
              max={21}
              step={1}
              className="w-full"
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>12:12</span>
            <span className="font-medium text-foreground">
              {currentRatio ? currentRatio.label : `${fastingHours}:${eatingHours}`}
            </span>
            <span>21:3</span>
          </div>
          <div className="text-xs text-muted-foreground text-center">
            {fastingHours}h fasting, {eatingHours}h eating window
          </div>
        </div>
      ),
    },
    {
      key: 'start_day',
      label: 'Start Day',
      type: 'custom',
      value: startDay,
      onChange: setStartDay,
      customComponent: (
        <div className="space-y-2">
          <label className="text-sm font-medium">Start Day</label>
          <select
            value={startDay}
            onChange={(e) => setStartDay(parseInt(e.target.value))}
            className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background"
          >
            <option value={-1}>Yesterday</option>
            <option value={0}>Today</option>
            <option value={1}>Tomorrow</option>
          </select>
        </div>
      ),
    },
    {
      key: 'start_hour',
      label: 'Start Hour',
      type: 'custom',
      value: startHour,
      onChange: setStartHour,
      customComponent: (
        <div className="space-y-2">
          <label className="text-sm font-medium">Start Hour</label>
          <div className="px-2">
            <Slider
              value={[startHour]}
              onValueChange={([value]) => setStartHour(value)}
              min={0}
              max={23}
              step={1}
              className="w-full"
            />
          </div>
          <div className="text-center text-sm font-medium">
            {formatHour(startHour)}
          </div>
          <div className="text-xs text-muted-foreground text-center">
            Fast starts on {getDayLabel(startDay)} at {formatHour(startHour)}
          </div>
        </div>
      ),
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
            <option value="incomplete">Incomplete</option>
            {session.status === 'active' && <option value="active">Active (In Progress)</option>}
          </select>
        </div>
      ),
    },
  ];

  const preview: UniversalEditPreview[] = [
    {
      label: 'Fasting Schedule',
      value: `${fastingHours}:${eatingHours}`,
    },
    {
      label: 'Start Time',
      value: `${getDayLabel(startDay)} at ${formatHour(startHour)}`,
    },
    {
      label: 'Status',
      value: sessionStatus.charAt(0).toUpperCase() + sessionStatus.slice(1),
    },
  ];

  return (
    <UniversalHistoryEditModal
      isOpen={isOpen}
      onClose={onClose}
      onSave={handleSave}
      title="Edit Fasting Session"
      fields={fields}
      preview={preview}
      editReasonField={{
        value: editReason,
        onChange: setEditReason,
        placeholder: "e.g., Corrected fasting window, Updated start time",
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