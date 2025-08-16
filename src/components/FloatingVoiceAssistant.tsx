import { useState, useRef, useEffect } from 'react';
import { Mic, MessageCircle, X, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  const { user } = useAuth();
  const messagesRef = useRef<HTMLDivElement>(null);
  
  // Import session hooks for actual function execution
  const { currentSession: fastingSession, startFastingSession, endFastingSession } = useFastingSession();
  const { currentSession: walkingSession, startWalkingSession, endWalkingSession } = useWalkingSession();
  const { profile } = useProfile();
  const { context: foodContext, buildContextString, refreshContext } = useFoodContext();

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
    if (transcription.trim()) {
      setIsOpen(true); // Show chat when voice message received
      sendToAI(transcription, true);
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

  // Function execution handlers - Actually perform the requested actions
  const handleAddMultipleFoods = async (args: any): Promise<string> => {
    const foods = args?.foods || [];
    if (foods.length === 0) return 'No foods to add.';

    try {
      for (const food of foods) {
        const { data, error } = await supabase
          .from('food_entries')
          .insert({
            user_id: user!.id,
            name: food.name,
            serving_size: food.serving_size,
            calories: food.calories,
            carbs: food.carbs || 0,
            protein: food.protein || 0,
            fat: food.fat || 0,
            fiber: food.fiber || 0
          });

        if (error) throw error;
      }

      // Refresh food context after adding
      await refreshContext();
      
      const totalCalories = foods.reduce((sum: number, food: any) => sum + (food.calories || 0), 0);
      const foodList = foods.map((food: any) => `${food.name} (${food.serving_size}g)`).join(', ');
      
      return `Added ${foodList} - ${totalCalories} calories total`;
    } catch (error) {
      console.error('Error adding foods:', error);
      return 'Sorry, I had trouble adding those foods. Please try again.';
    }
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

  const clearChat = () => {
    setMessages([]);
    setIsOpen(false);
    setShowInput(false);
  };

  return (
    <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50">
      {/* Chat Messages */}
      {isOpen && messages.length > 0 && (
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
        {isOpen && messages.length > 0 && (
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