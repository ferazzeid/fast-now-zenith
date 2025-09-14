import { useState, useCallback, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Trash2, Edit3, Save, X, Eye, EyeOff } from "lucide-react";
import { CircularVoiceButton } from "@/components/CircularVoiceButton";
import { ConfirmationModal } from "@/components/ui/universal-modal";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { useStandardizedLoading } from "@/hooks/useStandardizedLoading";

interface Note {
  id: string;
  title: string;
  content: string;
  show_in_animations?: boolean;
}

interface NotesCardProps {
  note: Note;
  onUpdate: (id: string, updates: { title: string; content: string; show_in_animations?: boolean }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export const NotesCard = ({ note, onUpdate, onDelete }: NotesCardProps) => {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(note.title);
  const [editContent, setEditContent] = useState(note.content);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { isLoading: isUpdating, execute: executeUpdate } = useStandardizedLoading();
  const { isLoading: isToggling, execute: executeToggle } = useStandardizedLoading();
  
  // Local state for optimistic updates
  const [localShowInAnimations, setLocalShowInAnimations] = useState(note.show_in_animations !== false);

  // Sync with prop changes
  useEffect(() => {
    setEditTitle(note.title);
    setEditContent(note.content);
    setLocalShowInAnimations(note.show_in_animations !== false);
  }, [note.title, note.content, note.show_in_animations]);

  const handleSave = useCallback(async () => {
    if (!editTitle.trim() || !editContent.trim()) {
      toast({
        description: "Please fill in both title and content",
        variant: "destructive",
      });
      return;
    }

    await executeUpdate(async () => {
      await onUpdate(note.id, { 
        title: editTitle.trim(), 
        content: editContent.trim() 
      });
      // Exit edit mode after successful save
      setIsEditing(false);
      toast({
        description: "Note updated successfully",
      });
    }, {
      onError: () => {
        toast({
          description: "Failed to update note",
          variant: "destructive",
        });
      }
    });
  }, [note.id, editTitle, editContent, onUpdate, toast, executeUpdate]);

  const handleCancel = useCallback(() => {
    setEditTitle(note.title);
    setEditContent(note.content);
    setIsEditing(false);
  }, [note.title, note.content]);

  const handleDelete = useCallback(async () => {
    try {
      await onDelete(note.id);
      toast({
        description: "Note deleted successfully",
      });
    } catch (error) {
      toast({
        description: "Failed to delete note",
        variant: "destructive",
      });
    }
    setShowDeleteConfirm(false);
  }, [note.id, onDelete, toast]);

  const handleVoiceTranscription = useCallback((text: string) => {
    if (text.trim()) {
      setEditContent(prev => prev + (prev ? '\n' : '') + text.trim());
    }
  }, []);

  return (
    <Card className="group hover:shadow-md transition-all duration-200">
      <CardContent className="p-4">
        {isEditing ? (
          <div className="space-y-3">
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="Note title..."
              className="font-medium"
            />
            <div className="relative">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                placeholder="Write your note here..."
                className="min-h-[120px] resize-none pr-12"
              />
              <div className="absolute top-2 right-2">
                <CircularVoiceButton
                  onTranscription={handleVoiceTranscription}
                  size="sm"
                  isDisabled={isUpdating}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                disabled={isUpdating}
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isUpdating}
              >
                <Save className="h-4 w-4 mr-1" />
                Save
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-medium text-foreground leading-tight">
                {note.title}
              </h3>
              <div className="flex gap-1 opacity-100">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsEditing(true)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Edit note</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          if (isToggling) return; // Prevent double clicks
                          
                          const newValue = !localShowInAnimations;
                          
                          // Optimistic update - update UI immediately
                          setLocalShowInAnimations(newValue);
                          
                          await executeToggle(async () => {
                            await onUpdate(note.id, { 
                              title: note.title, 
                              content: note.content,
                              show_in_animations: newValue
                            });
                            
                            toast({
                              description: `Note ${newValue ? 'will show' : 'hidden from'} in timer animations`,
                            });
                          }, {
                            onError: (error) => {
                              // Rollback on error - restore original state
                              setLocalShowInAnimations(!newValue);
                              console.error('Failed to update animation setting:', error);
                              toast({
                                description: "Failed to update animation setting",
                                variant: "destructive",
                              });
                            }
                          });
                        }}
                        disabled={isToggling}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground transition-all duration-200"
                      >
                        {isToggling ? (
                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        ) : localShowInAnimations ? (
                          <Eye className="h-4 w-4" />
                        ) : (
                          <EyeOff className="h-4 w-4" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{localShowInAnimations !== false ? 'Hide from timer animations' : 'Show in timer animations'}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        onClick={() => setShowDeleteConfirm(true)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Delete note</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
            <p className="text-muted-foreground text-sm whitespace-pre-wrap leading-relaxed">
              {note.content}
            </p>
          </div>
        )}
      </CardContent>
      
      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Note"
        message="Are you sure you want to delete this note? This action cannot be undone."
        confirmText="Delete"
        variant="destructive"
      />
    </Card>
  );
};