import React, { useState, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AIVoiceButton } from '@/components/AIVoiceButton';

import { PageOnboardingModal } from '@/components/PageOnboardingModal';
import { onboardingContent } from '@/data/onboardingContent';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Plus, Sparkles, Target, Mic, BookOpen } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState('goals');
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingMotivator, setEditingMotivator] = useState(null);
  const [showGoalIdeas, setShowGoalIdeas] = useState(false);
  const [showMotivatorIdeasModal, setShowMotivatorIdeasModal] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [pendingAiSuggestion, setPendingAiSuggestion] = useState(null);

  // Filter motivators based on active tab
  const goalMotivators = motivators.filter(m => m.category !== 'saved_quote');
  const savedQuotes = motivators.filter(m => m.category === 'saved_quote');

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
      // Check if this is an admin goal edit by looking at the source/type
      // Admin goals should have a specific flag or come from admin goal management
      const isAdminGoalEdit = editingMotivator && 
        (editingMotivator._isAdminGoal || editingMotivator.source === 'admin_goals');
      
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
          {/* Header */}
          <div className="mb-4 mt-4 relative">
            <div className="absolute left-0 top-0">
              <AIVoiceButton />
            </div>
            <div className="pl-12 pr-12">
              <h1 className="text-2xl font-bold text-foreground mb-1">
                {activeTab === 'goals' ? 'My Goals' : 'Saved Quotes'}
              </h1>
              <p className="text-sm text-muted-foreground text-left">
                {activeTab === 'goals' ? 'Your personal motivators' : 'Quotes saved from timers'}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mb-6 grid grid-cols-2 gap-4">
            <div className="col-span-1 flex flex-col items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    onClick={() => setShowFormModal(true)}
                    variant="action-primary"
                    size="action-tall"
                    className="w-full flex items-center justify-center"
                    aria-label="Create motivator manually"
                  >
                    <Plus className="w-5 h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Create a motivator by typing title, description, and adding images</p>
                </TooltipContent>
              </Tooltip>
              <span className="text-xs text-muted-foreground">Add Goal</span>
            </div>

            <div className="col-span-1 flex flex-col items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => navigate('/motivator-ideas')}
                    variant="action-secondary"
                    size="action-tall"
                    className="w-full flex items-center justify-center"
                    aria-label="Browse motivator ideas"
                  >
                    <BookOpen className="w-5 h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Browse professionally designed motivators and add them to your collection</p>
                </TooltipContent>
              </Tooltip>
              <span className="text-xs text-muted-foreground">Goal ideas</span>
            </div>
          </div>

          {/* Tabs */}
          <div className="mb-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="goals">Goals ({goalMotivators.length})</TabsTrigger>
                <TabsTrigger value="quotes">Quotes ({savedQuotes.length})</TabsTrigger>
              </TabsList>
            </Tabs>
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

          {/* Content based on active tab */}
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <MotivatorSkeleton key={i} />
              ))}
            </div>
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsContent value="goals">
                {goalMotivators.length === 0 ? (
                  <Card className="p-6 text-center">
                    <div className="space-y-4">
                      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                        <Target className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-warm-text mb-2">No goals yet</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Create your first goal to stay inspired during your fasting journey
                        </p>
                        <Button onClick={() => setShowFormModal(true)} variant="action-secondary" size="action-secondary">
                          <Plus className="w-4 h-4 mr-2" />
                          Create Goal
                        </Button>
                      </div>
                    </div>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {goalMotivators.map((motivator) => (
                      <ExpandableMotivatorCard
                        key={motivator.id}
                        motivator={motivator}
                        onEdit={() => handleEditMotivator(motivator)}
                        onDelete={() => handleDeleteMotivator(motivator.id)}
                      />
                    ))}
                    
                    {/* Placeholder cards to encourage creating up to 3 goals */}
                    {goalMotivators.length < 3 && [...Array(3 - goalMotivators.length)].map((_, index) => (
                      <Card 
                        key={`placeholder-${index}`} 
                        className="overflow-hidden border-dashed border-2 border-muted-foreground/20 hover:border-primary/30 cursor-pointer transition-all duration-200 hover:bg-muted/10 bg-muted/5"
                        onClick={() => setShowFormModal(true)}
                      >
                        <CardContent className="p-6">
                          <div className="text-center space-y-3">
                            <div className="w-12 h-12 bg-muted-foreground/10 rounded-full flex items-center justify-center mx-auto">
                              <Plus className="w-6 h-6 text-muted-foreground/60" />
                            </div>
                            <div>
                              <h4 className="font-medium text-muted-foreground/70 mb-1">Create Goal #{goalMotivators.length + index + 1}</h4>
                              <p className="text-xs text-muted-foreground/50">Tap to add another motivating goal</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="quotes">
                {savedQuotes.length === 0 ? (
                  <Card className="p-6 text-center">
                    <div className="space-y-4">
                      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                        <Sparkles className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-warm-text mb-2">No saved quotes yet</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Quotes you save from timer screens will appear here
                        </p>
                      </div>
                    </div>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {savedQuotes.map((motivator) => (
                      <SimpleMotivatorCard
                        key={motivator.id}
                        motivator={motivator}
                        onDelete={() => handleDeleteMotivator(motivator.id)}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
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

export default memo(Motivators);