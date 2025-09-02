import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { UniversalModal } from '@/components/ui/universal-modal';
import { PremiumGatedCircularVoiceButton } from '@/components/PremiumGatedCircularVoiceButton';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

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

      onSave(noteData);
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

  const handleVoiceTranscription = (transcription: string) => {
    if (transcription) {
      const newContent = content + (content ? ' ' : '') + transcription;
      setContent(newContent);
    }
  };

  return (
    <UniversalModal
      isOpen={isOpen}
      onClose={onClose}
      title={note?.id ? "Edit Note" : "Add Note"}
      size="md"
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground">
              Content
            </label>
            <PremiumGatedCircularVoiceButton
              onTranscription={handleVoiceTranscription}
              size="sm"
              isDisabled={isSubmitting}
            />
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

      <div className="flex justify-end gap-3 mt-6">
        <Button
          variant="outline"
          onClick={onClose}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={isSubmitting || !content.trim()}
        >
          {isSubmitting ? 'Saving...' : (note?.id ? 'Save Changes' : 'Add Note')}
        </Button>
      </div>
    </UniversalModal>
  );
}