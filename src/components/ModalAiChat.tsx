import { useState, useEffect, useRef } from 'react';
import { Send, X, Edit, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { UniversalModal } from '@/components/ui/universal-modal';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CircularVoiceButton } from '@/components/CircularVoiceButton';
import { useAuth } from '@/hooks/useAuth';
import { useOptimizedSubscription } from '@/hooks/optimized/useOptimizedSubscription';
import { PremiumGate } from '@/components/PremiumGate';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ModalAiChatProps {
  isOpen: boolean;
  onClose: () => void;
  onResult?: (result: any) => void;
  context?: string;
  title?: string;
  systemPrompt?: string;
  conversationType?: 'general' | 'crisis';
  proactiveMessage?: string;
  quickReplies?: string[];
}

export const ModalAiChat = ({ 
  isOpen, 
  onClose, 
  onResult, 
  context = '',
  title = 'AI Assistant',
  systemPrompt = 'You are a helpful AI assistant.',
  conversationType = 'general',
  proactiveMessage = '',
  quickReplies = []
}: ModalAiChatProps) => {
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [lastFoodSuggestion, setLastFoodSuggestion] = useState<any>(null);
  const [lastMotivatorSuggestion, setLastMotivatorSuggestion] = useState<any>(null);
  const [editingFoodIndex, setEditingFoodIndex] = useState<number | null>(null);
  const [inlineEditData, setInlineEditData] = useState<{[key: number]: any}>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);


  useEffect(() => {
    if (isOpen) {
      // Initialize messages array
      const initialMessages: Message[] = [];
      
      // Add context message if provided
      if (context) {
        const contextMessage: Message = {
          role: 'assistant',
          content: context,
          timestamp: new Date()
        };
        initialMessages.push(contextMessage);
      }
      
      // For crisis conversations, add proactive message immediately
      if (conversationType === 'crisis' && proactiveMessage) {
        const proactiveMsg: Message = {
          role: 'assistant',
          content: proactiveMessage,
          timestamp: new Date()
        };
        initialMessages.push(proactiveMsg);
      }
      
      setMessages(initialMessages);
      setLastFoodSuggestion(null);
      setLastMotivatorSuggestion(null);
    } else if (!isOpen) {
      // Clear messages when modal closes - but only after a small delay to prevent flickering
      setTimeout(() => {
        setMessages([]);
        setEditingFoodIndex(null);
        setInlineEditData({});
        setLastFoodSuggestion(null);
        setLastMotivatorSuggestion(null);
      }, 100);
    }
  }, [isOpen, context, conversationType, proactiveMessage]);

  const getHighCarbAlternatives = (foodName: string): string | null => {
    const lowercaseFood = foodName.toLowerCase();
    
    if (lowercaseFood.includes('bread') || lowercaseFood.includes('toast')) {
      return 'lettuce wraps, cloud bread, or cauliflower bread';
    } else if (lowercaseFood.includes('pasta') || lowercaseFood.includes('noodle')) {
      return 'zucchini noodles, spaghetti squash, or shirataki noodles';
    } else if (lowercaseFood.includes('rice')) {
      return 'cauliflower rice, broccoli rice, or shirataki rice';
    } else if (lowercaseFood.includes('potato')) {
      return 'roasted cauliflower, turnips, or radishes';
    } else if (lowercaseFood.includes('cereal') || lowercaseFood.includes('oat')) {
      return 'chia seed pudding, Greek yogurt with nuts, or scrambled eggs';
    }
    
    return null;
  };

  const sendToAI = async (message: string, fromVoice = false) => {
    console.log('📤 sendToAI called:', { message, fromVoice, isProcessing });
    setIsProcessing(true);

    try {
      const conversationHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      // Enhanced system prompt based on context
      let enhancedSystemPrompt = systemPrompt;
      
      if (title === 'Food Assistant') {
        enhancedSystemPrompt = `${systemPrompt}

You are a concise food tracking assistant. Your goal is to:
1. IMMEDIATELY process food information and call add_multiple_foods function
2. ONLY respond with clean, minimal format: "Food Name (Amount) - Calories cal, Carbs g carbs" for each item
3. NO explanatory text, walking times, or verbose descriptions
4. Use reasonable portion sizes (150g apple, 100g chicken breast, 60g bread slice, etc.)
5. Always call add_multiple_foods function immediately when processing food input

CRITICAL: Response format must ONLY be:
- Ham (200g) - 240 cal, 2g carbs
- Mozzarella (125g) - 315 cal, 1.5g carbs

Total: 555 calories, 3.5g carbs

NO other text. Immediately call add_multiple_foods function.`;
      } else if (title === 'Motivator Assistant') {
        enhancedSystemPrompt = `${systemPrompt}

You are helping users create motivational content for their fasting and health journey. Your goal is to:
1. Listen to what motivates them and create personalized motivators
2. Help them articulate their goals, reasons, and inspiration  
3. Create compelling titles and content for their motivators
4. Be supportive and encouraging
5. Focus on their SPECIFIC motivation, not generic health advice

CRITICAL: When creating motivators, be SPECIFIC to what the user said:
- If they mention wanting to "impress a girl", focus on confidence and attraction, not generic health
- If they mention a specific event, reference that event
- If they mention a person, acknowledge that motivation
- Keep titles to 3 words maximum
- Make content personal and specific to their exact words

IMPORTANT: ALWAYS respond with BOTH:
1. A conversational message explaining what you're creating and acknowledging their motivation
2. The create_motivator function call with the specific details

For example, if they say "I want to impress a girl", respond with a message like "I understand you want to feel confident and attractive! Let me create a motivator specifically for that goal..." AND call the create_motivator function.

When a user shares what motivates them, ALWAYS provide both a conversational response AND use the create_motivator function with their specific motivation.`;
      }

      const { data, error } = await supabase.functions.invoke('chat-completion', {
        body: { 
          messages: [
            { role: 'system', content: enhancedSystemPrompt },
            ...conversationHistory,
            { role: 'user', content: message }
          ]
        }
      });

      if (error) throw error;

      console.log('🤖 AI Response received:', { data, completion: data?.completion, functionCall: data?.functionCall });

      // Handle AI response - always create a message, even if only function call
      let responseContent = data?.completion || '';
      
      // If no completion but there's a function call, create a default response
      if (!responseContent && data?.functionCall) {
        if (data.functionCall.name === 'create_motivator' && title === 'Motivator Assistant') {
          responseContent = "I've created a motivator suggestion for you based on what you shared. Here are the details:\n\n" +
            `**Title:** ${data.functionCall.arguments?.title || 'Personal Motivator'}\n\n` +
            `**Content:** ${data.functionCall.arguments?.content || 'Motivational content based on your goals'}`;
        } else if (data.functionCall.name === 'add_multiple_foods' && title === 'Food Assistant') {
          const foods = data.functionCall.arguments?.foods || [];
          const totalCalories = foods.reduce((sum: number, food: any) => sum + (food.calories || 0), 0);
          const totalCarbs = foods.reduce((sum: number, food: any) => sum + (food.carbs || 0), 0);
          
          let baseResponse = '';
          
          foods.forEach((food: any, index: number) => {
            baseResponse += `${food.name} (${food.serving_size}g) - ${food.calories} cal, ${food.carbs}g carbs\n`;
          });
          
          baseResponse += `\nTotal: ${totalCalories} calories, ${totalCarbs}g carbs`;
          responseContent = baseResponse;
        } else if (data.functionCall.name === 'add_food_entry' && title === 'Food Assistant') {
          const args = data.functionCall.arguments;
          const carbCount = args?.carbs || 0;
          const foodName = args?.name || 'Food item';
          
          let baseResponse = `${foodName} (${args?.serving_size || 0}g) - ${args?.calories || 0} cal, ${carbCount}g carbs`;
          
          responseContent = baseResponse;
        } else {
          responseContent = "I've processed your request and prepared a suggestion for you.";
        }
      }

      // Always add a message if we have content
      if (responseContent) {
        const aiMessage: Message = {
          role: 'assistant',
          content: responseContent,
          timestamp: new Date()
        };

        console.log('💬 Adding AI message to chat:', aiMessage.content);
        setMessages(prev => {
          const newMessages = [...prev, aiMessage];
          console.log('📝 Messages after adding AI response:', newMessages.length);
          return newMessages;
        });
      } else {
        console.log('⚠️ No completion or function call in AI response');
      }

      // Handle function call results and store suggestions
      if (data.functionCall) {
        // Store the suggestions for button actions
        if (data.functionCall.name === 'add_food_entry') {
          setLastFoodSuggestion(data.functionCall.arguments);
        } else if (data.functionCall.name === 'add_multiple_foods') {
          setLastFoodSuggestion(data.functionCall.arguments);
        } else if (data.functionCall.name === 'create_motivator') {
          setLastMotivatorSuggestion(data.functionCall);
        }
        
        // Only pass to parent immediately for certain actions
        if (onResult && (message.includes('Yes, add it') || message.includes('Yes, add all') || message.includes('Yes, create this motivator'))) {
          onResult(data.functionCall);
        }
      }

    } catch (error) {
      console.error('Error sending message to AI:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };


  const handleVoiceTranscription = async (transcription: string) => {
    console.log('🎤 Voice transcription received:', transcription);
    if (!transcription.trim()) return;

    const userMessage: Message = {
      role: 'user',
      content: transcription,
      timestamp: new Date()
    };

    console.log('👤 Adding user voice message to chat');
    setMessages(prev => [...prev, userMessage]);
    await sendToAI(transcription, true);
  };

  const handleSendMessage = async (presetMessage?: string) => {
    const messageToSend = presetMessage || inputMessage.trim();
    if (!messageToSend || isProcessing) return;

    const userMessage: Message = {
      role: 'user',
      content: messageToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);

    if (!presetMessage) {
      setInputMessage('');
    }

    await sendToAI(messageToSend);
  };

  const handleInlineEdit = (foodIndex: number) => {
    if (lastFoodSuggestion?.foods && lastFoodSuggestion.foods[foodIndex]) {
      const food = lastFoodSuggestion.foods[foodIndex];
      setInlineEditData(prev => ({
        ...prev,
        [foodIndex]: {
          name: food.name || '',
          portion: food.serving_size?.toString() || '',
          calories: food.calories?.toString() || '',
          carbs: food.carbs?.toString() || ''
        }
      }));
      setEditingFoodIndex(foodIndex);
    }
  };

  const handleSaveInlineEdit = (foodIndex: number) => {
    const editData = inlineEditData[foodIndex];
    if (editData && lastFoodSuggestion?.foods) {
      // Update the food data in the lastFoodSuggestion
      const updatedFoods = [...lastFoodSuggestion.foods];
      updatedFoods[foodIndex] = {
        ...updatedFoods[foodIndex],
        name: editData.name,
        serving_size: parseInt(editData.portion) || 0,
        calories: parseInt(editData.calories) || 0,
        carbs: parseInt(editData.carbs) || 0
      };
      
      // Update the lastFoodSuggestion with new data
      setLastFoodSuggestion(prev => ({
        ...prev,
        foods: updatedFoods
      }));
      
      // Clear editing state
      setEditingFoodIndex(null);
      setInlineEditData(prev => {
        const updated = { ...prev };
        delete updated[foodIndex];
        return updated;
      });
    }
  };

  const handleCancelInlineEdit = (foodIndex: number) => {
    setEditingFoodIndex(null);
    setInlineEditData(prev => {
      const updated = { ...prev };
      delete updated[foodIndex];
      return updated;
    });
  };

  const handleRemoveFood = (foodIndex: number) => {
    if (lastFoodSuggestion?.foods) {
      const updatedFoods = lastFoodSuggestion.foods.filter((_, index) => index !== foodIndex);
      
      // Update the lastFoodSuggestion with filtered foods
      setLastFoodSuggestion(prev => ({
        ...prev,
        foods: updatedFoods
      }));
      
      // Reset editing state if we were editing the removed item
      if (editingFoodIndex === foodIndex) {
        setEditingFoodIndex(null);
        setInlineEditData(prev => {
          const updated = { ...prev };
          delete updated[foodIndex];
          return updated;
        });
      }
    }
  };

  const handleAddAllFoods = async () => {
    if (lastFoodSuggestion?.foods && onResult) {
      // Show processing state
      setIsProcessing(true);
      
      try {
        // Call the result callback directly without showing user message
        await onResult({
          name: 'add_multiple_foods',
          arguments: { foods: lastFoodSuggestion.foods }
        });
        
        // Add a simple confirmation message
        const confirmationMessage: Message = {
          role: 'assistant',
          content: '✅ Foods added successfully!',
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, confirmationMessage]);
        
        // Clear the food suggestion to prevent duplicate buttons
        setLastFoodSuggestion(null);
        
      } catch (error) {
        console.error('Error adding foods:', error);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleCreateMotivator = () => {
    if (lastMotivatorSuggestion && onResult) {
      onResult(lastMotivatorSuggestion);
      // Close the modal after creating
      onClose();
    }
  };

  const handleEditMotivator = () => {
    if (lastMotivatorSuggestion) {
      const currentArgs = lastMotivatorSuggestion.arguments;
      // Send a message to AI asking for edits
      handleSendMessage(`I want to edit this motivator. Current title: "${currentArgs?.title}" and content: "${currentArgs?.content}". Please help me modify it.`);
    }
  };

  // Helper function to check if message contains food suggestion
  const containsFoodSuggestion = (content: string) => {
    const foodKeywords = ['calories', 'carbs', 'grams', 'add this', 'add it', 'food log'];
    const hasKeywords = foodKeywords.some(keyword => content.toLowerCase().includes(keyword));
    const isQuestion = content.includes('?');
    const seemsLikeFood = /\d+\s*(calories|cal|grams?|g\b)/i.test(content);
    
    return hasKeywords && !content.toLowerCase().includes('what food') && (seemsLikeFood || content.toLowerCase().includes('add'));
  };

  // Helper function to check if message contains motivator suggestion
  const containsMotivatorSuggestion = (content: string) => {
    const motivatorKeywords = ['title:', 'content:', 'motivator', 'suggestion ready'];
    const hasKeywords = motivatorKeywords.some(keyword => content.toLowerCase().includes(keyword));
    const hasStructure = content.includes('Title:') || content.includes('Content:') || content.includes('**Title');
    const isGreeting = content.toLowerCase().includes('hello') || content.toLowerCase().includes('welcome') || content.toLowerCase().includes('help you create');
    
    return (hasKeywords || hasStructure) && !isGreeting;
  };

  return (
    <UniversalModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      variant="standard"
      size="md"
      showCloseButton={true}
    >

      {/* Messages with better spacing and scrolling */}
      <div className="space-y-4 min-h-[300px] max-h-[400px] overflow-y-auto mb-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <Card className={`max-w-[85%] p-3 ${
                message.role === 'user' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted'
              }`}>
                <div className="flex items-start gap-2">
                  <div className="flex-1">
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                    
                    {/* Show only total summary for food suggestions, not individual items */}
                    {message.role === 'assistant' && containsFoodSuggestion(message.content) && lastFoodSuggestion?.foods && (
                      <div className="mt-3 p-2 bg-background/30 rounded text-xs font-medium">
                        Total: {lastFoodSuggestion.foods.reduce((sum: number, food: any) => sum + (food.calories || 0), 0)} calories, {lastFoodSuggestion.foods.reduce((sum: number, food: any) => sum + (food.carbs || 0), 0)}g carbs
                      </div>
                    )}

                    {/* Individual food items with inline editing */}
                    {message.role === 'assistant' && containsFoodSuggestion(message.content) && lastFoodSuggestion?.foods && (
                      <div className="mt-3 space-y-2">
                        {lastFoodSuggestion.foods.map((food: any, index: number) => (
                          <div key={index} className="p-2 bg-background/50 rounded text-xs">
                            {editingFoodIndex === index ? (
                              // Inline editing mode
                              <div className="space-y-2">
                                <Input
                                  value={inlineEditData[index]?.name || ''}
                                  onChange={(e) => setInlineEditData(prev => ({
                                    ...prev,
                                    [index]: { ...prev[index], name: e.target.value }
                                  }))}
                                  placeholder="Food name"
                                  className="h-7 text-xs"
                                />
                                <div className="grid grid-cols-3 gap-1">
                                  <div>
                                    <div className="text-xs text-muted-foreground mb-1">Weight (g)</div>
                                    <Input
                                      type="number"
                                      value={inlineEditData[index]?.portion || ''}
                                      onChange={(e) => setInlineEditData(prev => ({
                                        ...prev,
                                        [index]: { ...prev[index], portion: e.target.value }
                                      }))}
                                      className="h-7 text-xs"
                                    />
                                  </div>
                                  <div>
                                    <div className="text-xs text-muted-foreground mb-1">Calories</div>
                                    <Input
                                      type="number"
                                      value={inlineEditData[index]?.calories || ''}
                                      onChange={(e) => setInlineEditData(prev => ({
                                        ...prev,
                                        [index]: { ...prev[index], calories: e.target.value }
                                      }))}
                                      className="h-7 text-xs"
                                    />
                                  </div>
                                  <div>
                                    <div className="text-xs text-muted-foreground mb-1">Carbs (g)</div>
                                    <Input
                                      type="number"
                                      value={inlineEditData[index]?.carbs || ''}
                                      onChange={(e) => setInlineEditData(prev => ({
                                        ...prev,
                                        [index]: { ...prev[index], carbs: e.target.value }
                                      }))}
                                      className="h-7 text-xs"
                                    />
                                  </div>
                                </div>
                                <div className="flex gap-1">
                                  <Button
                                    size="sm"
                                    onClick={() => handleSaveInlineEdit(index)}
                                    className="h-7 px-2 text-xs flex-1"
                                  >
                                    Save
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleCancelInlineEdit(index)}
                                    className="h-7 px-2 text-xs flex-1"
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              // Display mode
                              <div className="flex items-center justify-between">
                                <span>{food.name} ({food.serving_size}g) - {food.calories} cal, {food.carbs}g carbs</span>
                                <div className="flex gap-1">
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={() => handleInlineEdit(index)}
                                    className="h-7 px-2 text-xs"
                                  >
                                    Edit
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={() => handleRemoveFood(index)}
                                    className="h-7 px-2 text-xs text-destructive"
                                  >
                                    Remove
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Crisis Quick Reply Buttons */}
                    {conversationType === 'crisis' && message.role === 'assistant' && quickReplies.length > 0 && index === messages.length - 1 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {quickReplies.map((reply, replyIndex) => (
                          <Button 
                            key={replyIndex}
                            size="sm" 
                            variant="outline"
                            onClick={() => handleSendMessage(reply)}
                            className="text-xs"
                          >
                            {reply}
                          </Button>
                        ))}
                      </div>
                    )}
                    
                     {/* Food assistant action buttons - only show when there are actual foods */}
                     {message.role === 'assistant' && title === 'Food Assistant' && lastFoodSuggestion?.foods && lastFoodSuggestion.foods.length > 0 && (
                       <div className="flex gap-2 mt-3">
                         <Button
                           size="sm"
                           onClick={handleAddAllFoods}
                           className="flex-1"
                           disabled={isProcessing}
                         >
                           {isProcessing ? 'Adding...' : 'Add All Foods'}
                         </Button>
                       </div>
                     )}

                      {/* Voice correction button for follow-up messages */}
                      {message.role === 'assistant' && message.content.includes('Need to make adjustments?') && (
                        <div className="flex justify-center mt-3">
                          <PremiumGate feature="Voice Input">
                            <CircularVoiceButton
                              onTranscription={handleVoiceTranscription}
                              isDisabled={isProcessing}
                              size="sm"
                            />
                          </PremiumGate>
                        </div>
                      )}
                    
                     {/* Motivator suggestion buttons */}
                     {conversationType === 'general' && title === 'Motivator Assistant' && message.role === 'assistant' && containsMotivatorSuggestion(message.content) && (
                       <div className="flex gap-2 mt-3">
                         <Button 
                           size="sm" 
                           onClick={handleCreateMotivator}
                           className="text-xs bg-primary text-primary-foreground"
                         >
                           Create It
                         </Button>
                         <Button 
                           size="sm" 
                           variant="outline"
                           onClick={handleEditMotivator}
                           className="text-xs"
                         >
                           Edit First
                         </Button>
                       </div>
                     )}
                    
                    <p className="text-xs opacity-70 mt-2">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          ))}
          
          {isProcessing && (
            <div className="flex justify-start">
              <Card className="max-w-[85%] p-3 bg-muted">
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  <p className="text-sm">AI is thinking...</p>
                </div>
              </Card>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>


      {/* Input area */}
      {editingFoodIndex === null && (
        <div className="border-t border-border pt-4 mt-4 space-y-3">
          {/* Text Input */}
          <div className="flex gap-2 items-end">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={title === "Motivator Assistant" ? "What motivates you? For example..." : "Ask about food details..."}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
              disabled={isProcessing}
              className="flex-1"
            />
            <Button
              onClick={() => handleSendMessage()}
              disabled={!inputMessage.trim() || isProcessing}
              size="default"
              className="flex-shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          
        {/* Voice Recording */}
        <div className="flex justify-center">
          <PremiumGate feature="Voice Input">
            <CircularVoiceButton
              onTranscription={handleVoiceTranscription}
              isDisabled={isProcessing}
              size="lg"
            />
          </PremiumGate>
        </div>
      </div>
      )}
    </UniversalModal>
  );
};