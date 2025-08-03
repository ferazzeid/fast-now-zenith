import { useState, useEffect, useRef } from 'react';
import { Send, X, Edit, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { CircularVoiceButton } from '@/components/CircularVoiceButton';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';

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
  
  const [showEditForm, setShowEditForm] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    portion: '',
    calories: '',
    carbs: ''
  });
  const [lastFoodSuggestion, setLastFoodSuggestion] = useState<any>(null);
  const [lastMotivatorSuggestion, setLastMotivatorSuggestion] = useState<any>(null);
  const [editingFoodIndex, setEditingFoodIndex] = useState<number>(0);
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
      // Clear messages when modal closes
      setMessages([]);
      setShowEditForm(false);
      setLastFoodSuggestion(null);
      setLastMotivatorSuggestion(null);
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

You are a decisive food tracking assistant. Your goal is to:
1. IMMEDIATELY process food information and create entries with reasonable estimations
2. DO NOT ask for more details - make smart estimations based on common serving sizes
3. For multiple foods mentioned, use add_multiple_foods function to handle them all at once
4. Always format responses as: food list + total + "Would you like me to add these to your food log?"

CRITICAL RULES:
- NEVER ask "do you have more information" - estimate and present
- ALWAYS use reasonable portion sizes (150g apple, 100g chicken breast, 60g bread slice, etc.)
- For multiple foods, present them in a clean list format
- Include walking time equivalents when helpful
- Be decisive and confident in your estimations

When user mentions food(s), immediately call the appropriate function and present a summary.`;
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
          
          let baseResponse = `I've prepared ${foods.length} food entries for you:\n\n`;
          
          foods.forEach((food: any, index: number) => {
            baseResponse += `${food.name} (${food.serving_size}g) - ${food.calories} cal, ${food.carbs}g carbs\n`;
          });
          
          baseResponse += `\nTotal: ${totalCalories} calories, ${totalCarbs}g carbs\n\nWould you like me to add all these foods to your log?`;
          responseContent = baseResponse;
        } else if (data.functionCall.name === 'add_food_entry' && title === 'Food Assistant') {
          const args = data.functionCall.arguments;
          const carbCount = args?.carbs || 0;
          const foodName = args?.name || 'Food item';
          
          let baseResponse = `I've prepared a food entry for you:\n\n${foodName} (${args?.serving_size || 0}g) - ${args?.calories || 0} cal, ${carbCount}g carbs`;
          
          responseContent = baseResponse + `\n\nWould you like me to add this to your food log?`;
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
          // Send automatic follow-up message for multi-food entries
          setTimeout(() => {
            const followUpMessage: Message = {
              role: 'assistant',
              content: 'Need to make adjustments? Click Edit next to any food above, or use voice to make changes.',
              timestamp: new Date()
            };
            setMessages(prev => [...prev, followUpMessage]);
          }, 500);
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

  const handleAdjustDetails = (foodIndex: number = 0) => {
    if (lastFoodSuggestion) {
      setEditingFoodIndex(foodIndex);
      // Handle both single food and multiple foods
      if (lastFoodSuggestion.foods) {
        const foodToEdit = lastFoodSuggestion.foods[foodIndex];
        setEditFormData({
          name: foodToEdit?.name || '',
          portion: foodToEdit?.serving_size?.toString() || '',
          calories: foodToEdit?.calories?.toString() || '',
          carbs: foodToEdit?.carbs?.toString() || ''
        });
      } else {
        // Single food
        setEditFormData({
          name: lastFoodSuggestion.name || '',
          portion: lastFoodSuggestion.serving_size?.toString() || '',
          calories: lastFoodSuggestion.calories?.toString() || '',
          carbs: lastFoodSuggestion.carbs?.toString() || ''
        });
      }
      setShowEditForm(true);
    }
  };

  const handleSaveEditedFood = () => {
    if (onResult && lastFoodSuggestion) {
      // If editing multiple foods, update the specific food and add all
      if (lastFoodSuggestion.foods) {
        const updatedFoods = [...lastFoodSuggestion.foods];
        updatedFoods[editingFoodIndex] = {
          name: editFormData.name,
          serving_size: parseFloat(editFormData.portion),
          calories: parseFloat(editFormData.calories),
          carbs: parseFloat(editFormData.carbs),
          consumed: false
        };
        onResult({
          name: 'add_multiple_foods',
          arguments: { foods: updatedFoods }
        });
      } else {
        // Single food
        onResult({
          name: 'add_food_entry',
          arguments: {
            name: editFormData.name,
            serving_size: parseFloat(editFormData.portion),
            calories: parseFloat(editFormData.calories),
            carbs: parseFloat(editFormData.carbs),
            consumed: false
          }
        });
      }
    }
    setShowEditForm(false);
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
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="border-b border-border pb-4">
          <DialogTitle className="text-lg font-semibold flex items-center justify-center">{title}</DialogTitle>
        </DialogHeader>

        {/* Messages with better spacing and scrolling */}
        <div className="space-y-4 p-4 min-h-[300px] max-h-[400px] overflow-y-auto">
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
                    
                    {/* Individual food edit buttons for multi-food suggestions */}
                    {message.role === 'assistant' && containsFoodSuggestion(message.content) && lastFoodSuggestion?.foods && (
                      <div className="mt-3 space-y-2">
                        {lastFoodSuggestion.foods.map((food: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-background/50 rounded text-xs">
                            <span>{food.name} ({food.serving_size}g)</span>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => handleAdjustDetails(index)}
                              className="h-6 px-2 text-xs"
                            >
                              Edit
                            </Button>
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
                    
                     {/* Food assistant action buttons */}
                     {message.role === 'assistant' && title === 'Food Assistant' && containsFoodSuggestion(message.content) && (
                       <div className="flex gap-2 mt-3">
                         <Button
                           size="sm"
                           onClick={() => handleSendMessage(lastFoodSuggestion?.foods ? 'Yes, add all these foods' : 'Yes, add it')}
                           className="flex-1"
                         >
                           {lastFoodSuggestion?.foods ? 'Add All Foods' : 'Add Food'}
                         </Button>
                         {/* Only show Quick Edit for single food entries */}
                         {!lastFoodSuggestion?.foods && (
                           <Button
                             size="sm"
                             variant="outline"
                             onClick={() => handleAdjustDetails(0)}
                             className="flex-1"
                           >
                             Quick Edit
                           </Button>
                         )}
                       </div>
                     )}

                     {/* Voice correction button for follow-up messages */}
                     {message.role === 'assistant' && message.content.includes('Need to make adjustments?') && (
                       <div className="flex justify-center mt-3">
                         <CircularVoiceButton
                           onTranscription={handleVoiceTranscription}
                           isDisabled={isProcessing}
                           size="sm"
                         />
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

        {/* Edit Form */}
        {showEditForm && (
          <Card className="p-4 bg-muted/50">
            <h4 className="font-medium mb-3">
              Editing: {editFormData.name}
              {lastFoodSuggestion?.foods && ` (${editingFoodIndex + 1} of ${lastFoodSuggestion.foods.length})`}
            </h4>
            <div className="space-y-3">
              <div>
                <Label htmlFor="edit-name" className="text-sm">Food Name</Label>
                <Input
                  id="edit-name"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="edit-portion" className="text-sm">Portion (g)</Label>
                  <Input
                    id="edit-portion"
                    type="number"
                    value={editFormData.portion}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, portion: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-calories" className="text-sm">Calories</Label>
                  <Input
                    id="edit-calories"
                    type="number"
                    value={editFormData.calories}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, calories: e.target.value }))}
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="edit-carbs" className="text-sm">Carbs (g)</Label>
                <Input
                  id="edit-carbs"
                  type="number"
                  value={editFormData.carbs}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, carbs: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSaveEditedFood} className="flex-1">
                  Add to Food Log
                </Button>
                <Button variant="outline" onClick={() => setShowEditForm(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Input */}
        {!showEditForm && (
          <div className="border-t border-border p-4 space-y-3">
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
            <CircularVoiceButton
              onTranscription={handleVoiceTranscription}
              isDisabled={isProcessing}
              size="lg"
            />
          </div>
        </div>
        )}
      </DialogContent>
    </Dialog>
  );
};