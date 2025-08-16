import { useState, useRef, useEffect } from 'react';
import { Mic, MessageCircle, X, Send, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { CircularVoiceButton } from '@/components/CircularVoiceButton';
import { ChatBubble } from '@/components/ChatBubble';
import { PremiumGate } from '@/components/PremiumGate';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useFastingSession } from '@/hooks/useFastingSession';
import { useWalkingSession } from '@/hooks/useWalkingSession';
import { useProfile } from '@/hooks/useProfile';
import { useFoodContext } from '@/hooks/useFoodContext';
import { useMotivators } from '@/hooks/useMotivators';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export const FloatingVoiceAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [pendingFoods, setPendingFoods] = useState<any[]>([]);
  const [selectedFoodIds, setSelectedFoodIds] = useState<Set<number>>(new Set());
  const [editingFoodIndex, setEditingFoodIndex] = useState<number | null>(null);
  const [inlineEditData, setInlineEditData] = useState<{[key: number]: any}>({});
  const { user } = useAuth();
  const messagesRef = useRef<HTMLDivElement>(null);
  
  // Import session hooks for actual function execution
  const { currentSession: fastingSession, startFastingSession, endFastingSession } = useFastingSession();
  const { currentSession: walkingSession, startWalkingSession, endWalkingSession } = useWalkingSession();
  const { profile } = useProfile();
  const { context: foodContext, buildContextString, refreshContext } = useFoodContext();
  const { updateMotivator, deleteMotivator } = useMotivators();

  const scrollToBottom = () => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addMessage = (role: 'user' | 'assistant', content: string) => {
    console.log('💬 Adding message:', { role, content: content.substring(0, 50) + '...' });
    
    const newMessage: Message = {
      id: Date.now().toString(),
      role,
      content,
      timestamp: new Date()
    };
    
    setMessages(prev => {
      const updated = [...prev, newMessage];
      console.log('💬 Messages state updated, total messages:', updated.length);
      return updated;
    });
    
    return newMessage.id;
  };

  const sendToAI = async (message: string, fromVoice = false) => {
    console.log('🤖 AI Chat: Starting request with message:', message);
    
    if (!user || isProcessing) {
      console.log('🤖 AI Chat: Blocked - no user or already processing');
      return;
    }

    console.log('🤖 AI Chat: Adding user message to chat');
    const userMessageId = addMessage('user', message);
    setIsProcessing(true);

    try {
      // Get current page context
      const currentPath = window.location.pathname;
      const pageContext = getPageContext(currentPath);

      // Simplified system prompt - let edge function handle detailed knowledge
      const systemPrompt = `You are a helpful assistant for a fasting and health tracking app. Help users with app features, calculations, unit conversions, and guidance. Current page: ${pageContext}`;

      console.log('🤖 AI Chat: Making Supabase function call');

      const { data, error } = await supabase.functions.invoke('chat-completion', {
        body: {
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message }
          ]
        }
      });

      console.log('🤖 AI Chat: Supabase function response:', { data, error });

      if (error) {
        console.error('🤖 AI Chat: Supabase function error:', error);
        throw error;
      }

      console.log('🤖 AI Chat: Processing response - completion:', data?.completion, 'functionCall:', data?.functionCall);

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
            case 'edit_motivator':
              responseMessage = await handleEditMotivator(data.functionCall.arguments);
              break;
            case 'delete_motivator':
              responseMessage = await handleDeleteMotivator(data.functionCall.arguments);
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
            default:
              responseMessage = 'I processed your request successfully.';
          }
        } catch (error) {
          console.error('🤖 AI Chat: Function execution error:', error);
          responseMessage = 'Sorry, I had trouble processing that request. Please try again.';
        }
        
        addMessage('assistant', responseMessage);
        
        if (fromVoice) {
          await playTextAsAudio(responseMessage);
        }
      }
      // Handle regular completion responses
      else if (data?.completion && data.completion.trim()) {
        console.log('🤖 AI Chat: Adding assistant message:', data.completion);
        addMessage('assistant', data.completion);
        
        // Play audio if from voice
        if (fromVoice) {
          console.log('🤖 AI Chat: Playing audio response');
          await playTextAsAudio(data.completion);
        }
      }
      // Handle empty responses gracefully
      else {
        console.log('🤖 AI Chat: Empty response received, providing fallback message');
        const fallbackMessage = 'I heard you, but I\'m not sure how to help with that. Could you try asking differently?';
        addMessage('assistant', fallbackMessage);
        
        if (fromVoice) {
          await playTextAsAudio(fallbackMessage);
        }
      }
      
      console.log('🤖 AI Chat: Successfully processed response');
    } catch (error) {
      console.error('🤖 AI Chat: Error occurred:', error);
      toast({
        title: "Error",
        description: "Failed to get AI response. Please try again.",
        variant: "destructive"
      });
    } finally {
      console.log('🤖 AI Chat: Finished processing, setting isProcessing to false');
      setIsProcessing(false);
    }
  };

  const playTextAsAudio = async (text: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: { text: text.slice(0, 500) } // Limit length
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
    console.log('🎤 FloatingVoiceAssistant: handleVoiceTranscription called with:', transcription);
    if (transcription.trim()) {
      console.log('🎤 FloatingVoiceAssistant: Opening chat and sending to AI');
      setIsOpen(true); // Show chat when voice message received
      sendToAI(transcription, true);
    } else {
      console.log('🎤 FloatingVoiceAssistant: Empty transcription, ignoring');
    }
  };

  const handleSendMessage = () => {
    if (inputMessage.trim() && !isProcessing) {
      setIsOpen(true); // Show chat when text message sent
      sendToAI(inputMessage);
      setInputMessage('');
      setShowInput(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
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
    
    return ''; // Return empty to prevent message, we'll show the preview UI
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
        const { error } = await supabase
          .from('food_entries')
          .insert({
            user_id: user!.id,
            name: food.name,
            serving_size: food.serving_size || 100,
            calories: food.calories || 0,
            carbs: food.carbs || 0,
            source_date: new Date().toISOString().split('T')[0]
          });

        if (error) throw error;
      }

      await refreshContext();
      
      const totalCalories = selectedFoods.reduce((sum: number, food: any) => sum + (food.calories || 0), 0);
      const foodList = selectedFoods.map((food: any) => `${food.name} (${food.serving_size}g)`).join(', ');
      
      setPendingFoods([]);
      setSelectedFoodIds(new Set());
      
      addMessage('assistant', `Added ${foodList} - ${totalCalories} calories total`);
      
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
      const { data, error } = await supabase
        .from('motivators')
        .insert({
          user_id: user!.id,
          title: args.title,
          content: args.content
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
      await updateMotivator(motivator_id, updates);
      return `Updated motivator: "${updates.title || 'motivator'}"`;
    } catch (error) {
      console.error('Error editing motivator:', error);
      return 'Sorry, I had trouble editing that motivator.';
    }
  };

  const handleDeleteMotivator = async (args: any): Promise<string> => {
    try {
      const { motivator_id } = args;
      await deleteMotivator(motivator_id);
      return 'Motivator deleted successfully.';
    } catch (error) {
      console.error('Error deleting motivator:', error);
      return 'Sorry, I had trouble deleting that motivator.';
    }
  };

  const clearChat = () => {
    setMessages([]);
    setIsOpen(false);
    setShowInput(false);
    setPendingFoods([]);
    setSelectedFoodIds(new Set());
    setEditingFoodIndex(null);
    setInlineEditData({});
  };

  return (
    <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50">
      {/* Chat Messages */}
      {isOpen && (messages.length > 0 || pendingFoods.length > 0) && (
        <div 
          ref={messagesRef}
          className="absolute bottom-16 right-0 w-full max-w-sm md:w-80 max-h-96 overflow-y-auto space-y-3 pb-4 pr-2"
        >
          {messages.map((message, index) => (
            <ChatBubble
              key={message.id}
              message={message}
              isLast={index === messages.length - 1}
              onDismiss={() => {
                setMessages(prev => prev.filter(m => m.id !== message.id));
              }}
            />
          ))}
          
          {/* Food Preview Section */}
          {pendingFoods.length > 0 && (
            <div className="px-2 space-y-4">
              <Card className="bg-background/95 backdrop-blur-sm border-border/50">
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-3 text-sm">Review and Add Foods</h3>
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
                              className="text-xs h-8"
                            />
                            <Input
                              type="number"
                              value={inlineEditData[index]?.serving_size ?? food.serving_size}
                              onChange={(e) => setInlineEditData(prev => ({
                                ...prev,
                                [index]: { ...prev[index], serving_size: parseFloat(e.target.value) || 0 }
                              }))}
                              placeholder="Size (g)"
                              className="text-xs h-8"
                            />
                            <Input
                              type="number"
                              value={inlineEditData[index]?.calories ?? food.calories}
                              onChange={(e) => setInlineEditData(prev => ({
                                ...prev,
                                [index]: { ...prev[index], calories: parseFloat(e.target.value) || 0 }
                              }))}
                              placeholder="Calories"
                              className="text-xs h-8"
                            />
                            <Input
                              type="number"
                              value={inlineEditData[index]?.carbs ?? food.carbs}
                              onChange={(e) => setInlineEditData(prev => ({
                                ...prev,
                                [index]: { ...prev[index], carbs: parseFloat(e.target.value) || 0 }
                              }))}
                              placeholder="Carbs (g)"
                              className="text-xs h-8"
                            />
                          </div>
                        ) : (
                          <div className="flex-1 text-xs">
                            <div className="font-medium">{food.name}</div>
                            <div className="text-muted-foreground">
                              {food.serving_size}g • {food.calories} cal • {food.carbs}g carbs
                            </div>
                          </div>
                        )}
                        
                        <div className="flex gap-1">
                          {editingFoodIndex === index ? (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0"
                                onClick={() => {
                                  if (inlineEditData[index]) {
                                    updatePendingFood(index, inlineEditData[index]);
                                  }
                                  setEditingFoodIndex(null);
                                }}
                              >
                                ✓
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0"
                                onClick={() => {
                                  setEditingFoodIndex(null);
                                  setInlineEditData(prev => {
                                    const updated = { ...prev };
                                    delete updated[index];
                                    return updated;
                                  });
                                }}
                              >
                                ✕
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0"
                                onClick={() => setEditingFoodIndex(index)}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0"
                                onClick={() => removePendingFood(index)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex gap-2 mt-4">
                    <Button
                      size="sm"
                      onClick={confirmAddFoods}
                      disabled={selectedFoodIds.size === 0}
                      className="flex-1"
                    >
                      Add Selected ({selectedFoodIds.size})
                    </Button>
                    <Button
                      size="sm"
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
        </div>
      )}

      {/* Text Input */}
      {showInput && (
        <div className="absolute bottom-16 right-0 w-full max-w-sm md:w-80 mb-2">
          <div className="flex gap-2 p-3 bg-background/95 backdrop-blur-sm border border-border rounded-lg shadow-lg">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about the app..."
              className="flex-1"
              autoFocus
            />
            <Button 
              size="sm" 
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isProcessing}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Main Button */}
      <div className="flex items-center gap-2">
        {/* Clear Chat Button */}
        {isOpen && (messages.length > 0 || pendingFoods.length > 0) && (
          <Button
            variant="outline"
            size="sm"
            onClick={clearChat}
            className="animate-fade-in"
          >
            <X className="h-4 w-4" />
          </Button>
        )}

        {/* Text Chat Toggle */}
        <Button
          variant={showInput ? "default" : "outline"}
          size="sm"
          onClick={() => setShowInput(!showInput)}
          className="animate-fade-in"
        >
          <MessageCircle className="h-4 w-4" />
        </Button>

        {/* Voice Button */}
        <PremiumGate feature="voice_chat">
          <div className="shadow-lg hover:shadow-xl transition-shadow">
            <CircularVoiceButton
              onTranscription={handleVoiceTranscription}
              isDisabled={isProcessing}
            />
          </div>
        </PremiumGate>
      </div>

      {/* Processing Indicator - Tiny brain at bottom */}
      {isProcessing && (
        <div className="fixed bottom-2 right-2 z-50 flex items-center gap-1 bg-background/90 backdrop-blur-sm border border-border rounded-full px-2 py-1 shadow-lg text-xs">
          <div className="text-lg animate-pulse">🧠</div>
          <span className="text-xs text-muted-foreground hidden sm:inline">thinking...</span>
        </div>
      )}
    </div>
  );
};