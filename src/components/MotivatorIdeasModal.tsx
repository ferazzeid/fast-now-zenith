import { useState, useEffect } from 'react';
import { Heart, Edit, Trash2, ChevronDown, ChevronRight, Lightbulb, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { UniversalModal } from '@/components/ui/universal-modal';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAdminGoalIdeas, AdminGoalIdea } from '@/hooks/useAdminGoalIdeas';
import { useAdminGoalManagement } from '@/hooks/useAdminGoalManagement';
import { useProfileQuery } from '@/hooks/useProfileQuery';
import { useAdminRole } from '@/hooks/useAdminRole';
import { MotivatorImageWithFallback } from '@/components/MotivatorImageWithFallback';
import { useToast } from '@/hooks/use-toast';

interface MotivatorIdeasModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectGoal: (goal: AdminGoalIdea) => void;
  onEditGoal?: (goal: AdminGoalIdea) => void;
}

export const MotivatorIdeasModal = ({ isOpen, onClose, onSelectGoal, onEditGoal }: MotivatorIdeasModalProps) => {
  const [expandedGoal, setExpandedGoal] = useState<string | null>(null);
  const { goalIdeas, loading, forceRefresh } = useAdminGoalIdeas();
  const { removeFromDefaultGoals } = useAdminGoalManagement();
  const { profile } = useProfileQuery();
  const { isAdmin } = useAdminRole();
  const { toast } = useToast();

  // Force refresh when modal opens
  useEffect(() => {
    if (isOpen) {
      console.log('🔄 Modal opened, forcing refresh of goal ideas...');
      forceRefresh();
    }
  }, [isOpen, forceRefresh]);

  const handleDeleteGoal = async (goalId: string) => {
    try {
      await removeFromDefaultGoals(goalId);
      forceRefresh();
    } catch (error) {
      console.error('Error deleting goal:', error);
      toast({
        title: "Error",
        description: "Failed to delete goal idea.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <UniversalModal
        isOpen={isOpen}
        onClose={onClose}
        title="Browse Goal Ideas"
        variant="standard"
        size="lg"
        showCloseButton={true}
      >
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="border-ceramic-rim">
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
      </UniversalModal>
    );
  }

  // Filter goals by user's sex
  const filteredGoals = goalIdeas.filter(goal => {
    // If user hasn't set their sex, show all goals
    if (!profile?.sex) return true;
    // Filter by user's sex
    return goal.gender === profile.sex;
  });

  return (
    <UniversalModal
      isOpen={isOpen}
      onClose={onClose}
      title="Browse Goal Ideas"
      variant="standard"
      size="lg"
      showCloseButton={true}
    >
      <div className="max-h-96 overflow-y-auto space-y-4">
        {filteredGoals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Lightbulb className="w-12 h-12 text-muted-foreground mb-3" />
            <h3 className="text-lg font-medium text-warm-text mb-2">No Ideas Found</h3>
            <p className="text-sm text-muted-foreground">
              {!profile?.sex 
                ? "Ask an admin to add some goal ideas for inspiration!"
                : `No goal ideas found for ${profile.sex}s. Ask an admin to add some!`
              }
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredGoals.map((goal) => {
              const isExpanded = expandedGoal === goal.id;
              
              return (
                <Card key={goal.id} className="border-ceramic-rim transition-colors">
                  <CardContent className="p-4">
                    <div 
                      className="cursor-pointer"
                      onClick={() => setExpandedGoal(isExpanded ? null : goal.id)}
                    >
                      <div className="flex gap-3">
                        {goal.imageUrl && (
                          <div className="w-12 h-12 flex-shrink-0">
                            <MotivatorImageWithFallback
                              src={goal.imageUrl}
                              alt={goal.title}
                              className="w-full h-full object-cover rounded"
                            />
                          </div>
                        )}
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start">
                            <h3 className="font-semibold text-warm-text">
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
                                      onSelectGoal(goal);
                                    }}
                                    className="h-8 w-8 p-0 hover:bg-primary/10"
                                  >
                                    <Heart className="h-4 w-4 text-primary" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Add to My Goals</p>
                                </TooltipContent>
                              </Tooltip>

                              {isAdmin && onEditGoal && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onEditGoal(goal);
                                      }}
                                      className="h-8 w-8 p-0 hover:bg-primary/10"
                                    >
                                      <Edit className="h-4 w-4 text-primary" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Edit Goal</p>
                                  </TooltipContent>
                                </Tooltip>
                              )}

                              {isAdmin && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={(e) => e.stopPropagation()}
                                      className="h-8 w-8 p-0 hover:bg-destructive/10"
                                    >
                                      <Trash2 className="h-4 w-4 text-destructive" />
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
                                        onClick={() => handleDeleteGoal(goal.id)}
                                        className="bg-destructive hover:bg-destructive/90"
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}
                            </div>
                          </div>
                          
                          <div className="space-y-2 mt-2">
                            <p className={`text-sm text-muted-foreground leading-relaxed ${isExpanded ? '' : 'line-clamp-3'}`}>
                              {goal.description}
                            </p>
                            
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-xs bg-muted text-muted-foreground">
                                {goal.category}
                              </Badge>
                              
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedGoal(isExpanded ? null : goal.id);
                                }}
                                className="text-xs text-muted-foreground hover:text-warm-text flex items-center gap-1"
                              >
                                {isExpanded ? (
                                  <>
                                    <ChevronDown className="w-3 h-3" />
                                    Show less
                                  </>
                                ) : (
                                  <>
                                    <ChevronRight className="w-3 h-3" />
                                    Show more
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </UniversalModal>
  );
};