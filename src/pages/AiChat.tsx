import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Mic, Settings, Volume2, VolumeX, RotateCcw, Camera, Image, Archive, MoreVertical, Trash2 } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { VoiceRecorder } from '@/components/VoiceRecorder';
import { ImageUpload } from '@/components/ImageUpload';
import { useNavigate } from 'react-router-dom';

// Enhanced Message interface to support notifications
interface EnhancedMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  audioEnabled?: boolean;
  isNotification?: boolean;
}

const AiChat = () => {
  const [inputMessage, setInputMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showApiDialog, setShowApiDialog] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>('');
  const [messages, setMessages] = useState<EnhancedMessage[]>([]);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [notificationMessages, setNotificationMessages] = useState<EnhancedMessage[]>([]);
  const [crisisInitialized, setCrisisInitialized] = useState(false);
  const [searchParams] = useSearchParams();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Check for crisis mode
  const isCrisisMode = searchParams.get('crisis') === 'true';
  const crisisData = searchParams.get('data') ? JSON.parse(decodeURIComponent(searchParams.get('data')!)) : null;

  // Combine regular messages with notification messages
  const allMessages = [...notificationMessages, ...messages];

  // Load user and session data on mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData.session?.user) {
          setUser(sessionData.session.user);
          
          // Load profile data through AI
          const response = await supabase.functions.invoke('chat-completion', {
            body: {
              function_name: 'get_user_profile',
              function_args: {}
            }
          });
          
          if (response.data?.data) {
            setProfile(response.data.data);
          }
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };
    
    loadUserData();
  }, []);

  useEffect(() => {
    // Only auto-scroll if user sent a message recently or processing
    if (isProcessing || messages[messages.length - 1]?.role === 'user') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [allMessages, isProcessing]);

  // Load conversation history on mount
  useEffect(() => {
    const loadConversation = async () => {
      if (!user) return;
      
      try {
        const response = await supabase.functions.invoke('chat-completion', {
          body: {
            function_name: 'load_conversation',
            function_args: {}
          }
        });
        
        if (response.data?.data?.messages) {
          const transformedMessages = response.data.data.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }));
          setMessages(transformedMessages);
        }
      } catch (error) {
        console.error('Error loading conversation:', error);
      }
    };
    
    loadConversation();
  }, [user]);

  // Handle crisis mode initialization - only once when entering crisis mode
  useEffect(() => {
    if (isCrisisMode && crisisData && messages.length === 0 && !isProcessing && !crisisInitialized) {
      setCrisisInitialized(true);
      // Generate crisis greeting through AI
      generateCrisisGreeting();
    }
  }, [isCrisisMode, crisisData, messages.length, isProcessing, crisisInitialized]);

  const generateCrisisGreeting = async () => {
    try {
      const response = await supabase.functions.invoke('chat-completion', {
        body: {
          function_name: 'generate_crisis_greeting',
          function_args: { crisis_data: crisisData }
        }
      });
      
      if (response.data?.data?.message) {
        await addAIMessage(response.data.data.message);
      }
    } catch (error) {
      console.error('Error generating crisis greeting:', error);
    }
  };

  // Helper functions for AI-centric message management
  const addUserMessage = async (content: string) => {
    const message = {
      role: 'user' as const,
      content,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, message]);
    
    // Save to database through AI
    try {
      await supabase.functions.invoke('chat-completion', {
        body: {
          function_name: 'add_message',
          function_args: { message }
        }
      });
    } catch (error) {
      console.error('Error saving user message:', error);
    }
    
    return message;
  };

  const addAIMessage = async (content: string) => {
    const message = {
      role: 'assistant' as const,
      content,
      timestamp: new Date(),
      audioEnabled: audioEnabled
    };
    
    setMessages(prev => [...prev, message]);
    
    // Save to database through AI
    try {
      await supabase.functions.invoke('chat-completion', {
        body: {
          function_name: 'add_message',
          function_args: { message }
        }
      });
    } catch (error) {
      console.error('Error saving AI message:', error);
    }
    
    if (audioEnabled) {
      await playTextAsAudio(content);
    }
    
    return message;
  };

  useEffect(() => {
    // Load API key from localStorage and sync with state
    const savedApiKey = localStorage.getItem('openai_api_key');
    if (savedApiKey) {
      setApiKey(savedApiKey);
      // Close the dialog if a key is already present
      setShowApiDialog(false);
    } else {
      // Only show dialog if no key exists and not in crisis mode (will be handled by SOS)
      setShowApiDialog(false);
    }
  }, []);

  const sendToAI = async (message: string, fromVoice = false) => {
    if (!message || !message.trim()) {
      console.error('sendToAI called with empty message:', message);
      return;
    }

    setIsProcessing(true);

    try {
      // Send message to AI-centric chat completion with full conversation history
      const conversationHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const systemPrompt = isCrisisMode ? 
        'You are a crisis support AI assistant. Be empathetic, supportive, and helpful in providing immediate crisis support and guidance.' :
        'You are a helpful AI assistant for a health and fasting app. You help users with fasting, walking, food tracking, motivational content, and general health questions. You have access to comprehensive user data and can perform various health-related functions.';

      const { data, error } = await supabase.functions.invoke('chat-completion', {
        body: { 
          message: message,
          conversationHistory: [
            { role: 'system', content: systemPrompt },
            ...conversationHistory
          ],
          crisis_mode: isCrisisMode,
          audio_enabled: audioEnabled && fromVoice
        }
      });

      if (error) throw error;

      if (data.completion) {
        await addAIMessage(data.completion);
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

    await addUserMessage(transcription);
    await sendToAI(transcription, true);
  };

  const handleSendMessage = useCallback(async (presetMessage?: string) => {
    const messageToSend = presetMessage || inputMessage.trim();
    if (!messageToSend || isProcessing) return;

    try {
      await addUserMessage(messageToSend);

      if (!presetMessage) {
        setInputMessage('');
      }

      await sendToAI(messageToSend);
    } catch (error) {
      console.error('Error handling message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    }
  }, [inputMessage, isProcessing]);

  const handleImageUpload = (imageUrl: string) => {
    setUploadedImageUrl(imageUrl);
    setShowImageUpload(false);
    
    // Add a message about the uploaded image through AI
    addUserMessage(`I've uploaded an image: ${imageUrl}`);
  };

  const handleClearChat = async () => {
    try {
      await supabase.functions.invoke('chat-completion', {
        body: {
          function_name: 'clear_conversation',
          function_args: {}
        }
      });
      
      setMessages([]);
      setNotificationMessages([]);
      
      toast({
        title: "Chat Cleared",
        description: "Your conversation has been cleared."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to clear conversation.",
        variant: "destructive"
      });
    }
  };

  const handleArchiveChat = async () => {
    try {
      await supabase.functions.invoke('chat-completion', {
        body: {
          function_name: 'archive_conversation',
          function_args: {}
        }
      });
      
      setMessages([]);
      setNotificationMessages([]);
      
      toast({
        title: "Chat Archived",
        description: "Your conversation has been archived and a new chat started."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to archive conversation.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-ceramic-base safe-top safe-bottom">
      <div className="flex flex-col h-screen pt-24"> {/* Increased top padding for deficit panel */}
        {/* Header */}
        <div className="bg-ceramic-plate/95 backdrop-blur-sm border-b border-ceramic-rim px-4 py-4 flex-shrink-0 relative z-40">
          <div className="max-w-md mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">AI</span>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-warm-text">AI Assistant</h1>
                <p className="text-xs text-muted-foreground">Here to help with your health journey</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                <Switch
                  id="audio-mode"
                  checked={audioEnabled}
                  onCheckedChange={setAudioEnabled}
                  className="scale-75"
                />
                <Label htmlFor="audio-mode" className="text-sm">
                  {audioEnabled ? <Volume2 className="h-3 w-3" /> : <VolumeX className="h-3 w-3" />}
                </Label>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-background border border-border z-50">
                  <DropdownMenuItem onClick={() => setShowApiDialog(true)}>
                    <Settings className="w-4 h-4 mr-2" />
                    API Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleArchiveChat}>
                    <Archive className="w-4 h-4 mr-2" />
                    Archive Chat
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleClearChat} className="text-red-600">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear Chat
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Messages - Flexible height with proper spacing */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0">
          <div className="max-w-md mx-auto space-y-4">
            {allMessages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <Card className={`max-w-[85%] p-4 ${
                  message.role === 'user' 
                    ? 'bg-primary text-primary-foreground' 
                    : (message as EnhancedMessage).isNotification
                      ? 'bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800'
                      : 'bg-muted'
                }`}>
                  <div className="flex items-start gap-2">
                    <div className="flex-1">
                      {(message as EnhancedMessage).isNotification && (
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                          <span className="text-xs font-medium text-amber-700 dark:text-amber-300">
                            Information Needed
                          </span>
                        </div>
                      )}
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                      
                      {/* Quick action buttons for notifications */}
                      {(message as EnhancedMessage).isNotification && (
                        <div className="flex gap-2 mt-3">
                          <Button 
                            size="sm" 
                            onClick={() => setInputMessage("I am ")}
                            className="text-xs bg-amber-100 hover:bg-amber-200 text-amber-800 border-amber-300"
                          >
                            Tell You Now
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => navigate('/settings')}
                            className="text-xs border-amber-300 text-amber-700 hover:bg-amber-50"
                          >
                            Go to Settings
                          </Button>
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
                <Card className="max-w-[85%] p-4 bg-muted">
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    <p className="text-sm">AI is thinking...</p>
                  </div>
                </Card>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input */}
        <div className="bg-ceramic-plate/95 backdrop-blur-sm border-t border-ceramic-rim px-4 py-4 flex-shrink-0">
          <div className="max-w-md mx-auto space-y-3">
            {/* Crisis Quick Replies */}
            {isCrisisMode && (
              <div className="flex flex-wrap gap-2">
                <div className="text-xs text-muted-foreground mb-2">Quick responses:</div>
                {['I need help', 'Tell me more', 'What can I do?', 'I feel better'].map((reply, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={async (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('DEBUG: Quick reply clicked:', reply);
                      try {
                        await handleSendMessage(reply);
                      } catch (error) {
                        console.error('Error sending quick reply:', error);
                      }
                    }}
                    className="text-xs bg-red-50 border-red-200 text-red-700 hover:bg-red-100 dark:bg-red-950 dark:border-red-800 dark:text-red-300 cursor-pointer"
                    disabled={isProcessing}
                  >
                    {reply}
                  </Button>
                ))}
              </div>
            )}
            {/* Text Input */}
            <div className="flex gap-2 items-end">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask me anything about your health journey..."
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                disabled={isProcessing}
                className="flex-1 bg-ceramic-base border-ceramic-rim"
              />
              <Button
                onClick={() => setShowImageUpload(true)}
                variant="outline"
                size="default"
                className="flex-shrink-0 bg-ceramic-base border-ceramic-rim"
              >
                <Camera className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => handleSendMessage()}
                disabled={!inputMessage.trim() || isProcessing}
                size="default"
                className="flex-shrink-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Voice Recording */}
            <VoiceRecorder
              onTranscription={handleVoiceTranscription}
              isDisabled={isProcessing}
            />
          </div>
        </div>
      </div>

      {/* Choose How to Continue Dialog */}
      <Dialog open={showApiDialog} onOpenChange={setShowApiDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Choose How to Continue</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="border rounded-lg p-4 bg-primary/5">
                <h3 className="font-semibold text-sm mb-2">🌟 Recommended: Premium Subscription</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Get unlimited AI conversations and advanced features.
                </p>
                <Button className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground" onClick={async () => {
                  try {
                    const { data, error } = await supabase.functions.invoke('create-subscription');
                    if (error) throw error;
                    if (data.url) {
                      window.open(data.url, '_blank');
                    }
                  } catch (error) {
                    console.error('Error creating subscription:', error);
                    toast({
                      title: "Error",
                      description: "Failed to open subscription page. Please try again.",
                      variant: "destructive"
                    });
                  }
                  setShowApiDialog(false);
                }}>
                  <span className="mr-2">👑</span>
                  Upgrade to Premium - $9/month
                </Button>
              </div>
              
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-sm mb-2">🔑 Bring Your Own OpenAI Key</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Use your personal OpenAI API key. 
                  <a 
                    href="https://platform.openai.com/api-keys" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline ml-1"
                  >
                    Get one from OpenAI's platform →
                  </a>
                </p>
                <div className="space-y-3">
                  {apiKey ? (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                      <p className="text-sm text-green-700 font-medium">✓ API Key Already Configured</p>
                      <p className="text-xs text-green-600 mt-1">You can start chatting right away!</p>
                      <Button 
                        size="sm" 
                        className="mt-2 w-full"
                        onClick={() => setShowApiDialog(false)}
                      >
                        Start Chatting
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Input
                        type="password"
                        placeholder="sk-..."
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        className="font-mono text-sm"
                      />
                      <Button
                        onClick={() => {
                          if (apiKey.trim()) {
                            localStorage.setItem('openai_api_key', apiKey);
                            setShowApiDialog(false);
                            toast({
                              title: "API Key Saved",
                              description: "You can now use the AI assistant."
                            });
                          }
                        }}
                        disabled={!apiKey.trim()}
                        className="w-full"
                      >
                        Save Key & Start Chatting
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        Your API key is stored locally and never sent to our servers.
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Upload Dialog */}
      <Dialog open={showImageUpload} onOpenChange={setShowImageUpload}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Image</DialogTitle>
          </DialogHeader>
          <ImageUpload 
            currentImageUrl=""
            onImageUpload={handleImageUpload}
            onImageRemove={() => {}}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AiChat;