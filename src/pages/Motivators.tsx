import React, { useState, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageOnboardingButton } from '@/components/PageOnboardingButton';
import { PageOnboardingModal } from '@/components/PageOnboardingModal';
import { onboardingContent } from '@/data/onboardingContent';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, Sparkles, Mic, Lightbulb } from 'lucide-react';
import { useMotivators } from '@/hooks/useMotivators';
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
import { MotivatorSkeleton } from '@/components/LoadingStates';
import { trackMotivatorEvent, trackAIEvent } from '@/utils/analytics';
import { PremiumGate } from '@/components/PremiumGate';


const Motivators = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { motivators, loading, createMotivator, updateMotivator, deleteMotivator, refreshMotivators } = useMotivators();
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
      
      trackMotivatorEvent('delete', 'personal');
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
    trackAIEvent('chat', 'motivator_assistant');
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
      <div className="relative min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4">
        <div className="max-w-md mx-auto pt-20 pb-20">
          <div className="space-y-6">
          {/* Header with Onboarding Button */}
          <div className="text-center space-y-2 mb-8 relative">
            <div className="absolute left-0 top-0">
              <PageOnboardingButton onClick={() => setShowOnboarding(true)} />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">My Goals</h1>
            <p className="text-muted-foreground">
              Your personal collection of inspiration
            </p>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <Tooltip>
              <TooltipTrigger asChild>
                <PremiumGate feature="AI Motivator Assistant">
                  <Button
                    onClick={handleVoiceMotivator}
                    variant="action-primary"
                    size="action-tall"
                    className="gap-2"
                  >
                    <Mic className="w-5 h-5" />
                    <span className="text-sm font-medium">Voice Add</span>
                  </Button>
                </PremiumGate>
              </TooltipTrigger>
              <TooltipContent>
                <p>Create a motivator using voice input and AI assistance</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  onClick={() => setShowFormModal(true)}
                  variant="action-primary"
                  size="action-tall"
                  className="gap-2"
                >
                  <Plus className="w-5 h-5" />
                  <span className="text-sm font-medium">Manual Add</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Create a motivator by typing title, description, and adding images</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={() => setShowMotivatorIdeasModal(true)}
                  variant="action-secondary"
                  size="action-tall"
                  className="gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                  <span className="text-sm font-medium">Library</span>
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
                    Create Your First Motivator
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              {motivators.map((motivator) => (
                <div key={motivator.id}>
                  <ExpandableMotivatorCard
                    motivator={motivator}
                    onEdit={() => handleEditMotivator(motivator)}
                    onDelete={() => handleDeleteMotivator(motivator.id)}
                  />
                </div>
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
              />
            </ComponentErrorBoundary>
          )}

          {/* Motivator Ideas Modal */}
          <MotivatorIdeasModal
            isOpen={showMotivatorIdeasModal}
            onClose={() => setShowMotivatorIdeasModal(false)}
            onSelectGoal={handleSelectGoalIdea}
          />

          {/* Onboarding Modal */}
          <PageOnboardingModal
            isOpen={showOnboarding}
            onClose={() => setShowOnboarding(false)}
            title={onboardingContent.motivators.title}
            subtitle={onboardingContent.motivators.subtitle}
            heroQuote={onboardingContent.motivators.heroQuote}
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