import { useState, useEffect, useRef } from 'react';
import { Send, Mic, Settings, Volume2, VolumeX, MessageSquare, Trash2, Plus } from 'lucide-react';
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
import { useConversations, type Message } from '@/hooks/useConversations';
import { useFastingContext } from '@/hooks/useFastingContext';
import { ScrollArea } from '@/components/ui/scroll-area';

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
    conversations, 
    currentConversation, 
    setCurrentConversation,
    createConversation, 
    addMessage, 
    deleteConversation,
    loading: conversationsLoading 
  } = useConversations();
  const { context: fastingContext, buildContextString } = useFastingContext();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentConversation?.messages]);

  useEffect(() => {
    // Load API key from localStorage
    const savedApiKey = localStorage.getItem('openai_api_key');
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
  }, []);

  useEffect(() => {
    // Show welcome message for new conversations
    if (!currentConversation && conversations.length === 0 && !conversationsLoading) {
      const welcomeMessage: Message = {
        role: 'assistant',
        content: "Hello! I'm your AI fasting companion. I'm here to support you on your fasting journey with motivation, guidance, and answers to your questions. How can I help you today?",
        timestamp: new Date()
      };
      // Don't save welcome message to database, just show it
      setCurrentConversation({
        id: 'welcome',
        title: 'Welcome',
        messages: [welcomeMessage],
        last_message_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      });
    }
  }, [conversations, currentConversation, conversationsLoading]);

  const getCurrentMessages = (): Message[] => {
    return currentConversation?.messages || [];
  };

  const getConversationHistory = () => {
    const messages = getCurrentMessages();
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

    // Handle new conversation or add to existing
    let conversationId = currentConversation?.id;
    if (!conversationId || conversationId === 'welcome') {
      conversationId = await createConversation(userMessage);
      if (!conversationId) return;
    } else {
      await addMessage(conversationId, userMessage);
    }

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

      if (error) throw error;

      if (data?.response) {
        const aiMessage: Message = {
          role: 'assistant',
          content: data.response,
          timestamp: new Date(),
          audioEnabled: fromVoice
        };

        // Save AI response to conversation
        if (currentConversation?.id && currentConversation.id !== 'welcome') {
          await addMessage(currentConversation.id, aiMessage);
        }

        // Start voice response simultaneously (don't wait for it)
        if (audioEnabled) {
          playTextAsAudio(data.response).catch(error => {
            console.error('Voice response failed:', error);
          });
        }
      }
    } catch (error) {
      console.error('Error sending message to AI:', error);
      toast({
        title: "Error",
        description: "Failed to get AI response. Please check your API key and try again.",
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

    // Handle new conversation or add to existing
    let conversationId = currentConversation?.id;
    if (!conversationId || conversationId === 'welcome') {
      conversationId = await createConversation(userMessage);
      if (!conversationId) return;
    } else {
      await addMessage(conversationId, userMessage);
    }

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

  const startNewConversation = () => {
    setCurrentConversation(null);
    setInputMessage('');
  };

  const handleDeleteConversation = async (conversationId: string) => {
    await deleteConversation(conversationId);
  };

  return (
    <div className="min-h-screen bg-ceramic-base flex">
      {/* Sidebar with conversation history */}
      <div className="w-80 bg-ceramic-plate border-r border-ceramic-rim p-4 hidden md:block">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-warm-text">Conversations</h2>
          <Button
            onClick={startNewConversation}
            size="sm"
            className="bg-primary hover:bg-primary/90"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        
        <ScrollArea className="h-[calc(100vh-200px)]">
          <div className="space-y-2">
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                className={`p-3 rounded-lg cursor-pointer transition-colors group ${
                  currentConversation?.id === conversation.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-ceramic-base hover:bg-ceramic-rim'
                }`}
                onClick={() => setCurrentConversation(conversation)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {conversation.title || 'Untitled'}
                    </p>
                    <p className="text-xs opacity-70">
                      {new Date(conversation.last_message_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteConversation(conversation.id);
                    }}
                    size="sm"
                    variant="ghost"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col">
        <div className="px-4 pt-8 pb-4">
          <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="text-center space-y-2 mb-6">
              <h1 className="text-3xl font-bold text-warm-text">AI Fasting Companion</h1>
              <p className="text-muted-foreground">
                {currentConversation?.id === 'welcome' || !currentConversation 
                  ? 'Start a conversation with your AI fasting companion'
                  : currentConversation.title || 'Continuing conversation'
                }
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

              <Dialog open={showApiDialog} onOpenChange={setShowApiDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Settings className="w-4 h-4 mr-2" />
                    API Settings
                  </Button>
                </DialogTrigger>
                <DialogContent>
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

            {/* Messages */}
            <Card className="bg-ceramic-plate border-ceramic-rim">
              <div className="h-96 overflow-y-auto p-4 space-y-4">
                {getCurrentMessages().map((message, index) => (
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
                  className="bg-ceramic-base border-ceramic-rim"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || isProcessing}
                  className="bg-primary hover:bg-primary/90"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>

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
    </div>
  );
};

export default AiChat;