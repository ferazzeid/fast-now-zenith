import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { SimpleVoiceRecorder } from '@/components/SimpleVoiceRecorder';
import { Mic, Save, Edit3, X, Check } from 'lucide-react';
import { useAdminRole } from '@/hooks/useAdminRole';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useFastingSession } from '@/hooks/useFastingSession';
import { useQueryClient } from '@tanstack/react-query';
import { fastingHoursKey } from '@/hooks/optimized/useFastingHoursQuery';

interface AdminPersonalLogInterfaceProps {
  currentHour: number;
  existingLog?: string;
  onLogSaved?: () => void;
}

export const AdminPersonalLogInterface: React.FC<AdminPersonalLogInterfaceProps> = ({
  currentHour,
  existingLog = '',
  onLogSaved
}) => {
  const { isAdmin } = useAdminRole();
  const { toast } = useToast();
  const { currentSession } = useFastingSession();
  const queryClient = useQueryClient();
  const [logText, setLogText] = useState(existingLog);
  const [isEditing, setIsEditing] = useState(!existingLog);
  const [isSaving, setIsSaving] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);

  // Sync local state with prop changes
  useEffect(() => {
    console.log('🔄 AdminPersonalLogInterface: existingLog changed:', { existingLog, currentHour });
    setLogText(existingLog || '');
    setIsEditing(!existingLog); // Only edit mode if no existing log
  }, [existingLog, currentHour]);

  // Don't show for non-admins
  if (!isAdmin) return null;

  const calculateCurrentFastingHour = (): number => {
    if (!currentSession?.start_time) return 1;
    const startTime = new Date(currentSession.start_time);
    const now = new Date();
    const hoursPassed = Math.floor((now.getTime() - startTime.getTime()) / (1000 * 60 * 60));
    return Math.max(1, Math.min(hoursPassed + 1, 72));
  };

  const getCurrentHour = (): number => {
    // If actively fasting, use calculated hour, otherwise use the selected hour from timeline
    return currentSession?.status === 'active' ? calculateCurrentFastingHour() : currentHour;
  };

  const handleSaveLog = async () => {
    setIsSaving(true);
    try {
      const hourToUpdate = getCurrentHour();
      
      console.log('🔧 ADMIN LOG SAVE DEBUG:', {
        hourToUpdate,
        logText: logText.trim(),
        logTextLength: logText.trim().length,
        userId: currentSession?.user_id
      });
      
      const { data, error } = await supabase
        .from('fasting_hours')
        .update({ admin_personal_log: logText.trim() || null })
        .eq('hour', hourToUpdate)
        .select('*');

      console.log('🔧 SUPABASE UPDATE RESULT:', { data, error });

      if (error) throw error;

      toast({
        title: "Personal log saved",
        description: `Hour ${hourToUpdate} log updated successfully`,
      });

      setIsEditing(false);
      
      // Invalidate the fasting hours query to refresh data immediately
      await queryClient.invalidateQueries({ queryKey: fastingHoursKey });
      
      onLogSaved?.();
    } catch (error) {
      console.error('Error saving personal log:', error);
      toast({
        title: "Error saving log",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleVoiceTranscription = (text: string) => {
    setLogText(prevText => {
      const newText = prevText ? `${prevText} ${text}` : text;
      return newText;
    });
    setShowVoiceRecorder(false);
    if (!isEditing) setIsEditing(true);
  };

  const activeHour = getCurrentHour();
  const isCurrentlyFasting = currentSession?.status === 'active';

  return (
    <div className="mt-4 p-4 rounded-md border bg-card/50 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-medium text-foreground">
            Admin Personal Log
          </h4>
          <div className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">
            Hour {activeHour}
            {isCurrentlyFasting && currentHour === activeHour && (
              <span className="ml-1 text-accent">● Live</span>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          {!isEditing && logText && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="h-7 w-7 p-0"
            >
              <Edit3 className="h-3 w-3" />
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowVoiceRecorder(!showVoiceRecorder)}
            className="h-7 w-7 p-0"
            disabled={!isEditing}
          >
            <Mic className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {showVoiceRecorder && isEditing && (
        <div className="mb-3 p-3 rounded border bg-muted/30">
          <div className="text-xs text-muted-foreground mb-2">Voice Recording</div>
          <SimpleVoiceRecorder
            onTranscription={handleVoiceTranscription}
            isDisabled={isSaving}
          />
        </div>
      )}

      {isEditing ? (
        <div className="space-y-3">
          <Textarea
            value={logText}
            onChange={(e) => setLogText(e.target.value)}
            placeholder={`Record your experience at hour ${activeHour} of your fast...`}
            className="min-h-[80px] text-sm resize-none"
            disabled={isSaving}
          />
          
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setLogText(existingLog);
                setIsEditing(false);
                setShowVoiceRecorder(false);
              }}
              disabled={isSaving}
              className="h-7 px-3"
            >
              <X className="h-3 w-3 mr-1" />
              Cancel
            </Button>
            
            <Button
              size="sm"
              onClick={handleSaveLog}
              disabled={isSaving}
              className="h-7 px-3"
            >
              <Save className="h-3 w-3 mr-1" />
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {logText ? (
            <div className="text-sm text-foreground p-3 rounded border bg-muted/20">
              {logText}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground italic p-3 rounded border bg-muted/10">
              No personal log for hour {activeHour} yet. Click the edit button or mic to add one.
            </div>
          )}
        </div>
      )}
    </div>
  );
};