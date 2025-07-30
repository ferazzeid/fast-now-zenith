import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Edit, Trash2, Image, Sparkles, Mic } from 'lucide-react';
import { useMotivators } from '@/hooks/useMotivators';
import { MotivatorFormModal } from '@/components/MotivatorFormModal';
import { ModalAiChat } from '@/components/ModalAiChat';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

const Motivators = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { motivators, loading, createMotivator, updateMotivator, deleteMotivator, refreshMotivators } = useMotivators();
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingMotivator, setEditingMotivator] = useState(null);
  const [showAiChat, setShowAiChat] = useState(false);
  const [aiChatContext, setAiChatContext] = useState('');

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
        title: "✨ Motivator Created!",
        description: "Your new motivator has been saved.",
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
    if (result.name === 'create_motivator') {
      const { arguments: args } = result;
      
      try {
        // Create the motivator from AI suggestion
        await handleCreateMotivator({
          title: args.title,
          content: args.content,
          imageUrl: args.imageUrl || null
        });
        
        // Close the AI chat modal
        setShowAiChat(false);
      } catch (error) {
        console.error('Error creating motivator from AI:', error);
        toast({
          title: "Error",
          description: "Failed to create motivator from AI suggestion",
          variant: "destructive"
        });
      }
    }
  };


  return (
    <div className="min-h-screen bg-ceramic-base safe-top safe-bottom">
      <div className="px-4 pt-8 pb-24">
        <div className="max-w-md mx-auto space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">My Motivators</h1>
            <p className="text-muted-foreground">
              Your personal collection of inspiration and motivation
            </p>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={handleVoiceMotivator}
              className="h-20 flex flex-col items-center justify-center bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Mic className="w-6 h-6 mb-1" />
              <span className="text-sm font-medium">Voice</span>
            </Button>
            
            <Button 
              onClick={() => setShowFormModal(true)}
              className="h-20 flex flex-col items-center justify-center bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Plus className="w-6 h-6 mb-1" />
              <span className="text-sm font-medium">Manual</span>
            </Button>
          </div>

          {/* Motivators List */}
          {loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading your motivators...</p>
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
                      {/* Image */}
                      <div className="w-20 h-20 bg-muted flex items-center justify-center flex-shrink-0">
                        {motivator.imageUrl ? (
                          <img 
                            src={motivator.imageUrl} 
                            alt={motivator.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Image className="w-8 h-8 text-muted-foreground" />
                        )}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 p-4">
                        <div className="flex items-start justify-between">
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
                          
                          {/* Actions */}
                          <div className="flex gap-1 ml-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditMotivator(motivator)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="ghost">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
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
  );
};

export default Motivators;