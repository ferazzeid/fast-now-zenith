import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { UniversalModal } from '@/components/ui/universal-modal';
import { CircularVoiceButton } from '@/components/CircularVoiceButton';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { X, Save, Lock } from 'lucide-react';
import { useAccess } from '@/hooks/useAccess';
import { PremiumVoiceModal } from './PremiumVoiceModal';

interface Note {
  id?: string;
  title?: string;
  content?: string;
  show_in_animations?: boolean;
}

interface NoteFormModalProps {
  note?: Note;
  onSave: (noteData: Note) => void;
  onClose: () => void;
  isOpen: boolean;
}

export function NoteFormModal({ note, onSave, onClose, isOpen }: NoteFormModalProps) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const { hasAIAccess } = useAccess();

  useEffect(() => {
    if (note) {
      setContent(note.content || '');
    } else {
      setContent('');
    }
  }, [note]);

  const handleSave = async () => {
    if (!content.trim()) {
      toast({
        title: "Content Required",
        description: "Please enter some content for your note.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const noteData: Note = {
        content: content.trim(),
        title: content.trim().substring(0, 50) + (content.trim().length > 50 ? '...' : ''), // Auto-generate title from content
        show_in_animations: note?.show_in_animations ?? true
      };

      if (note?.id) {
        noteData.id = note.id;
        
        // Update existing note
        const { error } = await supabase
          .from('motivators')
          .update({
            content: noteData.content,
            title: noteData.title,
          })
          .eq('id', note.id);

        if (error) throw error;
        toast({
          title: "Note Updated",
          description: "Your note has been updated successfully.",
        });
      }

      // Call onSave to update parent state immediately
      onSave(noteData);
      
      // Close modal after successful save and state update
      onClose();
    } catch (error) {
      console.error('Error saving note:', error);
      toast({
        title: "Error",
        description: "Failed to save note. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVoiceClick = () => {
    if (!hasAIAccess) {
      setShowPremiumModal(true);
      return;
    }
    setIsProcessingVoice(true);
  };

  const handleVoiceTranscription = (transcription: string) => {
    setIsProcessingVoice(false);
    if (transcription) {
      const newContent = content + (content ? ' ' : '') + transcription;
      setContent(newContent);
    }
  };

  const handleVoiceStart = () => {
    setIsProcessingVoice(true);
  };

  return (
    <UniversalModal
      isOpen={isOpen}
      onClose={onClose}
      title={note?.id ? "Edit Note" : "Add Note"}
      size="md"
      footer={
        <>
          <Button
            variant="soft"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1"
          >
            <X className="w-4 h-4" />
          </Button>
          <Button
            variant="action-primary"
            onClick={handleSave}
            disabled={isSubmitting || !content.trim()}
            className="flex-1"
          >
            {isSubmitting ? 'Saving...' : (note?.id ? 'Update' : 'Create')}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground">
              Content
            </label>
            <div className="flex items-center gap-2">
              {isProcessingVoice && (
                <span className="text-xs text-muted-foreground">Processing voice...</span>
              )}
              {hasAIAccess ? (
                <CircularVoiceButton
                  onTranscription={handleVoiceTranscription}
                  size="sm"
                  isDisabled={isSubmitting || isProcessingVoice}
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
          </div>
          <Textarea
            placeholder="Write your note here..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[200px] resize-none"
            disabled={isSubmitting}
          />
        </div>
      </div>

      {/* Premium Modal for free users */}
      <PremiumVoiceModal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
      />
    </UniversalModal>
  );
}