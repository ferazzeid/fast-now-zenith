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

      // Handle function calls first
      if (data?.functionCall) {
        console.log('🤖 AI Chat: Function call detected:', data.functionCall.name);
        
        // Provide appropriate response based on function type
        let responseMessage = '';
        switch (data.functionCall.name) {
          case 'add_multiple_foods':
            responseMessage = 'I found some food information for you. You can add it from the Food Tracking page.';
            break;
          case 'create_motivator':
          case 'create_multiple_motivators':
            responseMessage = 'I created some motivational content for you. Check your Motivators page to see it.';
            break;
          case 'start_fasting_session':
            responseMessage = 'Fasting session started! You can track your progress on the Timer page.';
            break;
          case 'stop_fasting_session':
            responseMessage = 'Fasting session stopped. Great job on your fast!';
            break;
          case 'start_walking_session':
            responseMessage = 'Walking session started! Track your activity on the Walking page.';
            break;
          case 'stop_walking_session':
            responseMessage = 'Walking session completed. Well done!';
            break;
          default:
            responseMessage = 'I processed your request successfully.';
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