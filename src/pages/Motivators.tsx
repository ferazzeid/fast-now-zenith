import React, { useState, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageOnboardingButton } from '@/components/PageOnboardingButton';
import { PageOnboardingModal } from '@/components/PageOnboardingModal';
import { onboardingContent } from '@/data/onboardingContent';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Sparkles, Target, Mic } from 'lucide-react';
import { useMotivators } from '@/hooks/useMotivators';
import { useAdminGoalManagement } from '@/hooks/useAdminGoalManagement';
import { MotivatorFormModal } from '@/components/MotivatorFormModal';
import { ModalAiChat } from '@/components/ModalAiChat';
import { ComponentErrorBoundary } from '@/components/ErrorBoundary';
import { GoalIdeasLibrary } from '@/components/GoalIdeasLibrary';
import { MotivatorIdeasModal } from '@/components/MotivatorIdeasModal';
import { AdminGoalIdea } from '@/hooks/useAdminGoalIdeas';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ExpandableMotivatorCard } from '@/components/ExpandableMotivatorCard';
import { SimpleMotivatorCard } from '@/components/SimpleMotivatorCard';
import { MotivatorSkeleton } from '@/components/LoadingStates';
import { trackMotivatorEvent, trackAIEvent } from '@/utils/analytics';
import { PremiumGate } from '@/components/PremiumGate';


const Motivators = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { motivators, loading, createMotivator, createMultipleMotivators, updateMotivator, deleteMotivator, refreshMotivators } = useMotivators();
  const { addToDefaultGoals, removeFromDefaultGoals, updateDefaultGoal, checkIfInDefaultGoals } = useAdminGoalManagement();
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingMotivator, setEditingMotivator] = useState(null);
  const [showAiChat, setShowAiChat] = useState(false);
  const [showGoalIdeas, setShowGoalIdeas] = useState(false);
  const [showMotivatorIdeasModal, setShowMotivatorIdeasModal] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  
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
      
      trackMotivatorEvent('create', 'personal');
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
      // Check if this is an admin goal edit (has no numeric id, just string id)
      const isAdminGoalEdit = editingMotivator && typeof editingMotivator.id === 'string' && !editingMotivator.id.match(/^\d+$/);
      
      if (isAdminGoalEdit) {
        // Update admin goal idea
        const success = await updateDefaultGoal(editingMotivator.id, {
          title: updatedMotivator.title,
          content: updatedMotivator.content,
          imageUrl: updatedMotivator.imageUrl
        });
        
        if (success) {
          trackMotivatorEvent('edit', 'admin_goal');
          setEditingMotivator(null);
          
          toast({
            title: "✅ Admin Goal Updated!",
            description: "The goal idea has been updated successfully.",
          });
          
          // Re-open the ideas modal to show updated content
          setShowMotivatorIdeasModal(true);
        }
      } else {
        // Update regular motivator
        await updateMotivator(updatedMotivator.id, {
          title: updatedMotivator.title,
          content: updatedMotivator.content,
          imageUrl: updatedMotivator.imageUrl
        });
        
        trackMotivatorEvent('edit', 'personal');
        setEditingMotivator(null);
        
        toast({
          title: "✨ Motivator Updated!",
          description: "Your changes have been saved.",
        });
        
        refreshMotivators();
      }
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
      const success = await deleteMotivator(motivatorId);
      
      if (success) {
        trackMotivatorEvent('delete', 'personal');
        // Note: No need to call refreshMotivators() here as deleteMotivator already updates local state
        // and shows a toast notification
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete motivator",
        variant: "destructive"
      });
    }
  };


  const handleAiChatResult = async (result: any) => {
    console.log('🎯 AI Chat Result received:', result); // Debug log
    console.log('🎯 Result name:', result.name);
    console.log('🎯 Result arguments:', result.arguments);
    
    // Handle voice edit commands
    if (result.name === 'edit_motivator') {
      const { motivator_id, updates } = result.arguments;
      try {
        await updateMotivator(motivator_id, updates);
        toast({
          title: "✅ Motivator Updated!",
          description: "Your motivator has been updated via voice command.",
        });
      } catch (error) {
        console.error('🎯 Error updating motivator via voice:', error);
        toast({
          title: "Error",
          description: "Failed to update motivator. Please try again.",
          variant: "destructive"
        });
      }
      return;
    }
    
    // Handle voice delete commands
    if (result.name === 'delete_motivator') {
      const { motivator_id } = result.arguments;
      try {
        await handleDeleteMotivator(motivator_id);
        toast({
          title: "✅ Motivator Deleted!",
          description: "Your motivator has been deleted via voice command.",
        });
      } catch (error) {
        console.error('🎯 Error deleting motivator via voice:', error);
        toast({
          title: "Error",
          description: "Failed to delete motivator. Please try again.",
          variant: "destructive"
        });
      }
      return;
    }
    
    // Check if it's bulk motivator creation
    if (result.name === 'create_multiple_motivators') {
      console.log('🎯 Found create_multiple_motivators result');
      
      try {
        const motivators = result.arguments.motivators.map((motivator: any) => ({
          title: motivator.title,
          content: motivator.content,
          category: motivator.category || 'general'
        }));
        
        const createdIds = await createMultipleMotivators(motivators);
        console.log('🎯 Successfully created bulk motivators:', createdIds);
        
        // Show success toast
        toast({
          title: "✅ Motivators Created!",
          description: `Created ${motivators.length} motivator${motivators.length > 1 ? 's' : ''} successfully!`,
        });
      } catch (error) {
        console.error('🎯 Error creating bulk motivators:', error);
        toast({
          title: "Error",
          description: "Failed to create motivators. Please try again.",
          variant: "destructive"
        });
      }
    }
    // Handle both 'create_motivator' function calls and text-based confirmations
    else if (result.name === 'create_motivator' || (result.arguments && result.arguments.title)) {
      let suggestionData;
      
      if (result.name === 'create_motivator') {
        const { arguments: args } = result;
        console.log('🎯 Processing create_motivator function call:', args);
        suggestionData = {
          title: args.title,
          content: args.content,
          imageUrl: args.imageUrl || null
        };
      } else {
        console.log('🎯 Processing direct arguments:', result.arguments);
        suggestionData = {
          title: result.arguments.title,
          content: result.arguments.content,
          imageUrl: result.arguments.imageUrl || null
        };
      }
      
      console.log('🎯 Final suggestion data:', suggestionData);
      
      try {
        console.log('🎯 Calling handleCreateMotivator with:', suggestionData);
        await handleCreateMotivator(suggestionData);
        console.log('🎯 Successfully created motivator!');
        
        // Show success toast
        toast({
          title: "✅ Motivator Created!",
          description: "Your AI-generated motivator has been saved.",
        });
      } catch (error) {
        console.error('🎯 Error creating motivator:', error);
        toast({
          title: "Error",
          description: "Failed to create AI motivator. Please try again.",
          variant: "destructive"
        });
      }
    } else {
      console.log('🎯 Result does not match expected format for motivator creation');
    }
  };

  const handleEditGoalIdea = (goal: AdminGoalIdea) => {
    // Edit the actual goal idea (admin functionality)
    const motivatorData = {
      id: goal.id, // Include the ID for editing
      title: goal.title,
      content: goal.description || '',
      imageUrl: goal.imageUrl
    };
    setEditingMotivator(motivatorData);
    setShowMotivatorIdeasModal(false);
    // Don't set showFormModal here since we're using editingMotivator to control the modal
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
      <div className="relative min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4">
        <div className="max-w-md mx-auto pt-10 pb-20">
          <div className="space-y-6">
          {/* Header with Onboarding Button */}
          <div className="mb-4 mt-4 relative">
            <div className="absolute left-0 top-0">
              <PageOnboardingButton onClick={() => setShowOnboarding(true)} />
            </div>
            <div className="pl-12 pr-12">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent mb-1">My Goals</h1>
              <p className="text-sm text-muted-foreground text-left">
                Your personal motivators
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-center mb-6">
            <div className="flex flex-col items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <PremiumGate feature="Voice Input" grayOutForFree={true}>
                    <Button
                      onClick={() => {
                        setAiChatContext("Help me create a powerful motivator for my fasting journey. I want to record what drives me and why it's important.");
                        setShowAiChat(true);
                        trackAIEvent('chat', 'motivator_voice');
                      }}
                      variant="ai"
                      size="action-tall"
                      className="flex items-center justify-center"
                      aria-label="Create motivator with voice"
                    >
                      <Mic className="w-5 h-5" />
                    </Button>
                  </PremiumGate>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Create a motivator by talking about what drives you</p>
                </TooltipContent>
              </Tooltip>
              <span className="text-xs text-muted-foreground">Add with Voice</span>
            </div>

            <div className="flex flex-col items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    onClick={() => setShowFormModal(true)}
                    variant="action-primary"
                    size="action-tall"
                    className="flex items-center justify-center"
                    aria-label="Create motivator manually"
                  >
                    <Plus className="w-5 h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Create a motivator by typing title, description, and adding images</p>
                </TooltipContent>
              </Tooltip>
              <span className="text-xs text-muted-foreground">Add Manually</span>
            </div>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={() => navigate('/motivator-ideas')}
                  variant="action-secondary"
                  size="action-tall"
                  className="flex items-center justify-center"
                  aria-label="Browse motivator ideas"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Browse professionally designed motivators and add them to your collection</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Goal Ideas Library - Kept for backward compatibility but hidden */}
          {showGoalIdeas && (
            <div className="mb-6 bg-card border border-border rounded-lg p-4">
              <ComponentErrorBoundary>
                <GoalIdeasLibrary
                  onSelectGoal={handleSelectGoalIdea}
                  onClose={() => setShowGoalIdeas(false)}
                />
              </ComponentErrorBoundary>
            </div>
          )}

          {/* Motivators List */}
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <MotivatorSkeleton key={i} />
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
                  <Button onClick={() => setShowFormModal(true)} variant="action-secondary" size="action-secondary">
                    <Plus className="w-4 h-4 mr-2" />
                    Create
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              {motivators.map((motivator) => (
                <div key={motivator.id}>
                  {motivator.category === 'saved_quote' ? (
                    <SimpleMotivatorCard
                      motivator={motivator}
                      onDelete={() => handleDeleteMotivator(motivator.id)}
                    />
                  ) : (
                    <ExpandableMotivatorCard
                      motivator={motivator}
                      onEdit={() => handleEditMotivator(motivator)}
                      onDelete={() => handleDeleteMotivator(motivator.id)}
                    />
                  )}
                </div>
              ))}
              
              {/* Placeholder cards to encourage creating up to 3 goals */}
              {motivators.length < 3 && [...Array(3 - motivators.length)].map((_, index) => (
                <Card 
                  key={`placeholder-${index}`} 
                  className="overflow-hidden border-dashed border-2 border-muted-foreground/20 hover:border-primary/30 cursor-pointer transition-all duration-200 hover:bg-muted/10 bg-muted/5"
                  onClick={() => setShowFormModal(true)}
                >
                  <CardContent className="p-6">
                    <div className="text-center space-y-3">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                        <Plus className="w-6 h-6 text-primary/60" />
                      </div>
                      <div>
                        <h3 className="font-medium text-muted-foreground mb-1">
                          Add Goal #{motivators.length + index + 1}
                        </h3>
                        <p className="text-sm text-muted-foreground/60">
                          Click to create your {motivators.length + index + 1 === 2 ? 'second' : 'third'} motivator
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Form Modals */}
          {showFormModal && (
            <ComponentErrorBoundary>
              <MotivatorFormModal
                onSave={handleCreateMotivator}
                onClose={() => setShowFormModal(false)}
              />
            </ComponentErrorBoundary>
          )}
          
          {editingMotivator && (
            <ComponentErrorBoundary>
              <MotivatorFormModal
                motivator={editingMotivator}
                onSave={handleSaveMotivator}
                onClose={() => setEditingMotivator(null)}
              />
            </ComponentErrorBoundary>
          )}

          {/* AI Chat Modal */}
          {showAiChat && (
            <ComponentErrorBoundary>
              <ModalAiChat
                isOpen={showAiChat}
                context={aiChatContext}
                onResult={handleAiChatResult}
                onClose={() => setShowAiChat(false)}
                title="Motivator Assistant"
                systemPrompt="You are a motivational coach who helps users create personalized motivational messages and goals. Focus on understanding their specific motivations and creating compelling, actionable content that will inspire them on their journey."
              />
            </ComponentErrorBoundary>
          )}

          {/* Motivator Ideas Modal */}
          <MotivatorIdeasModal
            isOpen={showMotivatorIdeasModal}
            onClose={() => setShowMotivatorIdeasModal(false)}
            onSelectGoal={handleSelectGoalIdea}
            onEditGoal={handleEditGoalIdea}
          />

          {/* Onboarding Modal */}
          <PageOnboardingModal
            isOpen={showOnboarding}
            onClose={() => setShowOnboarding(false)}
            title={onboardingContent.motivators.title}
            subtitle={onboardingContent.motivators.subtitle}
            heroQuote={onboardingContent.motivators.heroQuote}
            backgroundImage={onboardingContent.motivators.backgroundImage}
          >
            <div className="space-y-6">
              <div className="text-center">
                <p className="text-lg text-warm-text/80 mb-6">{onboardingContent.motivators.subtitle}</p>
              </div>
              
              {onboardingContent.motivators.sections.map((section, index) => {
                const IconComponent = section.icon;
                return (
                  <div key={index} className="flex gap-4 p-4 rounded-xl bg-ceramic-base/50">
                    <div className="flex-shrink-0 w-12 h-12 bg-ceramic-plate rounded-full flex items-center justify-center">
                      <IconComponent className="w-6 h-6 text-warm-text" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-warm-text mb-2">{section.title}</h3>
                      <p className="text-warm-text/70 text-sm leading-relaxed">{section.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </PageOnboardingModal>

          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default Motivators;