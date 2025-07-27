import { useState, useEffect, useRef } from 'react';
import { X, Send, Loader, Sparkles, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useMotivators } from '@/hooks/useMotivators';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface MotivatorAiChatModalProps {
  onClose: () => void;
}

export const MotivatorAiChatModal = ({ onClose }: MotivatorAiChatModalProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingMotivators, setIsCreatingMotivators] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { createMotivator, refreshMotivators } = useMotivators();

  // Initial AI message
  useEffect(() => {
    const initialMessage: Message = {
      role: 'assistant',
      content: `Hi! I'm here to help you create personalized motivators for your fasting journey. 🌟

I'll ask you some questions to understand what motivates you most, then create several powerful motivators tailored just for you.

Let's start: What's your main goal with fasting? Is it weight loss, health improvement, mental clarity, or something else?`,
      timestamp: new Date()
    };
    setMessages([initialMessage]);
  }, []);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!currentMessage.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: currentMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setIsLoading(true);

    try {
      // Build conversation history for context
      const conversationHistory = [...messages, userMessage].map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const { data, error } = await supabase.functions.invoke('chat-completion', {
        body: {
          messages: [
            {
              role: 'system',
              content: `You are a motivational coach specialized in helping people with their fasting journey. Your goal is to understand the user through conversation and eventually create powerful, personalized motivators for them.

CONVERSATION FLOW:
1. Start by understanding their main fasting goals (weight loss, health, mental clarity, etc.)
2. Ask about their challenges (hunger, social situations, motivation dips, etc.)
3. Learn what currently motivates them (family, health goals, self-improvement, etc.)
4. Understand their personality (prefer gentle encouragement vs tough love, visual vs text motivation, etc.)
5. Ask about specific triggers or situations where they need motivation most
6. Once you have enough context (after 4-6 exchanges), offer to create their personalized motivators

RESPONSE STYLE:
- Be warm, encouraging, and conversational
- Ask one focused question at a time
- Show empathy and understanding
- Use emojis sparingly but effectively
- Keep responses concise but personal

WHEN TO CREATE MOTIVATORS:
After gathering enough information, say something like: "Perfect! I have everything I need to create some powerful motivators for you. Should I create 4-5 personalized motivators based on our conversation?"

NEVER create actual motivator JSON until the user explicitly agrees to create them.`
            },
            ...conversationHistory
          ]
        }
      });

      if (error) throw error;

      const aiMessage: Message = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);

      // Check if AI is offering to create motivators
      if (data.response.toLowerCase().includes('create') && 
          data.response.toLowerCase().includes('motivator') && 
          data.response.includes('?')) {
        // AI is asking if they want to create motivators - no action needed yet
      }

    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateMotivators = async () => {
    setIsCreatingMotivators(true);
    
    try {
      // Get the full conversation context
      const conversationHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const { data, error } = await supabase.functions.invoke('chat-completion', {
        body: {
          messages: [
            {
              role: 'system',
              content: `Based on the conversation, create 4-5 personalized motivators for this user's fasting journey. 

Format your response as a JSON array of objects with this structure:
[
  {
    "title": "Compelling title (max 50 characters)",
    "content": "Inspiring description that resonates with their specific goals and challenges (max 200 characters)",
    "category": "health" | "personal" | "mindset" | "achievement"
  }
]

Make each motivator:
- Highly personal based on their conversation
- Emotionally resonant and inspiring
- Focused on their specific goals and challenges
- Actionable and empowering
- Unique from each other

IMPORTANT: Respond ONLY with the JSON array, no other text.`
            },
            ...conversationHistory,
            {
              role: 'user',
              content: 'Please create my personalized motivators now based on our conversation.'
            }
          ]
        }
      });

      if (error) throw error;

      let motivators;
      try {
        // Try to parse the JSON response
        motivators = JSON.parse(data.response);
      } catch (parseError) {
        // If JSON parsing fails, try to extract JSON from the response
        const jsonMatch = data.response.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          motivators = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('Could not parse AI response');
        }
      }

      if (!Array.isArray(motivators) || motivators.length === 0) {
        throw new Error('Invalid response format');
      }

      // Create each motivator
      let successCount = 0;
      for (const motivatorData of motivators) {
        try {
          await createMotivator({
            title: motivatorData.title,
            content: motivatorData.content,
            category: motivatorData.category || 'personal'
          });
          successCount++;
        } catch (error) {
          console.error('Error creating motivator:', error);
        }
      }

      if (successCount > 0) {
        toast({
          title: "✨ Motivators Created!",
          description: `Successfully created ${successCount} personalized motivator${successCount > 1 ? 's' : ''} based on our conversation.`,
        });
        
        refreshMotivators();
        onClose();
      } else {
        throw new Error('Failed to create any motivators');
      }

    } catch (error) {
      console.error('Error creating motivators:', error);
      toast({
        title: "Creation failed",
        description: "Please try the conversation again.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingMotivators(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Check if the last AI message is offering to create motivators
  const lastAiMessage = messages.filter(m => m.role === 'assistant').pop();
  const isOfferingToCreate = lastAiMessage && 
    lastAiMessage.content.toLowerCase().includes('create') && 
    lastAiMessage.content.toLowerCase().includes('motivator') && 
    lastAiMessage.content.includes('?');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-ceramic-plate rounded-3xl w-full max-w-2xl h-[85vh] border border-ceramic-rim shadow-2xl mt-4 flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-ceramic-rim">
          <div className="text-center flex-1">
            <div className="flex items-center justify-center gap-2 mb-2">
              <MessageSquare className="w-6 h-6 text-primary" />
              <h3 className="text-xl font-bold text-warm-text">AI Motivator Coach</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Let's create personalized motivators through conversation
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="hover:bg-ceramic-rim"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Chat Messages */}
        <ScrollArea ref={scrollAreaRef} className="flex-1 p-6">
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-4 rounded-2xl ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-ceramic-base border border-ceramic-rim'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <p className="text-xs opacity-70 mt-2">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-ceramic-base border border-ceramic-rim p-4 rounded-2xl">
                  <div className="flex items-center gap-2">
                    <Loader className="w-4 h-4 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">AI is thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="p-6 border-t border-ceramic-rim">
          {/* Show create motivators button if AI is offering */}
          {isOfferingToCreate && !isCreatingMotivators && (
            <div className="mb-4">
              <Button
                onClick={handleCreateMotivators}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                disabled={isCreatingMotivators}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Yes, Create My Motivators!
              </Button>
            </div>
          )}

          {isCreatingMotivators && (
            <div className="mb-4 text-center">
              <div className="flex items-center justify-center gap-2 text-primary">
                <Loader className="w-4 h-4 animate-spin" />
                <span className="text-sm">Creating your personalized motivators...</span>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Textarea
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Share what motivates you most..."
              className="flex-1 bg-ceramic-base border-ceramic-rim resize-none"
              rows={2}
              disabled={isLoading || isCreatingMotivators}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!currentMessage.trim() || isLoading || isCreatingMotivators}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Press Enter to send • Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
};