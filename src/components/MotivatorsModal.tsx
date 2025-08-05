import { useState } from 'react';
import { X, Plus, Edit, Trash2, Image, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useMotivators } from '@/hooks/useMotivators';
import { MotivatorFormModal } from './MotivatorFormModal';
import { useToast } from '@/hooks/use-toast';

interface MotivatorsModalProps {
  onClose: () => void;
}

export const MotivatorsModal = ({ onClose }: MotivatorsModalProps) => {
  const { toast } = useToast();
  const { motivators, loading, createMotivator, updateMotivator, deleteMotivator, refreshMotivators } = useMotivators();
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingMotivator, setEditingMotivator] = useState(null);

  const handleCreateMotivator = async (motivatorData) => {
    try {
      await createMotivator({
        title: motivatorData.title,
        content: motivatorData.content,
        category: 'personal',
        imageUrl: motivatorData.imageUrl
      });
      
      setShowFormModal(false);
      refreshMotivators();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create motivator",
        variant: "destructive"
      });
    }
  };

  const handleEditMotivator = (motivator) => {
    setEditingMotivator(motivator);
  };

  const handleSaveMotivator = async (updatedMotivator) => {
    try {
      console.log('Updating motivator with ID:', updatedMotivator.id, 'Type:', typeof updatedMotivator.id);
      
      // Ensure we have a valid UUID
      if (!updatedMotivator.id || typeof updatedMotivator.id !== 'string') {
        throw new Error('Invalid motivator ID');
      }
      
      await updateMotivator(updatedMotivator.id, {
        title: updatedMotivator.title,
        content: updatedMotivator.content,
        imageUrl: updatedMotivator.imageUrl
      });
      
      setEditingMotivator(null);
      refreshMotivators();
    } catch (error) {
      console.error('Error updating motivator:', error);
      toast({
        title: "Error updating motivator",
        description: error.message || "Failed to update motivator",
        variant: "destructive"
      });
    }
  };

  const handleDeleteMotivator = async (motivatorId) => {
    try {
      await deleteMotivator(motivatorId);
      refreshMotivators();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete motivator",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-ceramic-plate rounded-3xl w-full max-w-md max-h-[85vh] border border-ceramic-rim shadow-2xl mt-4 flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-ceramic-rim">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-warm-text">My Motivators</h3>
            <p className="text-sm text-muted-foreground">
              Your personal collection of inspiration
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-muted/50 dark:hover:bg-muted/30 hover:scale-110 transition-all duration-200"
          >
            <X className="w-8 h-8" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Create New Button */}
          <Button 
            onClick={() => setShowFormModal(true)}
            className="w-full mb-6 bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create New Motivator
          </Button>

          {/* Motivators List */}
          {loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading your motivators...</p>
            </div>
          ) : motivators.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-warm-text mb-2">No motivators yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first motivator to stay inspired during your fasting journey
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {motivators.map((motivator) => (
                <Card key={motivator.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex">
                      {/* Image */}
                      <div className="w-20 h-20 bg-muted flex items-center justify-center flex-shrink-0">
                        {motivator.imageUrl ? (
                          <img 
                            src={motivator.imageUrl} 
                            alt={motivator.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Image className="w-8 h-8 text-muted-foreground" />
                        )}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-1">
                            <h3 className="font-semibold text-warm-text line-clamp-1">
                              {motivator.title}
                            </h3>
                            {motivator.content && (
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {motivator.content}
                              </p>
                            )}
                            {motivator.category && (
                              <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="text-xs">
                                  {motivator.category}
                                </Badge>
                              </div>
                            )}
                          </div>
                          
                          {/* Actions */}
                          <div className="flex gap-1 ml-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditMotivator(motivator)}
                              className="p-1 h-6 w-6 hover:bg-muted hover:text-foreground"
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="ghost" className="p-1 h-6 w-6 hover:bg-destructive/10 hover:text-destructive">
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Motivator</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete "{motivator.title}"? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteMotivator(motivator.id)}>
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Form Modals */}
        {showFormModal && (
          <MotivatorFormModal
            onSave={handleCreateMotivator}
            onClose={() => setShowFormModal(false)}
          />
        )}
        
        {editingMotivator && (
          <MotivatorFormModal
            motivator={editingMotivator}
            onSave={handleSaveMotivator}
            onClose={() => setEditingMotivator(null)}
          />
        )}
      </div>
    </div>
  );
};