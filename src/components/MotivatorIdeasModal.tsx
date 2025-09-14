import { useState, useEffect } from 'react';
import { UniversalModal } from '@/components/ui/universal-modal';
import { Lightbulb, Plus, ChevronDown, Edit, Trash2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAdminGoalIdeas, AdminGoalIdea } from '@/hooks/useAdminGoalIdeas';
import { MotivatorImageWithFallback } from '@/components/MotivatorImageWithFallback';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';

interface MotivatorIdeasModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectGoal: (goal: AdminGoalIdea) => void;
  onEditGoal?: (goal: AdminGoalIdea) => void;
}

export const MotivatorIdeasModal = ({ isOpen, onClose, onSelectGoal, onEditGoal }: MotivatorIdeasModalProps) => {
  const [expandedGoal, setExpandedGoal] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [goalToDelete, setGoalToDelete] = useState<AdminGoalIdea | null>(null);
  const { goalIdeas, loading, refreshGoalIdeas, removeGoalIdea } = useAdminGoalIdeas();
  const { user } = useAuth();

  useEffect(() => {
    const checkAdminRole = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase.rpc('is_current_user_admin');
        
        if (error) throw error;
        setIsAdmin(data || false);
      } catch (error) {
        console.error('Error checking admin role:', error);
        setIsAdmin(false);
      }
    };

    checkAdminRole();
  }, [user]);

  // Refresh list every time the modal opens to show latest changes
  useEffect(() => {
    if (isOpen) {
      refreshGoalIdeas();
    }
  }, [isOpen, refreshGoalIdeas]);

  const handleDeleteGoal = async (goalId: string) => {
    await removeGoalIdea(goalId);
  };

  if (loading) {
    return (
      <UniversalModal
        isOpen={isOpen}
        onClose={onClose}
        title="Motivator Ideas"
        variant="standard"
        size="md"
        showCloseButton={true}
      >
          <div className="space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-4 h-4 bg-muted animate-pulse rounded" />
              <div className="h-4 bg-muted animate-pulse rounded w-32" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="p-3 border border-ceramic-rim rounded-lg">
                  <div className="space-y-2">
                    <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                    <div className="h-3 bg-muted animate-pulse rounded w-full" />
                    <div className="h-3 bg-muted animate-pulse rounded w-1/2" />
                    <div className="h-5 bg-muted animate-pulse rounded w-16" />
                  </div>
                </div>
              ))}
            </div>
          </div>
      </UniversalModal>
    );
  }

  return (
    <UniversalModal
      isOpen={isOpen}
      onClose={onClose}
      title="Motivator Ideas"
      variant="standard"
      size="full"
      showCloseButton={true}
    >
        <ErrorBoundary
          fallback={
            <div className="text-center py-8">
              <AlertTriangle className="w-12 h-12 text-destructive mx-auto mb-2" />
              <p className="text-muted-foreground mb-4">Error loading goal ideas</p>
              <Button onClick={() => window.location.reload()} variant="outline" size="sm">
                Refresh Page
              </Button>
            </div>
          }
        >
        <div className="space-y-4 py-2">
          {/* Goal Ideas List */}
          <div className="max-h-[60vh] overflow-y-auto space-y-3 pr-2">
            {goalIdeas.length === 0 ? (
              <div className="text-center py-8">
                <Lightbulb className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No motivator ideas found</p>
              </div>
            ) : (
              goalIdeas.map((goal) => {
                const isExpanded = expandedGoal === goal.id;
                
                // Create excerpt from full description (first 150 characters)
                const excerpt = goal.description && goal.description.length > 150 
                  ? goal.description.substring(0, 150) + '...' 
                  : goal.description;
                
                const shouldShowExpandButton = goal.description && goal.description.length > 150;
                
                return (
                  <Card key={goal.id} className="overflow-hidden border border-ceramic-rim">
                    <CardContent className="p-0">
                      <div className="flex min-h-[128px]">
                        {/* Image */}
                        <div className="w-32 h-32 flex-shrink-0">
                          <MotivatorImageWithFallback
                            src={goal.imageUrl}
                            alt={goal.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                       
                        {/* Content */}
                        <div className="flex-1 p-4 flex flex-col justify-between">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-warm-text text-base leading-tight">
                                  {goal.title}
                                </h3>
                                
                                 {goal.description && (
                                   <div className="text-sm text-muted-foreground mt-1">
                                     {isExpanded ? (
                                       <p className="whitespace-pre-wrap leading-relaxed">{goal.description}</p>
                                     ) : (
                                       <p className="line-clamp-2 leading-relaxed">{excerpt}</p>
                                     )}
                                   </div>
                                 )}
                              </div>
                              
                              {/* Action Buttons */}
                              <div className="flex flex-col gap-1.5 flex-shrink-0">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onSelectGoal(goal);
                                        onClose();
                                      }}
                                      className="h-8 w-8 p-0 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground"
                                    >
                                      <Plus className="w-4 h-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Add this motivator to your goals</p>
                                  </TooltipContent>
                                </Tooltip>

                                {/* Admin Edit Button */}
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
                                        className="h-8 w-8 p-0 rounded-md hover:bg-ceramic-base text-muted-foreground hover:text-warm-text"
                                      >
                                        <Edit className="w-4 h-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Edit this idea (Admin)</p>
                                    </TooltipContent>
                                  </Tooltip>
                                )}

                                 {/* Admin Delete Button */}
                                 {isAdmin && (
                                   <Tooltip>
                                     <TooltipTrigger asChild>
                                       <Button
                                         size="sm"
                                         variant="ghost"
                                         onClick={(e) => {
                                           e.stopPropagation();
                                           setGoalToDelete(goal);
                                           setDeleteModalOpen(true);
                                         }}
                                         disabled={loading}
                                         className="h-8 w-8 p-0 rounded-md hover:bg-destructive/10 hover:text-destructive"
                                       >
                                         <Trash2 className="w-4 h-4" />
                                       </Button>
                                     </TooltipTrigger>
                                     <TooltipContent>
                                       <p>Remove from default goals (Admin)</p>
                                     </TooltipContent>
                                   </Tooltip>
                                 )}
                              </div>
                            </div>
                          </div>
                          
                          {/* Expand button at bottom */}
                          {shouldShowExpandButton && (
                            <div className="flex justify-end pt-2">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setExpandedGoal(isExpanded ? null : goal.id);
                                    }}
                                    className="h-6 w-6 p-0 rounded-full hover:bg-muted/20 text-muted-foreground"
                                  >
                                    <ChevronDown 
                                      className={`w-3 h-3 ${isExpanded ? 'rotate-180' : ''}`} 
                                    />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{isExpanded ? 'Show less' : 'Show full description'}</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>
        </ErrorBoundary>
    </UniversalModal>
  );
};