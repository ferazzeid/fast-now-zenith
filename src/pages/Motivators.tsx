import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Edit, Trash2, Image, Sparkles, Mic, Lightbulb } from 'lucide-react';
import { useMotivators } from '@/hooks/useMotivators';
import { MotivatorFormModal } from '@/components/MotivatorFormModal';
import { ModalAiChat } from '@/components/ModalAiChat';
import { GoalIdeasLibrary } from '@/components/GoalIdeasLibrary';
import { AdminGoalIdea } from '@/hooks/useAdminGoalIdeas';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

const Motivators = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { motivators, loading, createMotivator, updateMotivator, deleteMotivator, refreshMotivators } = useMotivators();
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingMotivator, setEditingMotivator] = useState(null);
  const [showAiChat, setShowAiChat] = useState(false);
  const [showGoalIdeas, setShowGoalIdeas] = useState(false);
  const [aiChatContext, setAiChatContext] = useState('');
  const [pendingAiSuggestion, setPendingAiSuggestion] = useState(null);

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
        title: "✅ Motivator Created!",
        description: "Your new motivator has been saved successfully.",
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

  const handleVoiceMotivator = () => {
    const contextMessage = `Hello! I'm here to help you create a motivational message for your fasting journey.

I can help you create:
• Inspirational titles for your motivators
• Detailed motivational content and descriptions
• Personal reasons for your health goals
• Reminders of why you started this journey

Please tell me what motivates you or what kind of motivational message you'd like to create. For example: "I want to remind myself why I'm doing this for my health" or "Create something about feeling confident in my body".`;
    
    setAiChatContext(contextMessage);
    setShowAiChat(true);
  };

  const handleAiChatResult = async (result: any) => {
    console.log('AI Chat Result:', result); // Debug log
    
    // Handle both 'create_motivator' function calls and text-based confirmations
    if (result.name === 'create_motivator' || (result.arguments && result.arguments.title)) {
      let suggestionData;
      
      if (result.name === 'create_motivator') {
        const { arguments: args } = result;
        suggestionData = {
          title: args.title.split(' ').slice(0, 3).join(' '), // Max 3 words
          content: args.content,
          imageUrl: args.imageUrl || null
        };
      } else {
        // Handle direct arguments
        suggestionData = {
          title: result.arguments.title.split(' ').slice(0, 3).join(' '),
          content: result.arguments.content,
          imageUrl: result.arguments.imageUrl || null
        };
      }
      
      // Store the suggestion - keep the chat open for review
      setPendingAiSuggestion(suggestionData);
      
      // Show success toast
      toast({
        title: "✅ Motivator Suggestion Ready!",
        description: "Review the suggestion in the chat and confirm to create it.",
      });
    }
  };
  
  const handleSelectGoalIdea = async (goal: AdminGoalIdea) => {
    try {
      await handleCreateMotivator({
        title: goal.title,
        content: goal.description,
        imageUrl: goal.imageUrl || null
      });
      setShowGoalIdeas(false);
    } catch (error) {
      console.error('Error creating motivator from goal idea:', error);
    }
  };


  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 safe-top safe-bottom">
        <div className="px-4 pt-20 pb-24">
          <div className="max-w-md mx-auto space-y-6">
          {/* Header */}
          <div className="text-center space-y-2 mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">My Motivators</h1>
            <p className="text-muted-foreground">
              Your personal collection of inspiration and motivation
            </p>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={handleVoiceMotivator}
                  className="h-20 flex flex-col items-center justify-center bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <Mic className="w-6 h-6 mb-1" />
                  <span className="text-sm font-medium">Voice Add Motivator</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Create a motivator using voice input and AI assistance</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  onClick={() => setShowFormModal(true)}
                  className="h-20 flex flex-col items-center justify-center bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <Plus className="w-6 h-6 mb-1" />
                  <span className="text-sm font-medium">Manual Add Motivator</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Create a motivator by typing title, description, and adding images</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Goal Ideas Library Button */}
          <div className="mb-6">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  onClick={() => setShowGoalIdeas(!showGoalIdeas)}
                  className="w-full h-12 flex items-center justify-center border-2 border-dashed border-muted-foreground/30 hover:border-muted-foreground/50 bg-background/50"
                >
                  <Lightbulb className="w-5 h-5 mr-2 text-muted-foreground" />
                  <span className="text-muted-foreground font-medium">Goal Ideas Library</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Browse pre-made motivational examples and templates to get inspired</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Goal Ideas Library */}
          {showGoalIdeas && (
            <div className="mb-6 bg-card border border-border rounded-lg p-4">
              <GoalIdeasLibrary
                onSelectGoal={handleSelectGoalIdea}
                onClose={() => setShowGoalIdeas(false)}
              />
            </div>
          )}

          {/* Motivators List */}
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <div className="flex">
                    <div className="w-24 h-24 bg-muted animate-pulse flex-shrink-0" />
                    <div className="flex-1 p-4 space-y-2">
                      <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                      <div className="h-3 bg-muted animate-pulse rounded w-1/2" />
                      <div className="h-3 bg-muted animate-pulse rounded w-2/3" />
                    </div>
                  </div>
                </Card>
              ))}
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
                  <Button onClick={() => setShowFormModal(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground">
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
                       {/* Image - fixed square dimensions */}
                       <div className="w-24 h-24 bg-muted flex items-center justify-center flex-shrink-0">
                         {motivator.imageUrl ? (
                           <img 
                             src={motivator.imageUrl} 
                             alt={motivator.title}
                             className="w-full h-full object-cover"
                           />
                         ) : (
                           <Image className="w-10 h-10 text-muted-foreground" />
                         )}
                       </div>
                      
                      {/* Content */}
                      <div className="flex-1 p-4 pr-2">
                        <div className="flex items-start justify-between h-full">
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
                                <Badge variant="secondary" className="text-xs bg-muted text-muted-foreground">
                                  {motivator.category}
                                </Badge>
                              </div>
                            )}
                          </div>
                          
                          {/* Actions - combined in single column */}
                          <div className="flex flex-col gap-1 ml-2">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleEditMotivator(motivator)}
                                  className="p-1 h-6 w-6"
                                >
                                  <Edit className="w-3 h-3" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Edit this motivator</p>
                              </TooltipContent>
                            </Tooltip>
                            <AlertDialog>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <AlertDialogTrigger asChild>
                                    <Button size="sm" variant="ghost" className="p-1 h-6 w-6">
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </AlertDialogTrigger>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Delete this motivator</p>
                                </TooltipContent>
                              </Tooltip>
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

          {/* AI Chat Modal */}
          {showAiChat && (
            <ModalAiChat
              isOpen={showAiChat}
              context={aiChatContext}
              onResult={handleAiChatResult}
              onClose={() => setShowAiChat(false)}
              title="Motivator Assistant"
            />
          )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default Motivators;