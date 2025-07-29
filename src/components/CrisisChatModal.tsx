import { useState, useEffect, useRef } from 'react';
import { Send, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { VoiceRecorder } from '@/components/VoiceRecorder';
import { useAuth } from '@/hooks/useAuth';
import { PremiumGate } from '@/components/PremiumGate';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  audioEnabled?: boolean;
}

interface CrisisChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  context?: string;
  systemPrompt?: string;
  proactiveMessage?: string;
  quickReplies?: string[];
}

export const CrisisChatModal = ({ 
  isOpen, 
  onClose, 
  context = '',
  systemPrompt = 'You are a crisis support AI.',
  proactiveMessage = '',
  quickReplies = []
}: CrisisChatModalProps) => {
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    // Only scroll if there are messages and we're not in the initial loading state
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    // Load API key from localStorage only once
    const savedApiKey = localStorage.getItem('openai_api_key');
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      // Only initialize messages if they're currently empty to prevent re-initialization
      setMessages(prevMessages => {
        if (prevMessages.length > 0) {
          return prevMessages;
        }
        
        const initialMessages: Message[] = [];
        
        // Add compact context message
        if (context) {
          const contextMessage: Message = {
            role: 'assistant',
            content: context,
            timestamp: new Date(),
            audioEnabled: false
          };
          initialMessages.push(contextMessage);
        }
        
        // Add proactive message
        if (proactiveMessage) {
          const proactiveMsg: Message = {
            role: 'assistant',
            content: proactiveMessage,
            timestamp: new Date(),
            audioEnabled: false
          };
          initialMessages.push(proactiveMsg);
        }
        
        return initialMessages;
      });
    } else {
      setMessages([]);
      setInputMessage('');
      setIsProcessing(false);
    }
  }, [isOpen, context, proactiveMessage]);

  const sendToAI = async (message: string, fromVoice = false) => {
    setIsProcessing(true);

    try {
      const conversationHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const { data, error } = await supabase.functions.invoke('chat-completion', {
        body: { 
          message,
          conversationHistory: [
            { role: 'system', content: systemPrompt },
            ...conversationHistory
          ]
        },
        headers: apiKey ? {
          'X-OpenAI-API-Key': apiKey
        } : undefined
      });

      if (error) throw error;

      if (data.completion) {
        const aiMessage: Message = {
          role: 'assistant',
          content: data.completion,
          timestamp: new Date(),
          audioEnabled: audioEnabled && fromVoice
        };

        setMessages(prev => [...prev, aiMessage]);

        if (audioEnabled && fromVoice) {
          await playTextAsAudio(data.completion);
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

  const playTextAsAudio = async (text: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: { text, voice: 'alloy' }
      });

      if (error) throw error;

      if (data.audioUrl) {
        const audio = new Audio(data.audioUrl);
        audio.play();
      }
    } catch (error) {
      console.error('Error playing text as audio:', error);
    }
  };

  const handleVoiceTranscription = async (transcription: string) => {
    if (!transcription.trim()) return;

    const userMessage: Message = {
      role: 'user',
      content: transcription,
      timestamp: new Date(),
      audioEnabled: true
    };

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

  const ChatInterface = () => (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto max-h-[90vh] mt-4 flex flex-col p-0">
        <DialogHeader className="border-b border-border p-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold">Crisis Support</DialogTitle>
            <div className="flex items-center gap-2 mr-8">
              <Switch
                id="crisis-audio-mode"
                checked={audioEnabled}
                onCheckedChange={setAudioEnabled}
                className="scale-75"
              />
              <Label htmlFor="crisis-audio-mode" className="text-sm">
                {audioEnabled ? <Volume2 className="h-3 w-3" /> : <VolumeX className="h-3 w-3" />}
              </Label>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[300px] max-h-[400px]">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <Card className={`max-w-[85%] p-3 ${
                message.role === 'user' 
                  ? 'bg-primary text-primary-foreground' 
                  : message.content === context 
                    ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800'
                    : 'bg-muted'
              }`}>
                <div className="flex items-start gap-2">
                  <div className="flex-1">
                    <p className={`text-sm whitespace-pre-wrap leading-relaxed ${
                      message.content === context ? 'text-amber-700 dark:text-amber-300' : ''
                    }`}>
                      {message.content}
                    </p>
                    
                    {/* Quick Reply Buttons */}
                    {message.role === 'assistant' && quickReplies.length > 0 && index === messages.length - 1 && (
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
                    
                    <p className="text-xs opacity-70 mt-2">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                  {message.audioEnabled && message.role === 'assistant' && (
                    <Volume2 className="h-4 w-4 opacity-70" />
                  )}
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

        <div className="flex-shrink-0 border-t border-border p-4 space-y-3">
          <div className="flex gap-2 items-end">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Share what you're experiencing..."
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
          
          <VoiceRecorder
            onTranscription={handleVoiceTranscription}
            isDisabled={isProcessing}
          />
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <PremiumGate feature="Crisis Support Chat" showUpgrade={true}>
      <ChatInterface />
    </PremiumGate>
  );
};