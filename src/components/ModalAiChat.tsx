import { useState, useEffect, useRef } from 'react';
import { Send, X, Edit, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { SimpleVoiceRecorder } from '@/components/SimpleVoiceRecorder';
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
    } else if (!isOpen) {
      // Clear messages when modal closes
      setMessages([]);
      setShowEditForm(false);
      setLastFoodSuggestion(null);
    }
  }, [isOpen, context, conversationType, proactiveMessage]);

  const sendToAI = async (message: string, fromVoice = false) => {
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

You are helping with food tracking. Your goal is to:
1. Help users add complete food entries with all required information
2. Ensure every food item has: name, portion size (in grams), calories, and carbs
3. Ask clarifying questions if information is missing
4. Provide reasonable estimates for calories and carbs based on food type and portion
5. Be conversational and helpful

When the user provides food information, always use the add_food_entry function to add it to their log.`;
      } else if (title === 'Motivator Assistant') {
        enhancedSystemPrompt = `${systemPrompt}

You are helping users create motivational content for their fasting and health journey. Your goal is to:
1. Listen to what motivates them and create personalized motivators
2. Help them articulate their goals, reasons, and inspiration
3. Create compelling titles and content for their motivators
4. Be supportive and encouraging

When a user shares what motivates them or asks for motivational content, use the create_motivator function to create it immediately. Create motivators from their specific words and experiences.`;
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

      if (data?.completion) {
        const aiMessage: Message = {
          role: 'assistant',
          content: data.completion,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, aiMessage]);
      }

      // Handle function call results and pass to parent
      if (data.functionCall && onResult) {
        // Store the last food suggestion for editing
        if (data.functionCall.name === 'add_food_entry') {
          setLastFoodSuggestion(data.functionCall.arguments);
        }
        onResult(data.functionCall);
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
    if (!transcription.trim()) return;

    const userMessage: Message = {
      role: 'user',
      content: transcription,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    await sendToAI(transcription);
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

  const handleAdjustDetails = () => {
    if (lastFoodSuggestion) {
      setEditFormData({
        name: lastFoodSuggestion.name || '',
        portion: lastFoodSuggestion.serving_size?.toString() || '',
        calories: lastFoodSuggestion.calories?.toString() || '',
        carbs: lastFoodSuggestion.carbs?.toString() || ''
      });
      setShowEditForm(true);
    }
  };

  const handleSaveEditedFood = () => {
    if (onResult) {
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
    setShowEditForm(false);
  };

  // Helper function to check if message contains food suggestion
  const containsFoodSuggestion = (content: string) => {
    const foodKeywords = ['calories', 'carbs', 'grams', 'add this', 'add it', 'food log'];
    const hasKeywords = foodKeywords.some(keyword => content.toLowerCase().includes(keyword));
    const isQuestion = content.includes('?');
    const seemsLikeFood = /\d+\s*(calories|cal|grams?|g\b)/i.test(content);
    
    return hasKeywords && !content.toLowerCase().includes('what food') && (seemsLikeFood || content.toLowerCase().includes('add'));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto max-h-[90vh] mt-4 flex flex-col p-0">
        <DialogHeader className="border-b border-border p-4 flex-shrink-0">
          <DialogTitle className="text-lg font-semibold">{title}</DialogTitle>
        </DialogHeader>

        {/* Messages with better spacing and scrolling */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[300px] max-h-[400px]">
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
                    
                    {/* Conditional confirmation buttons for food suggestions only */}
                    {conversationType === 'general' && message.role === 'assistant' && containsFoodSuggestion(message.content) && (
                      <div className="flex gap-2 mt-3">
                        <Button 
                          size="sm" 
                          onClick={() => handleSendMessage('Yes, add it')}
                          className="text-xs"
                        >
                          Yes, Add It
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={handleAdjustDetails}
                          className="text-xs"
                          disabled={!lastFoodSuggestion}
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          Adjust Details
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
          <div className="flex-shrink-0 border-t border-border p-4 bg-muted/30">
            <h3 className="font-medium mb-3">Adjust Food Details</h3>
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
          </div>
        )}

        {/* Input */}
        {!showEditForm && (
          <div className="flex-shrink-0 border-t border-border p-4 space-y-3">
          {/* Text Input */}
          <div className="flex gap-2 items-end">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask about food details..."
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
          
          {/* Simple Voice Recording */}
          <SimpleVoiceRecorder
            onTranscription={handleVoiceTranscription}
            isDisabled={isProcessing}
          />
        </div>
        )}
      </DialogContent>
    </Dialog>
  );
};