import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Volume2, VolumeX, Settings, Send } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { VoiceRecorder } from '@/components/VoiceRecorder';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  isAudio?: boolean;
}

const AiChat = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const conversationHistoryRef = useRef<Array<{role: string, content: string}>>([]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Add welcome message
    if (messages.length === 0) {
      setMessages([{
        id: '1',
        content: 'Hello! I\'m your AI fasting companion. I can help you with questions about intermittent fasting, provide motivation, and support your journey. You can record a voice message or type below. How can I assist you today?',
        role: 'assistant',
        timestamp: new Date()
      }]);
    }
  }, []);

  // Handle voice transcription
  const handleVoiceTranscription = async (transcribedText: string) => {
    if (!transcribedText.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: transcribedText,
      role: 'user',
      timestamp: new Date(),
      isAudio: true
    };

    setMessages(prev => [...prev, userMessage]);
    conversationHistoryRef.current.push({ role: 'user', content: transcribedText });

    // Send to AI
    await sendToAI(transcribedText);
  };

  const sendToAI = async (message: string) => {
    setIsProcessing(true);
    
    try {
      // Get API key from localStorage
      const apiKey = localStorage.getItem('openai_api_key');
      
      if (!apiKey) {
        throw new Error('Please set your OpenAI API key in Settings first');
      }

      const { data, error } = await supabase.functions.invoke('chat-completion', {
        body: { 
          message, 
          conversationHistory: conversationHistoryRef.current.slice(-10) // Keep last 10 messages for context
        },
        headers: {
          'X-OpenAI-API-Key': apiKey
        }
      });

      if (error) throw error;

      if (data?.response) {
        const aiMessage: Message = {
          id: Date.now().toString(),
          content: data.response,
          role: 'assistant',
          timestamp: new Date()
        };

        setMessages(prev => [...prev, aiMessage]);
        conversationHistoryRef.current.push({ role: 'assistant', content: data.response });

        // Optional: Convert to speech if audio is enabled
        if (audioEnabled) {
          await playTextAsAudio(data.response);
        }
      }
    } catch (error) {
      console.error('Error sending message to AI:', error);
      toast({
        title: "Error",
        description: "Failed to get AI response. Please make sure OpenAI API key is configured.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Convert text to speech and play
  const playTextAsAudio = async (text: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: { text, voice: 'alloy' }
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
      // Don't show error to user for TTS failures
    }
  };

  // Send text message
  const handleSendMessage = async () => {
    if (!input.trim() || isProcessing) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    conversationHistoryRef.current.push({ role: 'user', content: input });

    const messageToSend = input;
    setInput('');
    
    await sendToAI(messageToSend);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4 pb-20">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                🤖 AI Fasting Companion
              </CardTitle>
              <div className="flex items-center gap-2">
                <div className="flex items-center space-x-2">
                  <Label htmlFor="audio-toggle" className="text-sm">Voice responses</Label>
                  <Switch
                    id="audio-toggle"
                    checked={audioEnabled}
                    onCheckedChange={setAudioEnabled}
                  />
                  {audioEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowApiKeyDialog(true)}
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-96 overflow-y-auto border rounded-lg p-4 space-y-4 bg-background/50">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-sm p-3 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-xs opacity-70">
                        {message.timestamp.toLocaleTimeString()}
                      </span>
                      {message.isAudio && (
                        <span className="text-xs opacity-70">🎙️</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {isProcessing && (
                <div className="flex justify-start">
                  <div className="bg-muted p-3 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                      <span className="text-sm">AI is thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your message here..."
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  disabled={isProcessing}
                />
                <Button 
                  onClick={handleSendMessage} 
                  disabled={!input.trim() || isProcessing}
                  size="icon"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex justify-center">
                <VoiceRecorder 
                  onTranscription={handleVoiceTranscription}
                  isDisabled={isProcessing}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {showApiKeyDialog && (
          <Card>
            <CardHeader>
              <CardTitle>API Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertDescription>
                  This app uses OpenAI's Whisper for speech recognition, GPT for conversations, and text-to-speech for voice responses.
                  An OpenAI API key must be configured in the project settings.
                </AlertDescription>
              </Alert>
              
              <div className="flex gap-2">
                <Button onClick={() => setShowApiKeyDialog(false)}>
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AiChat;