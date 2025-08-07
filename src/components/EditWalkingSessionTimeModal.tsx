import React, { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Clock, AlertTriangle } from 'lucide-react';

interface WalkingSession {
  id: string;
  start_time: string;
  end_time?: string;
  duration_minutes?: number;
  calories_burned?: number;
  distance?: number;
  estimated_steps?: number;
  is_edited?: boolean;
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

  // Convert UTC times to local datetime-local format
  const formatForInput = (isoString: string) => {
    const date = parseISO(isoString);
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return localDate.toISOString().slice(0, 16);
  };

  const [startTime, setStartTime] = useState(
    session.start_time ? formatForInput(session.start_time) : ''
  );
  const [endTime, setEndTime] = useState(
    session.end_time ? formatForInput(session.end_time) : ''
  );
  const [editReason, setEditReason] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const calculateDuration = () => {
    if (!startTime || !endTime) return 0;
    const start = new Date(startTime);
    const end = new Date(endTime);
    return Math.round((end.getTime() - start.getTime()) / (1000 * 60));
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

      const { error } = await supabase
        .from('walking_sessions')
        .update({
          start_time: start.toISOString(),
          end_time: end.toISOString(),
          duration_minutes: newDuration,
          is_edited: true,
          original_duration_minutes: session.is_edited ? session.duration_minutes : originalDuration,
          edit_reason: editReason || null,
          // Null out calculated fields
          calories_burned: null,
          distance: null,
          estimated_steps: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', session.id)
        .eq('user_id', user.id);

      if (error) throw error;

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['walking-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['daily-deficit'] });
      queryClient.invalidateQueries({ queryKey: ['walking-calories'] });

      toast({
        title: "Session Updated",
        description: "Walking session time has been updated. Calculated data has been removed.",
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
  const formattedDuration = duration > 0 ? `${Math.floor(duration / 60)}h ${duration % 60}m` : '0m';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Edit Walking Time
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-amber-800">
              <p className="font-medium mb-1">Editing will remove calculated data</p>
              <p>Calories, distance, and steps will be nulled out and excluded from deficit calculations.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-time">Start Time</Label>
              <Input
                id="start-time"
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end-time">End Time</Label>
              <Input
                id="end-time"
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          {duration > 0 && (
            <div className="text-sm text-muted-foreground">
              <strong>New Duration:</strong> {formattedDuration}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="edit-reason">Edit Reason (Optional)</Label>
            <Textarea
              id="edit-reason"
              placeholder="e.g., Forgot to stop timer"
              value={editReason}
              onChange={(e) => setEditReason(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !startTime || !endTime}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};