import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePageSEO } from '@/hooks/usePageSEO';
import { useAdminGoalIdeas, AdminGoalIdea } from '@/hooks/useAdminGoalIdeas';
import { useAdminGoalManagement } from '@/hooks/useAdminGoalManagement';
import { useMotivators } from '@/hooks/useMotivators';
import { useAdminRole } from '@/hooks/useAdminRole';
import { MotivatorImageWithFallback } from '@/components/MotivatorImageWithFallback';
import { AdminGoalEditModal } from '@/components/AdminGoalEditModal';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Plus, ArrowLeft, Heart, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function MotivatorIdeas() {
  usePageSEO({
    title: 'Motivator Ideas Library',
    description: 'Browse motivator ideas and add them to your goals.',
    canonicalPath: '/motivator-ideas',
  });

  const { goalIdeas, loading: goalIdeasLoading, forceRefresh } = useAdminGoalIdeas();
  const { removeFromDefaultGoals, updateDefaultGoal } = useAdminGoalManagement();
  const { createMotivator } = useMotivators();
  const { isAdmin } = useAdminRole();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [editingGoal, setEditingGoal] = useState<AdminGoalIdea | null>(null);

  // Force refresh on mount
  useEffect(() => {
    forceRefresh();
  }, [forceRefresh]);

  const handleAdd = async (goal: AdminGoalIdea) => {
    console.log('📝 Adding goal idea to personal motivators:', goal.title);
    try {
      const motivator = {
        id: crypto.randomUUID(),
        title: goal.title,
        content: goal.description,
        category: goal.category || 'personal',
        imageUrl: goal.imageUrl || undefined,
      };

      await createMotivator(motivator);
      
      toast({
        title: "Goal Added",
        description: `"${goal.title}" has been added to your personal goals.`,
      });
    } catch (error) {
      console.error('❌ Error adding goal idea:', error);
      toast({
        title: "Error",
        description: "Failed to add goal idea to your personal goals.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (goal: AdminGoalIdea) => {
    setEditingGoal(goal);
  };

  const handleSaveEdit = async (updatedGoal: AdminGoalIdea) => {
    try {
      const success = await updateDefaultGoal(updatedGoal.id, updatedGoal);
      if (success) {
        toast({
          title: "Goal Updated",
          description: "Goal idea has been updated successfully.",
        });
        forceRefresh();
      }
    } catch (error) {
      console.error('❌ Error updating goal idea:', error);
      toast({
        title: "Error",
        description: "Failed to update goal idea.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (goalId: string) => {
    try {
      const success = await removeFromDefaultGoals(goalId);
      if (success) {
        toast({
          title: "Goal Deleted",
          description: "Goal idea has been removed from the default list.",
        });
        forceRefresh();
      }
    } catch (error) {
      console.error('❌ Error deleting goal idea:', error);
      toast({
        title: "Error",
        description: "Failed to delete goal idea.",
        variant: "destructive",
      });
    }
  };


  if (goalIdeasLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ceramic-base to-stone-50 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-6">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-8 w-48" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-8 w-16" />
                    </div>
                    <Skeleton className="h-12 w-12 rounded" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-8 w-24" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-ceramic-base to-stone-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate('/')}
            className="hover:bg-ceramic-rim"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold text-warm-text">Motivator Ideas</h1>
        </div>

        {goalIdeas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                <Plus className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-warm-text">No Motivator Ideas Yet</h3>
              <p className="text-muted-foreground max-w-md">
                {isAdmin 
                  ? "Start by creating some motivator ideas that users can add to their goals."
                  : "Ask an admin to add some goal ideas for inspiration!"
                }
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {goalIdeas.map((goal) => (
              <Card key={goal.id} className="overflow-hidden border-ceramic-rim transition-all duration-200 hover:shadow-md">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-warm-text text-sm">
                      {goal.title}
                      {isAdmin && (
                        <span className="ml-1 text-xs">
                          {goal.gender === 'male' ? '🔵' : '🔴'}
                        </span>
                      )}
                    </h3>
                    <div className="flex gap-1 ml-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAdd(goal);
                            }}
                            className="h-7 w-7 p-0 hover:bg-primary/10"
                          >
                            <Heart className="h-3 w-3 text-primary" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Add to My Goals</p>
                        </TooltipContent>
                      </Tooltip>

                      {isAdmin && (
                        <>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEdit(goal);
                                }}
                                className="h-7 w-7 p-0 hover:bg-primary/10"
                              >
                                <Edit className="h-3 w-3 text-primary" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Edit Goal</p>
                            </TooltipContent>
                          </Tooltip>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => e.stopPropagation()}
                                className="h-7 w-7 p-0 hover:bg-destructive/10"
                              >
                                <Trash2 className="h-3 w-3 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Goal Idea</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{goal.title}"? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDelete(goal.id)}
                                  className="bg-destructive hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    {goal.imageUrl && (
                      <div className="w-12 h-12">
                        <MotivatorImageWithFallback
                          src={goal.imageUrl}
                          alt={goal.title}
                          className="w-full h-full object-cover rounded"
                        />
                      </div>
                    )}
                    
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {goal.description}
                    </p>

                    <Badge variant="secondary" className="text-xs bg-muted text-muted-foreground">
                      {goal.category}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {editingGoal && (
        <AdminGoalEditModal
          goal={editingGoal}
          onSave={handleSaveEdit}
          onClose={() => setEditingGoal(null)}
        />
      )}
    </div>
  );
}