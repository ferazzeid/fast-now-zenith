import { useState, useEffect } from 'react';
import { Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CircularVoiceButton } from '@/components/CircularVoiceButton';
import { FloatingBubble } from '@/components/FloatingBubble';
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

export const AIVoiceButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [bubbles, setBubbles] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { user } = useAuth();


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

  const removeBubble = (id: string) => {
    setBubbles(prev => prev.filter(bubble => bubble.id !== id));
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

      if (data?.completion) {
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

  const clearBubbles = () => {
    setBubbles([]);
  };

  return (
    <>
      {/* AI Voice Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="ai-voice-button w-8 h-8 p-0 rounded-full bg-ai/20 backdrop-blur-sm border border-ai/30 hover:bg-ai/30 hover:scale-110 transition-all duration-200"
        title="AI Voice Assistant"
      >
        <Mic className="w-4 h-4 text-ai" />
      </Button>

      {/* Aquarium Glass Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-background/5 backdrop-blur-lg">
          {/* Aquarium Container */}
          <div className="aquarium-container relative w-full h-full">
            {/* Floating Bubbles */}
            {bubbles.map((bubble) => (
              <FloatingBubble
                key={bubble.id}
                content={bubble.content}
                role={bubble.role}
                onComplete={() => removeBubble(bubble.id)}
              />
            ))}

            {/* Processing Bubble */}
            {isProcessing && (
              <div 
                className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-primary/10 backdrop-blur-sm border border-primary/30 rounded-full p-4 animate-pulse"
                style={{ animationDuration: '2s' }}
              >
                <div className="w-6 h-6 rounded-full bg-primary/20 animate-ping" />
              </div>
            )}

            {/* Voice Button at Bottom */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
              <PremiumGate feature="voice_chat">
                <CircularVoiceButton
                  onTranscription={handleVoiceTranscription}
                  isDisabled={isProcessing}
                  size="lg"
                />
              </PremiumGate>
            </div>
          </div>
        </div>
      )}
    </>
  );
};