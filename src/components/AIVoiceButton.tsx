import { useState, useEffect } from 'react';
import { Mic, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CircularVoiceButton } from '@/components/CircularVoiceButton';
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
  
  // Import session hooks for function execution
  const { currentSession: fastingSession, startFastingSession, endFastingSession } = useFastingSession();
  const { currentSession: walkingSession, startWalkingSession, endWalkingSession } = useWalkingSession();
  const { profile } = useProfile();
  const { context: foodContext, buildContextString, refreshContext } = useFoodContext();


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
            default:
              responseMessage = 'I processed your request successfully.';
          }
        } catch (error) {
          console.error('🤖 AI Chat: Function execution error:', error);
          responseMessage = 'Sorry, I had trouble processing that request. Please try again.';
        }
        
        addBubble('assistant', responseMessage);
        
        if (fromVoice) {
          await playTextAsAudio(responseMessage);
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

  // Function execution handlers - Actually perform the requested actions
  const handleAddMultipleFoods = async (args: any): Promise<string> => {
    const foods = args?.foods || [];
    console.log('🍽️ handleAddMultipleFoods called with:', foods);
    
    if (foods.length === 0) return 'No foods to add.';

    try {
      for (const food of foods) {
        console.log('🍽️ Adding food:', food);
        
        const { data, error } = await supabase
          .from('food_entries')
          .insert({
            user_id: user!.id,
            name: food.name,
            serving_size: food.serving_size || 100,
            calories: food.calories || 0,
            carbs: food.carbs || 0,
            source_date: new Date().toISOString().split('T')[0]
          });

        if (error) {
          console.error('🍽️ Supabase insertion error:', error);
          throw error;
        }
        
        console.log('🍽️ Successfully inserted food:', data);
      }

      // Refresh food context after adding
      await refreshContext();
      
      const totalCalories = foods.reduce((sum: number, food: any) => sum + (food.calories || 0), 0);
      const foodList = foods.map((food: any) => `${food.name} (${food.serving_size}g)`).join(', ');
      
      return `Added ${foodList} - ${totalCalories} calories total`;
    } catch (error) {
      console.error('🍽️ Error adding foods:', error);
      return `Sorry, I had trouble adding those foods. Error: ${error.message || 'Unknown error'}`;
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
              {/* Chat Messages Area */}
              <div className="flex-1 overflow-hidden pt-20 pb-24">
                <ScrollArea className="h-full">
                  <div className="max-w-full mx-auto space-y-0">
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
        </div>
      )}
    </>
  );
};