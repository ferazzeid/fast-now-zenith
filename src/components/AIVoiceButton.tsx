import { useState, useEffect } from 'react';
import { Mic, X, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { CircularVoiceButton } from '@/components/CircularVoiceButton';
import { PremiumGatedCircularVoiceButton } from '@/components/PremiumGatedCircularVoiceButton';
import { FloatingBubble } from '@/components/FloatingBubble';
import { PremiumGate } from '@/components/PremiumGate';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useFastingSession } from '@/hooks/useFastingSession';
import { useWalkingSession } from '@/hooks/useWalkingSession';
import { useProfile } from '@/hooks/useProfile';
import { useFoodContext } from '@/hooks/useFoodContext';
import { useFoodEntriesQuery } from '@/hooks/optimized/useFoodEntriesQuery';
import { conversationMemory } from '@/utils/conversationMemory';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export const AIVoiceButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [bubbles, setBubbles] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingFoods, setPendingFoods] = useState<any[]>([]);
  const [selectedFoodIds, setSelectedFoodIds] = useState<Set<number>>(new Set());
  const [editingFoodIndex, setEditingFoodIndex] = useState<number | null>(null);
  const [inlineEditData, setInlineEditData] = useState<{[key: number]: any}>({});
  const [hasWelcomeMessage, setHasWelcomeMessage] = useState(false);
  const { user } = useAuth();
  
  // Import session hooks for function execution
  const { currentSession: fastingSession, startFastingSession, endFastingSession } = useFastingSession();
  const { currentSession: walkingSession, startWalkingSession, endWalkingSession } = useWalkingSession();
  const { profile } = useProfile();
  const { context: foodContext, buildContextString, refreshContext } = useFoodContext();
  const { addFoodEntry } = useFoodEntriesQuery();

  // Add welcome message when modal opens
  useEffect(() => {
    if (isOpen && !hasWelcomeMessage) {
      const currentPath = window.location.pathname;
      let welcomeMessage = "Hi! I'm your AI assistant. How can I help you today?";
      
      // Create page-specific welcome messages
      switch (currentPath) {
        case '/walking':
          welcomeMessage = "I can help you start/stop walking sessions, track your progress, and answer questions about your fitness goals.";
          break;
        case '/timer':
          welcomeMessage = "I can help you manage your fasting sessions, track progress, and provide guidance.";
          break;
        case '/food-tracking':
          welcomeMessage = "I can help you add foods, track calories, and answer nutrition questions.";
          break;
        case '/motivators':
          welcomeMessage = "I can help you create, edit, and manage your motivational content.";
          break;
        default:
          welcomeMessage = "I can help you with fasting, walking, nutrition tracking, and motivation.";
      }
      
      setBubbles([{
        id: 'welcome-' + Date.now(),
        role: 'assistant',
        content: welcomeMessage,
        timestamp: new Date()
      }]);
      setHasWelcomeMessage(true);
    } else if (!isOpen) {
      // Reset when modal closes
      setHasWelcomeMessage(false);
      setBubbles([]);
    }
  }, [isOpen, hasWelcomeMessage]);


  // Close modal on escape key or click outside
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (isOpen && target.closest('.aquarium-container') === null && target.closest('.ai-voice-button') === null) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const addBubble = (role: 'user' | 'assistant', content: string) => {
    const newBubble: Message = {
      id: Date.now().toString() + Math.random(),
      role,
      content,
      timestamp: new Date()
    };
    
    setBubbles(prev => [...prev, newBubble]);
    return newBubble.id;
  };

  const clearBubbles = () => {
    setBubbles([]);
  };

  const sendToAI = async (message: string, fromVoice = false) => {
    if (!user || isProcessing) return;

    addBubble('user', message);
    setIsProcessing(true);

    try {
      const currentPath = window.location.pathname;
      const pageContext = getPageContext(currentPath);
      const systemPrompt = `You are a helpful assistant for a fasting and health tracking app. Help users with app features, calculations, unit conversions, and guidance. Current page: ${pageContext}`;

      const { data, error } = await supabase.functions.invoke('chat-completion', {
        body: {
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message }
          ]
        }
      });

      if (error) throw error;

        // Handle function calls first - ACTUALLY EXECUTE THEM
        if (data?.functionCall) {
          console.log('🤖 AI Chat: Function call detected:', data.functionCall.name);
          
          let responseMessage = '';
          try {
            switch (data.functionCall.name) {
              case 'add_multiple_foods':
                responseMessage = await handleAddMultipleFoods(data.functionCall.arguments);
                break;
              case 'create_motivator':
                responseMessage = await handleCreateMotivator(data.functionCall.arguments);
                break;
              case 'create_multiple_motivators':
                responseMessage = await handleCreateMultipleMotivators(data.functionCall.arguments);
                break;
              case 'start_fasting_session':
                responseMessage = await handleStartFastingSession(data.functionCall.arguments);
                break;
              case 'stop_fasting_session':
                responseMessage = await handleStopFastingSession();
                break;
              case 'start_walking_session':
                responseMessage = await handleStartWalkingSession(data.functionCall.arguments);
                break;
              case 'stop_walking_session':
                responseMessage = await handleStopWalkingSession();
                break;
              case 'edit_motivator':
                responseMessage = await handleEditMotivator(data.functionCall.arguments);
                break;
              case 'delete_motivator':
                responseMessage = await handleDeleteMotivator(data.functionCall.arguments);
                break;
              case 'modify_recent_foods':
                responseMessage = await handleModifyRecentFoods(data.functionCall.arguments);
                break;
              default:
                responseMessage = 'I processed your request successfully.';
            }
          } catch (error) {
            console.error('🤖 AI Chat: Function execution error:', error);
            responseMessage = 'Sorry, I had trouble processing that request. Please try again.';
          }
          
          // Only add bubble if there's a message to show
          if (responseMessage && responseMessage.trim()) {
            addBubble('assistant', responseMessage);
            
            if (fromVoice) {
              await playTextAsAudio(responseMessage);
            }
          }
        }
      // Handle regular completion responses
      else if (data?.completion && data.completion.trim()) {
        addBubble('assistant', data.completion);
        
        if (fromVoice) {
          await playTextAsAudio(data.completion);
        }
      } else {
        addBubble('assistant', 'Sorry, I had trouble processing your request. Please try again.');
      }
    } catch (error) {
      console.error('AI Chat error:', error);
      toast({
        title: "Error",
        description: "Failed to get AI response. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const playTextAsAudio = async (text: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: { text: text.slice(0, 500) }
      });

      if (error) throw error;

      if (data?.audioUrl) {
        const audio = new Audio(data.audioUrl);
        audio.play();
      }
    } catch (error) {
      console.error('Text-to-speech error:', error);
    }
  };

  const getPageContext = (path: string): string => {
    switch (path) {
      case '/walking':
        return 'Walking page - user can start/stop walking sessions, view walking history, and track calories burned';
      case '/timer':
        return 'Fasting timer page - user can start/stop fasting sessions and see fasting progress';
      case '/food-tracking':
        return 'Food tracking page - user can add food entries, track calories and carbs';
      case '/motivators':
        return 'Motivators page - user can view and manage personal motivation cards';
      case '/settings':
        return 'Settings page - user can configure their profile, goals, and app preferences';
      default:
        return 'Main app interface for fasting and health tracking';
    }
  };

  const handleVoiceTranscription = (transcription: string) => {
    if (transcription.trim()) {
      setIsOpen(true);
      sendToAI(transcription, true);
    }
  };

  // Function execution handlers - Show food preview instead of immediate addition
  const handleAddMultipleFoods = async (args: any): Promise<string> => {
    const foods = args?.foods || [];
    console.log('🍽️ handleAddMultipleFoods called with:', foods);
    
    if (foods.length === 0) return 'No foods to add.';

    // Show food preview instead of immediate insertion
    setPendingFoods(foods);
    setSelectedFoodIds(new Set(foods.map((_: any, index: number) => index)));
    
    return null; // Don't add a message, just show the preview UI
  };

  const confirmAddFoods = async () => {
    const selectedFoods = pendingFoods.filter((_, index) => selectedFoodIds.has(index));
    
    if (selectedFoods.length === 0) {
      toast({
        title: "No foods selected",
        description: "Please select at least one food to add.",
        variant: "destructive"
      });
      return;
    }

    try {
      for (const food of selectedFoods) {
        await addFoodEntry({
          name: food.name,
          serving_size: food.serving_size || 100,
          calories: food.calories || 0,
          carbs: food.carbs || 0,
          consumed: false
        });
      }
      
      const totalCalories = selectedFoods.reduce((sum: number, food: any) => sum + (food.calories || 0), 0);
      const foodList = selectedFoods.map((food: any) => `${food.name} (${food.serving_size}g)`).join(', ');
      
      setPendingFoods([]);
      setSelectedFoodIds(new Set());
      
      addBubble('assistant', `Added ${foodList} - ${totalCalories} calories total`);
      
      toast({
        title: "Foods added successfully",
        description: `Added ${selectedFoods.length} food${selectedFoods.length === 1 ? '' : 's'}`,
      });
    } catch (error) {
      console.error('🍽️ Error adding foods:', error);
      toast({
        title: "Error adding foods",
        description: "Please try again.",
        variant: "destructive"
      });
    }
  };

  const removePendingFood = (index: number) => {
    setPendingFoods(prev => prev.filter((_, i) => i !== index));
    setSelectedFoodIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(index);
      // Re-index remaining items
      const updatedSet = new Set<number>();
      Array.from(newSet).forEach(id => {
        if (id < index) {
          updatedSet.add(id);
        } else if (id > index) {
          updatedSet.add(id - 1);
        }
      });
      return updatedSet;
    });
  };

  const updatePendingFood = (index: number, updates: any) => {
    setPendingFoods(prev => 
      prev.map((food, i) => i === index ? { ...food, ...updates } : food)
    );
  };

  const toggleFoodSelection = (index: number) => {
    setSelectedFoodIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const handleCreateMotivator = async (args: any): Promise<string> => {
    try {
      // Generate a slug from the title for user-created motivators
      const baseSlug = args.title
        .toLowerCase()
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .replace(/\s+/g, '-');
      const uniqueSlug = `${baseSlug}-${Date.now()}`;

      const { data, error } = await supabase
        .from('motivators')
        .insert({
          user_id: user!.id,
          title: args.title,
          content: args.content,
          category: args.category || 'general',
          slug: uniqueSlug,
          is_active: true,
          is_system_goal: false
        });

      if (error) throw error;
      return `Created motivator: "${args.title}"`;
    } catch (error) {
      console.error('Error creating motivator:', error);
      return 'Sorry, I had trouble creating that motivator.';
    }
  };

  const handleCreateMultipleMotivators = async (args: any): Promise<string> => {
    const motivators = args?.motivators || [];
    if (motivators.length === 0) return 'No motivators to create.';

    try {
      const motivatorData = motivators.map((motivator: any) => ({
        user_id: user!.id,
        title: motivator.title,
        content: motivator.content
      }));

      const { data, error } = await supabase
        .from('motivators')
        .insert(motivatorData);

      if (error) throw error;
      return `Created ${motivators.length} motivators successfully!`;
    } catch (error) {
      console.error('Error creating motivators:', error);
      return 'Sorry, I had trouble creating those motivators.';
    }
  };

  const handleStartFastingSession = async (args: any): Promise<string> => {
    try {
      if (fastingSession) {
        return 'You already have an active fasting session running.';
      }
      
      await startFastingSession(16 * 60 * 60); // 16 hours in seconds
      return 'Fasting session started! Good luck with your fast.';
    } catch (error) {
      console.error('Error starting fasting session:', error);
      return 'Sorry, I had trouble starting your fasting session.';
    }
  };

  const handleStopFastingSession = async (): Promise<string> => {
    try {
      if (!fastingSession) {
        return 'You don\'t have an active fasting session to stop.';
      }
      
      await endFastingSession();
      return 'Fasting session completed! Great work on your fast.';
    } catch (error) {
      console.error('Error stopping fasting session:', error);
      return 'Sorry, I had trouble stopping your fasting session.';
    }
  };

  const handleStartWalkingSession = async (args: any): Promise<string> => {
    try {
      if (walkingSession) {
        return 'You already have an active walking session running.';
      }
      
      await startWalkingSession();
      return 'Walking session started! Enjoy your walk.';
    } catch (error) {
      console.error('Error starting walking session:', error);
      return 'Sorry, I had trouble starting your walking session.';
    }
  };

  const handleStopWalkingSession = async (): Promise<string> => {
    try {
      if (!walkingSession) {
        return 'You don\'t have an active walking session to stop.';
      }
      
      await endWalkingSession();
      return 'Walking session completed! Well done.';
    } catch (error) {
      console.error('Error stopping walking session:', error);
      return 'Sorry, I had trouble stopping your walking session.';
    }
  };

  const handleEditMotivator = async (args: any): Promise<string> => {
    try {
      const { motivator_id, updates } = args;
      const { data, error } = await supabase
        .from('motivators')
        .update(updates)
        .eq('id', motivator_id)
        .eq('user_id', user!.id);

      if (error) throw error;
      return `Updated motivator successfully.`;
    } catch (error) {
      console.error('Error editing motivator:', error);
      return 'Sorry, I had trouble updating that motivator.';
    }
  };

  const handleDeleteMotivator = async (args: any): Promise<string> => {
    try {
      const { motivator_id } = args;
      const { data, error } = await supabase
        .from('motivators')
        .delete()
        .eq('id', motivator_id)
        .eq('user_id', user!.id);

      if (error) throw error;
      return `Deleted motivator successfully.`;
    } catch (error) {
      console.error('Error deleting motivator:', error);
      return 'Sorry, I had trouble deleting that motivator.';
    }
  };

  const handleModifyRecentFoods = async (args: any): Promise<string | null> => {
    try {
      const modifications = args?.modifications || {};
      const clarificationText = args?.clarification_text || '';
      console.log('🔄 AIVoiceButton - Processing food modification:', modifications, clarificationText);

      // Use conversation memory to process the modification for pending foods
      const context = conversationMemory.getContext();
      const recentAction = context.recentFoodActions[0];
      
      if (recentAction && pendingFoods.length > 0) {
        const modifiedFoods = conversationMemory.processModification(recentAction, modifications, pendingFoods);
        
        if (modifiedFoods && modifiedFoods.length > 0) {
          setPendingFoods(modifiedFoods);
          const foodNames = modifiedFoods.map(food => food.name).join(', ');
          return `Updated ${foodNames} in preview. Please confirm to save the changes.`;
        }
      }
      
      // If no pending foods, provide helpful feedback
      console.log('AIVoiceButton: No pending foods to modify');
      return 'I can help you modify foods, but I need to see them first. Please add some foods and then ask me to modify them.';
    } catch (error) {
      console.error('AIVoiceButton: Error modifying foods:', error);
      return 'Sorry, I had trouble modifying those foods. Please try again.';
    }
  };

  return (
    <>
      {/* AI Voice Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="ai-voice-button w-8 h-8 p-0 rounded-full bg-ai hover:bg-ai/90 hover:scale-110 transition-all duration-200"
        title="AI Voice Assistant"
      >
        <Mic className="w-4 h-4 text-white" />
      </Button>

      {/* Aquarium Glass Overlay - Constrained to app container */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-center bg-frame-background/50">
          <div className="relative max-w-md w-full bg-background/5 backdrop-blur-lg">
            {/* Close Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 z-10 w-12 h-12 p-0 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 hover:bg-background/90 hover:scale-110 transition-all duration-200"
              title="Close"
            >
              <X className="w-6 h-6 text-foreground" />
            </Button>

            {/* Aquarium Container */}
            <div className="aquarium-container relative w-full h-screen flex flex-col">
              {/* Content Area */}
              <div className="flex-1 overflow-hidden pt-20 pb-24">
                <ScrollArea className="h-full">
                  <div className="max-w-full mx-auto space-y-2">
                    {/* Food Preview Section - Now appears first */}
                    {pendingFoods.length > 0 && (
                      <div className="px-4 space-y-4">
                        <Card className="bg-background/90 backdrop-blur-sm border-border/50">
                          <CardContent className="p-4">
                            <h3 className="font-semibold mb-3">Review and Add Foods</h3>
                            <div className="space-y-3">
                              {pendingFoods.map((food, index) => (
                                <div key={index} className="flex items-center gap-3 p-2 rounded border border-border/50">
                                  <Checkbox
                                    checked={selectedFoodIds.has(index)}
                                    onCheckedChange={() => toggleFoodSelection(index)}
                                    className="shrink-0"
                                  />
                                  
                                  {editingFoodIndex === index ? (
                                    <div className="flex-1 grid grid-cols-2 gap-2">
                                      <Input
                                        value={inlineEditData[index]?.name ?? food.name}
                                        onChange={(e) => setInlineEditData(prev => ({
                                          ...prev,
                                          [index]: { ...prev[index], name: e.target.value }
                                        }))}
                                        placeholder="Food name"
                                        className="text-sm"
                                      />
                                      <Input
                                        type="number"
                                        value={inlineEditData[index]?.serving_size ?? food.serving_size}
                                        onChange={(e) => setInlineEditData(prev => ({
                                          ...prev,
                                          [index]: { ...prev[index], serving_size: Number(e.target.value) }
                                        }))}
                                        placeholder="Serving (g)"
                                        className="text-sm"
                                      />
                                      <Input
                                        type="number"
                                        value={inlineEditData[index]?.calories ?? food.calories}
                                        onChange={(e) => setInlineEditData(prev => ({
                                          ...prev,
                                          [index]: { ...prev[index], calories: Number(e.target.value) }
                                        }))}
                                        placeholder="Calories"
                                        className="text-sm"
                                      />
                                      <Input
                                        type="number"
                                        value={inlineEditData[index]?.carbs ?? food.carbs}
                                        onChange={(e) => setInlineEditData(prev => ({
                                          ...prev,
                                          [index]: { ...prev[index], carbs: Number(e.target.value) }
                                        }))}
                                        placeholder="Carbs (g)"
                                        className="text-sm"
                                      />
                                      <div className="col-span-2 flex gap-2">
                                        <Button
                                          size="sm"
                                          onClick={() => {
                                            updatePendingFood(index, inlineEditData[index] || {});
                                            setEditingFoodIndex(null);
                                            setInlineEditData(prev => {
                                              const { [index]: _, ...rest } = prev;
                                              return rest;
                                            });
                                          }}
                                          className="text-xs"
                                        >
                                          Save
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => {
                                            setEditingFoodIndex(null);
                                            setInlineEditData(prev => {
                                              const { [index]: _, ...rest } = prev;
                                              return rest;
                                            });
                                          }}
                                          className="text-xs"
                                        >
                                          Cancel
                                        </Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <>
                                      <div className="flex-1">
                                        <div className="font-medium text-sm">{food.name}</div>
                                        <div className="text-xs text-muted-foreground">
                                          {food.serving_size}g • {food.calories} cal • {food.carbs}g carbs
                                        </div>
                                      </div>
                                      <div className="flex gap-1">
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => setEditingFoodIndex(index)}
                                          className="h-8 w-8 p-0"
                                        >
                                          <Edit className="h-3 w-3" />
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => removePendingFood(index)}
                                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    </>
                                  )}
                                </div>
                              ))}
                            </div>
                            
                            {/* Summary */}
                            {selectedFoodIds.size > 0 && (
                              <div className="mt-4 p-3 bg-muted/50 rounded border-l-4 border-l-primary">
                                <div className="text-sm font-medium">
                                  Selected: {selectedFoodIds.size} food{selectedFoodIds.size === 1 ? '' : 's'}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  Total: {pendingFoods.filter((_, i) => selectedFoodIds.has(i)).reduce((sum, food) => sum + (food.calories || 0), 0)} calories, {pendingFoods.filter((_, i) => selectedFoodIds.has(i)).reduce((sum, food) => sum + (food.carbs || 0), 0)}g carbs
                                </div>
                              </div>
                            )}
                            
                            {/* Action Buttons */}
                            <div className="flex gap-2 mt-4">
                              <Button
                                onClick={confirmAddFoods}
                                disabled={selectedFoodIds.size === 0}
                                className="flex-1"
                              >
                                Add Selected Foods ({selectedFoodIds.size})
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setPendingFoods([]);
                                  setSelectedFoodIds(new Set());
                                  setEditingFoodIndex(null);
                                  setInlineEditData({});
                                }}
                              >
                                Cancel
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    )}

                    {/* Chat Messages Area - Now appears after food preview */}
                    {bubbles.map((bubble, index) => (
                      <FloatingBubble
                        key={bubble.id}
                        content={bubble.content}
                        role={bubble.role}
                        index={index}
                      />
                    ))}
                    
                    {/* Processing Bubble */}
                    {isProcessing && (
                      <div className="w-full mb-4 flex justify-start px-4">
                        <div className="bg-primary/90 border border-primary/50 rounded-2xl rounded-tl-sm p-4 animate-pulse">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                            <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                            <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>

              {/* Voice Button at Bottom */}
              <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
                <PremiumGatedCircularVoiceButton
                  onTranscription={handleVoiceTranscription}
                  isDisabled={isProcessing}
                  size="lg"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};