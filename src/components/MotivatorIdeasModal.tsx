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
import { ContentModal } from '@/components/ContentModal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface MotivatorIdeasModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectGoal: (goal: AdminGoalIdea) => void;
  onEditGoal?: (goal: AdminGoalIdea) => void;
}

export const MotivatorIdeasModal = ({ isOpen, onClose, onSelectGoal, onEditGoal }: MotivatorIdeasModalProps) => {
  const [expandedGoal, setExpandedGoal] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showContentModal, setShowContentModal] = useState(false);
  const [selectedContent, setSelectedContent] = useState<any>(null);
  const [contentLoading, setContentLoading] = useState(false);
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

  useEffect(() => {
    if (isOpen) {
      refreshGoalIdeas();
    }
  }, [isOpen, refreshGoalIdeas]);

  const handleDelete = async (goalId: string) => {
    await removeGoalIdea(goalId);
  };

  const handleReadMore = async (goal: AdminGoalIdea) => {
    if (!goal.slug) return;
    
    setContentLoading(true);
    setShowContentModal(true);
    
    try {
      // Fetch content from system_motivators table
      const { data, error } = await supabase
        .from('system_motivators')
        .select('*')
        .eq('slug', goal.slug)
        .single();

      if (error) throw error;

      if (data) {
        setSelectedContent({
          id: data.id,
          title: data.title,
          content: data.content,
          external_url: data.link_url,
          created_at: data.created_at
        });
      }
    } catch (error) {
      console.error('Error fetching content:', error);
      setShowContentModal(false);
    } finally {
      setContentLoading(false);
    }
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
    <>
      <UniversalModal
        isOpen={isOpen}
        onClose={onClose}
        title="Motivator Ideas"
        variant="standard"
        size="md"
        showCloseButton={true}
      >
        <ErrorBoundary>
        <div className="space-y-4">
          <div className="flex items-center space-x-2 mb-4">
            <Lightbulb className="w-4 h-4 text-primary" />
            <p className="text-sm text-muted-foreground">Choose a motivator to add to your goals</p>
          </div>
          
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
                                 
                                 {/* Read More Button */}
                                 {goal.slug && (
                                   <div className="mt-2">
                                     <Button
                                       variant="link"
                                       size="sm"
                                       onClick={(e) => {
                                         e.stopPropagation();
                                         handleReadMore(goal);
                                       }}
                                       className="h-auto p-0 text-primary hover:text-primary/80 text-sm font-medium"
                                     >
                                       Read Full Article
                                     </Button>
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
                                   <AlertDialog>
                                     <Tooltip>
                                       <TooltipTrigger asChild>
                                         <AlertDialogTrigger asChild>
                                           <Button
                                             size="sm"
                                             variant="ghost"
                                             disabled={loading}
                                             className="h-8 w-8 p-0 rounded-md hover:bg-destructive/10 hover:text-destructive"
                                           >
                                             <Trash2 className="w-4 h-4" />
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
                                         <AlertDialogAction
                                           onClick={() => handleDelete(goal.id)}
                                           className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                         >
                                           Remove
                                         </AlertDialogAction>
                                       </AlertDialogFooter>
                                     </AlertDialogContent>
                                   </AlertDialog>
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
                                     onClick={() => setExpandedGoal(isExpanded ? null : goal.id)}
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
       
       <ContentModal
         isOpen={showContentModal}
         onClose={() => {
           setShowContentModal(false);
           setSelectedContent(null);
         }}
         contentItem={selectedContent}
         loading={contentLoading}
       />
     </>
   );
 };