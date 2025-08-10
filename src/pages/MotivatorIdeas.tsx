import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePageSEO } from '@/hooks/usePageSEO';
import { useToast } from '@/hooks/use-toast';
import { useAdminGoalIdeas, AdminGoalIdea } from '@/hooks/useAdminGoalIdeas';
import { useAdminGoalManagement } from '@/hooks/useAdminGoalManagement';
import { useMotivators } from '@/hooks/useMotivators';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { MotivatorImageWithFallback } from '@/components/MotivatorImageWithFallback';
import { MotivatorFormModal } from '@/components/MotivatorFormModal';
import { Lightbulb, Plus, Edit, Trash2, ArrowLeft, ChevronDown } from 'lucide-react';

export default function MotivatorIdeas() {
  usePageSEO({
    title: 'Motivator Ideas Library',
    description: 'Browse motivator ideas and add them to your goals.',
    canonicalPath: '/motivator-ideas',
  });

  const navigate = useNavigate();
  const { toast } = useToast();
  const { goalIdeas, loading, refreshGoalIdeas } = useAdminGoalIdeas();
  const { removeFromDefaultGoals, updateDefaultGoal, loading: adminLoading } = useAdminGoalManagement();
  const { createMotivator } = useMotivators();

  const [expandedGoal, setExpandedGoal] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [editingMotivator, setEditingMotivator] = useState<any | null>(null);

  useEffect(() => {
    const checkAdminRole = async () => {
      try {
        const { data: auth } = await supabase.auth.getUser();
        const uid = auth?.user?.id;
        if (!uid) return;
        const { data, error } = await supabase.rpc('has_role', { _user_id: uid, _role: 'admin' });
        if (error) throw error;
        setIsAdmin(!!data);
      } catch (e) {
        setIsAdmin(false);
      }
    };
    checkAdminRole();
  }, []);

  useEffect(() => {
    refreshGoalIdeas();
  }, [refreshGoalIdeas]);

  const handleAdd = async (goal: AdminGoalIdea) => {
    try {
      await createMotivator({
        title: goal.title,
        content: goal.description || '',
        category: 'personal',
        imageUrl: goal.imageUrl || undefined,
      });
      toast({ title: '✅ Added to My Goals', description: 'The motivator was added successfully.' });
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to add motivator.', variant: 'destructive' });
    }
  };

  const handleEdit = (goal: AdminGoalIdea) => {
    setEditingMotivator({ id: goal.id, title: goal.title, content: goal.description || '', imageUrl: goal.imageUrl });
  };

  const handleSaveEdit = async (updated: any) => {
    try {
      console.log('Saving edit with data:', updated);
      const success = await updateDefaultGoal(updated.id, {
        title: updated.title,
        content: updated.content,
        imageUrl: updated.imageUrl,
      });
      if (success) {
        console.log('Update successful, refreshing ideas...');
        setEditingMotivator(null);
        toast({ title: '✅ Idea Updated', description: 'Changes saved successfully.' });
        // Force immediate refresh of the ideas with a slight delay to ensure DB update is complete
        setTimeout(async () => {
          await refreshGoalIdeas();
          console.log('Ideas refreshed after update');
        }, 500);
      } else {
        throw new Error('Update failed');
      }
    } catch (e) {
      console.error('Update error:', e);
      toast({ title: 'Error', description: 'Failed to update idea.', variant: 'destructive' });
    }
  };

  const handleDelete = async (goalId: string) => {
    const ok = await removeFromDefaultGoals(goalId);
    if (ok) {
      toast({ title: 'Removed', description: 'Idea removed from defaults.' });
      refreshGoalIdeas();
    }
  };

  return (
    <div className="pt-20 pb-20"> {/* Increased spacing from deficit bar */}
      <header className="flex items-center gap-3 mb-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/motivators')} aria-label="Back to My Goals">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-xl font-bold text-warm-text">Motivator Ideas</h1>
      </header>

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
              const shouldShowExpandButton = goal.description && goal.description.length > 50;

              return (
                <Card key={goal.id} className="overflow-hidden relative">
                  <CardContent className="p-0">
                    <div className="flex">
                      <div className="w-32 h-32 flex-shrink-0">
                        <MotivatorImageWithFallback src={goal.imageUrl} alt={goal.title} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 p-4 pr-2">
                        <div className="flex items-start justify-between h-full">
                          <div className="flex-1 space-y-1">
                            <h2 className="font-semibold text-warm-text line-clamp-1">{goal.title}</h2>
                            {goal.description && (
                              <div className="text-sm text-muted-foreground">
                                {isExpanded ? <p className="whitespace-pre-wrap">{goal.description}</p> : <p className="line-clamp-2">{goal.description}</p>}
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
                                      <Button size="sm" variant="ghost" disabled={adminLoading} className="p-1 h-6 w-6 rounded-md hover:bg-destructive/10 hover:text-destructive" aria-label="Delete idea">
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

      {editingMotivator && (
        <MotivatorFormModal
          motivator={editingMotivator}
          onSave={handleSaveEdit}
          onClose={() => setEditingMotivator(null)}
        />
      )}
    </div>
  );
}
