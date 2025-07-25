import { useState, useEffect, useRef } from 'react';
import { Send, Mic, Settings, Volume2, VolumeX, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { VoiceRecorder } from '@/components/VoiceRecorder';
import { useAuth } from '@/hooks/useAuth';
import { useSingleConversation, type Message } from '@/hooks/useSingleConversation';
import { useFastingContext } from '@/hooks/useFastingContext';
import { useMotivators } from '@/hooks/useMotivators';

const AiChat = () => {
  const [inputMessage, setInputMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showApiDialog, setShowApiDialog] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const { 
    messages, 
    loading: conversationLoading,
    addMessage,
    clearConversation
  } = useSingleConversation();
  const { context: fastingContext, buildContextString } = useFastingContext();
  const { createMotivator } = useMotivators();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Load API key from localStorage
    const savedApiKey = localStorage.getItem('openai_api_key');
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
  }, []);

  const getConversationHistory = () => {
    return messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
  };

  const handleVoiceTranscription = async (transcription: string) => {
    if (!transcription.trim()) return;

    const userMessage: Message = {
      role: 'user',
      content: transcription,
      timestamp: new Date(),
      audioEnabled: true
    };

    // Add user message to conversation
    const success = await addMessage(userMessage);
    if (!success) return;

    await sendToAI(transcription, getConversationHistory(), true);
  };

  const sendToAI = async (message: string, conversationHistory: Array<{ role: string; content: string }>, fromVoice = false) => {
    if (!apiKey.trim()) {
      setShowApiDialog(true);
      return;
    }

    setIsProcessing(true);

    try {
      // Build enhanced context with fasting data
      const enhancedHistory = [...conversationHistory];
      
      // Add fasting context to system understanding (not as a visible message)
      if (fastingContext) {
        const contextString = buildContextString(fastingContext);
        enhancedHistory.unshift({
          role: 'system',
          content: `User context: ${contextString}`
        });
      }

      const { data, error } = await supabase.functions.invoke('chat-completion', {
        body: { 
          message,
          conversationHistory: enhancedHistory
        },
        headers: {
          'X-OpenAI-API-Key': apiKey
        }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }

      if (data?.response) {
        // Handle function calls if present
        if (data.function_calls) {
          for (const functionCall of data.function_calls) {
            if (functionCall.type === 'create_motivator') {
              const motivatorData = functionCall.data;
              await createMotivator({
                title: motivatorData.title,
                content: motivatorData.content,
                category: motivatorData.category
              });
              
              toast({
                title: "✨ Motivator Created!",
                description: `"${motivatorData.title}" has been added to your motivators.`,
              });
            } else if (functionCall.type === 'suggest_motivator_ideas') {
              // Handle suggestions (could show in UI later)
              console.log('Motivator suggestions:', functionCall.data.suggestions);
            }
          }
        }

        const aiMessage: Message = {
          role: 'assistant',
          content: data.response,
          timestamp: new Date(),
          audioEnabled: fromVoice
        };

        // Save AI response to conversation
        await addMessage(aiMessage);

        // Start voice response simultaneously (don't wait for it)
        if (audioEnabled) {
          playTextAsAudio(data.response).catch(error => {
            console.error('Voice response failed:', error);
          });
        }
      }
    } catch (error) {
      console.error('Error sending message to AI:', error);
      let errorMessage = "Failed to get AI response. Please check your API key and try again.";
      
      // Provide more specific error messages
      if (error.message?.includes('Failed to fetch') || error.message?.includes('timeout')) {
        errorMessage = "The AI service is taking too long to respond. Please try again in a moment.";
      } else if (error.message?.includes('authentication')) {
        errorMessage = "Authentication failed. Please check your API key in settings.";
      } else if (error.message?.includes('limit')) {
        errorMessage = error.message; // Show limit messages directly
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const playTextAsAudio = async (text: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: { text, voice: 'alloy' },
        headers: {
          'X-OpenAI-API-Key': apiKey
        }
      });

      if (error) throw error;

      if (data?.audioContent) {
        // Convert base64 to audio and play
        const audioData = atob(data.audioContent);
        const arrayBuffer = new ArrayBuffer(audioData.length);
        const view = new Uint8Array(arrayBuffer);
        
        for (let i = 0; i < audioData.length; i++) {
          view[i] = audioData.charCodeAt(i);
        }

        const blob = new Blob([arrayBuffer], { type: 'audio/mp3' });
        const audioUrl = URL.createObjectURL(blob);
        const audio = new Audio(audioUrl);
        
        await audio.play();
        
        // Clean up
        audio.addEventListener('ended', () => {
          URL.revokeObjectURL(audioUrl);
        });
      }
    } catch (error) {
      console.error('Error playing text as audio:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isProcessing) return;

    const userMessage: Message = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    // Add user message to conversation
    const success = await addMessage(userMessage);
    if (!success) return;

    const messageToSend = inputMessage;
    setInputMessage('');
    
    await sendToAI(messageToSend, getConversationHistory());
  };

  const handleSaveApiKey = () => {
    localStorage.setItem('openai_api_key', apiKey);
    setShowApiDialog(false);
    toast({
      title: "✅ API Key Saved!",
      description: "Your OpenAI API key has been saved securely.",
    });
  };

  const handleClearConversation = () => {
    clearConversation();
  };

  // Show welcome message if no messages exist
  const displayMessages = messages.length === 0 ? [{
    role: 'assistant' as const,
    content: "Hello! I'm your AI companion. I'm here to support you on your fasting journey with motivation, guidance, and answers to your questions. How can I help you today?",
    timestamp: new Date()
  }] : messages;

  return (
    <div className="h-full bg-ceramic-base flex flex-col pb-20">
      <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full">
        <div className="px-4 pt-8 pb-4">
          {/* Header */}
          <div className="text-center space-y-2 mb-6">
            <h1 className="text-3xl font-bold text-warm-text">AI Companion</h1>
            <p className="text-muted-foreground">
              Your personal companion for guidance and motivation
            </p>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="audio-toggle"
                  checked={audioEnabled}
                  onCheckedChange={setAudioEnabled}
                />
                <Label htmlFor="audio-toggle" className="text-sm text-warm-text">
                  Voice responses
                </Label>
                {audioEnabled ? (
                  <Volume2 className="w-4 h-4 text-primary" />
                ) : (
                  <VolumeX className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="icon"
                onClick={handleClearConversation}
                disabled={messages.length === 0}
                title="Clear Chat"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>

              <Dialog open={showApiDialog} onOpenChange={setShowApiDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="icon" title="API Settings">
                    <Settings className="w-4 h-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="md:absolute md:inset-0 md:m-auto">
                  <DialogHeader>
                    <DialogTitle>OpenAI API Configuration</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="api-key">OpenAI API Key</Label>
                      <Input
                        id="api-key"
                        type="password"
                        placeholder="sk-..."
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Your API key is stored locally and never sent to our servers.
                      </p>
                    </div>
                    <Button onClick={handleSaveApiKey} disabled={!apiKey.trim()}>
                      Save API Key
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Messages */}
          <Card className="bg-ceramic-plate border-ceramic-rim">
            <div className="h-96 overflow-y-auto p-4 space-y-4">
              {displayMessages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-ceramic-base text-warm-text border border-ceramic-rim'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <div className="flex items-center mt-1 space-x-2">
                      <span className="text-xs opacity-70">
                        {message.timestamp.toLocaleTimeString()}
                      </span>
                      {message.audioEnabled && (
                        <Volume2 className="w-3 h-3 opacity-70" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {isProcessing && (
                <div className="flex justify-start">
                  <div className="bg-ceramic-base text-warm-text border border-ceramic-rim px-4 py-2 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      <span className="text-sm">AI is thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </Card>

          {/* Input area */}
          <div className="mt-4 space-y-4">
            <div className="flex space-x-2">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Type your message here..."
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                disabled={isProcessing}
                className="flex-1"
              />
              <Button 
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isProcessing}
                size="icon"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>

            {/* Voice input */}
            <div className="flex justify-center">
              <VoiceRecorder 
                onTranscription={handleVoiceTranscription}
                isDisabled={isProcessing}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiChat;