import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Heart, Plus, Settings, Edit, Trash2, Image, Sparkles } from 'lucide-react';
import { MotivatorFormModal } from '@/components/MotivatorFormModal';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

const Motivators = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [motivators, setMotivators] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingMotivator, setEditingMotivator] = useState(null);

  // AI-powered motivator management
  const refreshMotivators = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase.functions.invoke('chat-completion', {
        body: {
          message: "Load all my motivators",
          action: "load_motivators"
        }
      });

      if (error) throw error;

      if (data.motivators) {
        setMotivators(data.motivators);
      }
    } catch (error) {
      console.error('Error loading motivators:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const createMotivator = useCallback(async (motivatorData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.functions.invoke('chat-completion', {
        body: {
          message: `Create a new motivator: "${motivatorData.title}" with content: "${motivatorData.content}"`,
          action: "create_motivator",
          motivator_data: motivatorData
        }
      });

      if (error) throw error;

      return { data: data.motivator, error: null };
    } catch (error) {
      console.error('Error creating motivator:', error);
      return { data: null, error };
    }
  }, []);

  const updateMotivator = useCallback(async (motivatorId, updates) => {
    try {
      const { data, error } = await supabase.functions.invoke('chat-completion', {
        body: {
          message: `Update motivator with title: "${updates.title}" and content: "${updates.content}"`,
          action: "update_motivator",
          motivator_id: motivatorId,
          updates: updates
        }
      });

      if (error) throw error;

      return { data: data.motivator, error: null };
    } catch (error) {
      console.error('Error updating motivator:', error);
      return { data: null, error };
    }
  }, []);

  const deleteMotivator = useCallback(async (motivatorId) => {
    try {
      const { data, error } = await supabase.functions.invoke('chat-completion', {
        body: {
          message: `Delete motivator`,
          action: "delete_motivator",
          motivator_id: motivatorId
        }
      });

      if (error) throw error;

      return { data: true, error: null };
    } catch (error) {
      console.error('Error deleting motivator:', error);
      return { data: null, error };
    }
  }, []);

  // Load initial data
  useEffect(() => {
    refreshMotivators();
  }, [refreshMotivators]);

  const handleCreateMotivator = async (motivatorData) => {
    try {
      await createMotivator({
        title: motivatorData.title,
        content: motivatorData.content,
        category: 'personal',
        imageUrl: motivatorData.imageUrl
      });
      
      setShowFormModal(false);
      
      toast({
        title: "✨ Motivator Created!",
        description: "Your new motivator has been saved.",
      });
      
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
      await updateMotivator(updatedMotivator.id, {
        title: updatedMotivator.title,
        content: updatedMotivator.content,
        imageUrl: updatedMotivator.imageUrl
      });
      
      setEditingMotivator(null);
      
      toast({
        title: "✨ Motivator Updated!",
        description: "Your changes have been saved.",
      });
      
      refreshMotivators();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update motivator",
        variant: "destructive"
      });
    }
  };

  const handleDeleteMotivator = async (motivatorId) => {
    try {
      await deleteMotivator(motivatorId);
      
      toast({
        title: "🗑️ Motivator Removed",
        description: "Motivator has been deleted.",
      });
      
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
    <div className="h-[calc(100vh-80px)] bg-ceramic-base overflow-y-auto">
      <div className="px-4 pt-8 pb-16">{/* CRITICAL FIX: Proper navigation spacing */}
        <div className="max-w-md mx-auto space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <Heart className="w-12 h-12 text-primary mx-auto" />
            <h1 className="text-3xl font-bold text-warm-text">My Motivators</h1>
            <p className="text-muted-foreground">
              Your personal collection of inspiration and motivation
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button 
              onClick={() => setShowFormModal(true)}
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create New
            </Button>
            <Button 
              onClick={() => navigate('/settings')}
              variant="outline"
              className="flex-1"
            >
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </div>

          {/* Motivators List */}
          {loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading your motivators...</p>
            </div>
          ) : motivators.length === 0 ? (
            <Card className="p-6 text-center">
              <div className="space-y-4">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                  <Sparkles className="w-8 h-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-warm-text mb-2">No motivators yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Create your first motivator to stay inspired during your fasting journey
                  </p>
                  <Button onClick={() => setShowFormModal(true)} className="bg-primary">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Motivator
                  </Button>
                </div>
              </div>
            </Card>
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
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="ghost">
                                  <Trash2 className="w-4 h-4" />
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
    </div>
  );
};

export default Motivators;