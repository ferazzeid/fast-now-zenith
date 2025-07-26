import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, Plus, Settings, Edit, Trash2, Image, Sparkles } from 'lucide-react';
import { useMotivators } from '@/hooks/useMotivators';
import { MotivatorOnboarding } from '@/components/MotivatorOnboarding';
import { MotivatorCreationWizard } from '@/components/MotivatorCreationWizard';
import { EditMotivatorModal } from '@/components/EditMotivatorModal';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

const Motivators = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { motivators, loading, createMotivator, updateMotivator, deleteMotivator, refreshMotivators } = useMotivators();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showCreationWizard, setShowCreationWizard] = useState(false);
  const [selectedTemplates, setSelectedTemplates] = useState([]);
  const [editingMotivator, setEditingMotivator] = useState(null);

  useEffect(() => {
    // Show onboarding if user has no motivators
    if (!loading && motivators.length === 0) {
      setShowOnboarding(true);
    }
  }, [loading, motivators.length]);

  const handleOnboardingComplete = (templates) => {
    setSelectedTemplates(templates);
    setShowOnboarding(false);
    setShowCreationWizard(true);
  };

  const handleOnboardingSkip = () => {
    setShowOnboarding(false);
  };

  const handleCreationComplete = async (createdMotivators) => {
    try {
      for (const motivator of createdMotivators) {
        await createMotivator({
          title: motivator.title,
          content: motivator.content,
          category: motivator.category,
          imageUrl: motivator.imageUrl
        });
      }
      
      setShowCreationWizard(false);
      setSelectedTemplates([]);
      
      toast({
        title: "Success!",
        description: `Created ${createdMotivators.length} motivator(s)`,
      });
      
      refreshMotivators();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create motivators",
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
        content: updatedMotivator.description,
        imageUrl: updatedMotivator.imageUrl
      });
      
      setEditingMotivator(null);
      
      toast({
        title: "Success!",
        description: "Motivator updated successfully",
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
        title: "Success!",
        description: "Motivator deleted successfully",
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

  const startCreatingMotivators = () => {
    setShowOnboarding(true);
  };

  if (showOnboarding) {
    return (
      <div className="min-h-screen bg-ceramic-base safe-top safe-bottom">
        <MotivatorOnboarding 
          onComplete={handleOnboardingComplete}
          onSkip={handleOnboardingSkip}
        />
      </div>
    );
  }

  if (showCreationWizard) {
    return (
      <div className="min-h-screen bg-ceramic-base safe-top safe-bottom">
        <div className="px-4 pt-8 pb-24">
          <div className="max-w-md mx-auto">
            <MotivatorCreationWizard
              templates={selectedTemplates}
              onComplete={handleCreationComplete}
              onCancel={() => {
                setShowCreationWizard(false);
                setSelectedTemplates([]);
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ceramic-base safe-top safe-bottom">
      <div className="px-4 pt-8 pb-24">
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
              onClick={startCreatingMotivators}
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
                  <Button onClick={startCreatingMotivators} className="bg-primary">
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
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-xs">
                                {motivator.category}
                              </Badge>
                            </div>
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

          {/* Edit Modal */}
          {editingMotivator && (
            <EditMotivatorModal
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