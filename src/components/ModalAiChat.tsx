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

      // Handle function calls for food and motivator suggestions
      if (data.functionCall) {
        if (data.functionCall.name === 'add_multiple_foods') {
          setLastFoodSuggestion(data.functionCall.arguments);
          // Don't add any AI message for food suggestions - just show the interactive UI
          return;
        } else if (data.functionCall.name === 'create_motivator') {
          setLastMotivatorSuggestion(data.functionCall);
          // Add a simple prompt for motivator
          const motivatorMessage: Message = {
            role: 'assistant',
            content: 'I have a motivator suggestion for you.',
            timestamp: new Date()
          };
          setMessages(prev => [...prev, motivatorMessage]);
          return;
        }
      }

      // Only add completion text if it exists and doesn't contain food suggestions
      if (data.completion && data.completion.trim() && !containsFoodSuggestion(data.completion)) {
        const aiMessage: Message = {
          role: 'assistant',
          content: data.completion,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiMessage]);
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
        
        // Add only the simple confirmation message
        const confirmationMessage: Message = {
          role: 'assistant',
          content: '✅ Foods added successfully!',
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, confirmationMessage]);
        
        // Mark foods as added but keep them visible
        setLastFoodSuggestion(prev => ({
          ...prev,
          added: true
        }));
        
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

        {/* Individual food items with inline editing - show outside of messages */}
        {lastFoodSuggestion?.foods && lastFoodSuggestion.foods.length > 0 && (
          <div className="space-y-2">
            {/* Total summary */}
            <Card className="p-3 bg-muted/50">
              <div className="text-sm font-medium">
                Total: {lastFoodSuggestion.foods.reduce((sum: number, food: any) => sum + (food.calories || 0), 0)} calories, {lastFoodSuggestion.foods.reduce((sum: number, food: any) => sum + (food.carbs || 0), 0)}g carbs
                {lastFoodSuggestion.added && (
                  <span className="ml-2 text-green-600 text-xs">✅ Added to log</span>
                )}
              </div>
            </Card>
            
            {lastFoodSuggestion.foods.map((food: any, index: number) => (
              <Card key={index} className="p-3 bg-background border">
                {editingFoodIndex === index ? (
                  // Inline editing mode
                  <div className="space-y-2">{/* ... rest of inline editing JSX ... */}
                    <Input
                      value={inlineEditData[index]?.name || ''}
                      onChange={(e) => setInlineEditData(prev => ({
                        ...prev,
                        [index]: { ...prev[index], name: e.target.value }
                      }))}
                      placeholder="Food name"
                      className="h-8 text-sm"
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
                          className="h-8 text-sm"
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
                          className="h-8 text-sm"
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
                          className="h-8 text-sm"
                        />
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        onClick={() => handleSaveInlineEdit(index)}
                        className="h-8 px-3 text-sm flex-1"
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCancelInlineEdit(index)}
                        className="h-8 px-3 text-sm flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  // Display mode
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="text-sm font-medium">{food.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {food.serving_size}g • {food.calories} cal • {food.carbs}g carbs
                      </div>
                    </div>
                    {!lastFoodSuggestion.added && (
                      <div className="flex gap-1 ml-3">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleInlineEdit(index)}
                          className="h-8 px-3 text-sm"
                        >
                          Edit
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleRemoveFood(index)}
                          className="h-8 px-3 text-sm text-destructive"
                        >
                          Remove
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            ))}
            
            {/* Add All Foods button - only show if not added yet */}
            {!lastFoodSuggestion.added && (
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
          </div>
        )}
        
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