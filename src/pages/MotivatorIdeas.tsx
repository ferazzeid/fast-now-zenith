import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePageSEO } from '@/hooks/usePageSEO';
import { useToast } from '@/hooks/use-toast';
import { useAdminGoalIdeas, AdminGoalIdea } from '@/hooks/useAdminGoalIdeas';
import { useMotivators } from '@/hooks/useMotivators';
import { useProfile } from '@/hooks/useProfile';
import { useAccess } from '@/hooks/useAccess';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { MotivatorImageWithFallback } from '@/components/MotivatorImageWithFallback';
import { AdminGoalEditModal } from '@/components/AdminGoalEditModal';
import { GoalIdeasErrorBoundary } from '@/components/GoalIdeasErrorBoundary';
import { Lightbulb, Plus, Edit, Trash2, X, ChevronDown, ExternalLink } from 'lucide-react';

export default function MotivatorIdeas() {
  usePageSEO({
    title: 'Motivator Ideas Library',
    description: 'Browse motivator ideas and add them to your goals.',
    canonicalPath: '/motivator-ideas',
  });

  const navigate = useNavigate();
  const { toast } = useToast();
  const { profile } = useProfile();
  const { isAdmin } = useAccess();
  
  const { goalIdeas, loading, refreshGoalIdeas, forceRefresh, updateGoalIdea, removeGoalIdea } = useAdminGoalIdeas();
  const { createMotivator } = useMotivators();

  const [expandedGoal, setExpandedGoal] = useState<string | null>(null);
  const [editingGoal, setEditingGoal] = useState<AdminGoalIdea | null>(null);
  const [forceRenderKey, setForceRenderKey] = useState(0);
  useEffect(() => {
    refreshGoalIdeas();
  }, []);

  const handleAdd = async (goal: AdminGoalIdea) => {
    try {
      // Choose appropriate image based on user gender
      const userGender = profile?.sex || 'male';
      const selectedImageUrl = userGender === 'female' && goal.femaleImageUrl 
        ? goal.femaleImageUrl 
        : userGender === 'male' && goal.maleImageUrl 
        ? goal.maleImageUrl 
        : goal.imageUrl;

      await createMotivator({
        title: goal.title,
        content: goal.description || '',
        category: 'personal',
        imageUrl: selectedImageUrl || undefined,
        linkUrl: goal.linkUrl || undefined,
      });
      toast({ 
        title: '✅ Added to My Goals', 
        description: 'The motivator was added successfully.' 
      });
      
      // Navigate back to motivators page
      navigate('/motivators');
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to add motivator.', variant: 'destructive' });
    }
  };

  const handleEdit = (goal: AdminGoalIdea) => {
    setEditingGoal(goal);
  };


  const handleSaveEdit = useCallback(async (updatedGoal: AdminGoalIdea) => {
    try {
      const success = await updateGoalIdea(updatedGoal.id, updatedGoal);
      if (success) {
        toast({ title: '✅ Idea Updated', description: 'Changes saved successfully.' });
        setEditingGoal(null);
      } else {
        throw new Error('Update failed');
      }
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to update idea.', variant: 'destructive' });
    }
  }, [updateGoalIdea, toast]);

  const handleDelete = async (goalId: string) => {
    await removeGoalIdea(goalId);
  };

  return (
    <GoalIdeasErrorBoundary>
      <div className="pt-20 pb-20 relative"> {/* Increased spacing from deficit bar */}
        
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-foreground">Goal Ideas</h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

      <main>
        {loading ? (
          <div className="space-y-4">
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
        ) : goalIdeas.length === 0 ? (
          <section className="text-center py-10">
            <Lightbulb className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">No motivator ideas found</p>
          </section>
        ) : (
          <section className="space-y-3" aria-label="Motivator ideas list">
            {goalIdeas.map((goal) => {
              const isExpanded = expandedGoal === goal.id;
              
              // Create excerpt from full description (first 150 characters)
              const excerpt = goal.description && goal.description.length > 150 
                ? goal.description.substring(0, 150) + '...' 
                : goal.description;
              
              const shouldShowExpandButton = goal.description && goal.description.length > 150;

              return (
                <Card key={goal.id} className="overflow-hidden relative">
                  <CardContent className="p-0">
                    <div className="flex">
                      <div className="w-32 h-32 flex-shrink-0">
                        {(() => {
                          const userGender = profile?.sex || 'male';
                          const selectedImageUrl = userGender === 'female' && goal.femaleImageUrl 
                            ? goal.femaleImageUrl 
                            : userGender === 'male' && goal.maleImageUrl 
                            ? goal.maleImageUrl 
                            : goal.imageUrl;
                          return <MotivatorImageWithFallback src={selectedImageUrl} alt={goal.title} className="w-full h-full object-cover" />;
                        })()}
                      </div>
                      <div className="flex-1 p-4 pr-2">
                        <div className="flex items-start justify-between h-full">
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <h2 className="font-semibold text-warm-text line-clamp-1">{goal.title}</h2>
                            </div>
                            {goal.description && (
                              <div className="text-sm text-muted-foreground">
                                {isExpanded ? <p className="whitespace-pre-wrap">{excerpt}</p> : <p className="line-clamp-2">{excerpt}</p>}
                              </div>
                            )}
                            
                            {/* Read More Link */}
                            {goal.slug && (
                              <div className="mt-3">
                                <Button
                                  variant="link"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/content/${goal.slug}`);
                                  }}
                                  className="h-auto p-0 text-primary hover:text-primary/80 text-sm font-medium"
                                >
                                  Read More <ExternalLink className="w-3 h-3 ml-1" />
                                </Button>
                              </div>
                            )}
                          </div>
                           <div className="flex flex-col gap-2 ml-2">
                             <Tooltip>
                               <TooltipTrigger asChild>
                                 <Button size="sm" onClick={() => handleAdd(goal)} className="p-1 h-6 w-6 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground" aria-label="Add to my goals">
                                   <Plus className="w-3 h-3" />
                                 </Button>
                               </TooltipTrigger>
                               <TooltipContent>
                                 <p>Add this motivator to your goals</p>
                               </TooltipContent>
                              </Tooltip>

                            {isAdmin && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button size="sm" variant="ghost" onClick={() => handleEdit(goal)} className="p-1 h-6 w-6 rounded-md hover:bg-ceramic-base text-muted-foreground hover:text-warm-text" aria-label="Edit idea">
                                    <Edit className="w-3 h-3" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Edit this idea (Admin)</p>
                                </TooltipContent>
                              </Tooltip>
                            )}

                            {isAdmin && (
                              <AlertDialog>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <AlertDialogTrigger asChild>
                                      <Button size="sm" variant="ghost" disabled={loading} className="p-1 h-6 w-6 rounded-md hover:bg-destructive/10 hover:text-destructive" aria-label="Delete idea">
                                        <Trash2 className="w-3 h-3" />
                                      </Button>
                                    </AlertDialogTrigger>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Remove from default goals (Admin)</p>
                                  </TooltipContent>
                                </Tooltip>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Remove Default Goal</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to remove "{goal.title}" from the default goal ideas? This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDelete(goal.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                      Remove
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {shouldShowExpandButton && (
                      <div className="absolute bottom-2 right-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button size="sm" variant="ghost" onClick={() => setExpandedGoal(isExpanded ? null : goal.id)} className="h-6 w-6 p-0 rounded-full hover:bg-muted/10" aria-label={isExpanded ? 'Show less' : 'Show full description'}>
                              <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{isExpanded ? 'Show less' : 'Show full description'}</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </section>
        )}
      </main>

      {editingGoal && (
        <AdminGoalEditModal
          goal={editingGoal}
          onSave={handleSaveEdit}
          onClose={() => setEditingGoal(null)}
        />
      )}
    </div>
    </GoalIdeasErrorBoundary>
  );
}
