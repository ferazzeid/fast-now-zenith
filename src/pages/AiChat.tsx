import { useState, useEffect, useRef } from 'react';
import { Send, Mic, Settings, Volume2, VolumeX, RotateCcw, Camera, Image, Archive, MoreVertical, Trash2 } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useCrisisConversation } from '@/hooks/useCrisisConversation';
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
import { useAuth } from '@/hooks/useAuth';
import { useSingleConversation } from '@/hooks/useSingleConversation';
import { useFastingContext } from '@/hooks/useFastingContext';
import { useWalkingContext } from '@/hooks/useWalkingContext';
import { useFoodContext } from '@/hooks/useFoodContext';
import { useMotivators } from '@/hooks/useMotivators';
import { ImageUpload } from '@/components/ImageUpload';
import { useNavigate } from 'react-router-dom';
import { useNotificationSystem } from '@/hooks/useNotificationSystem';
import { useProfile } from '@/hooks/useProfile';

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
  const [notificationMessages, setNotificationMessages] = useState<EnhancedMessage[]>([]);
  const [searchParams] = useSearchParams();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { getAutoShowNotifications, clearNotification } = useNotificationSystem();
  const { profile, updateProfile } = useProfile();
  const { 
    messages, 
    loading: conversationLoading,
    addMessage,
    clearConversation,
    archiveConversation
  } = useSingleConversation();
  const { context: fastingContext, buildContextString: buildFastingContext } = useFastingContext();
  const { context: walkingContext, buildContextString: buildWalkingContext } = useWalkingContext();
  const { context: foodContext, buildContextString: buildFoodContext } = useFoodContext();
  const { createMotivator } = useMotivators();
  const { generateSystemPrompt, generateProactiveMessage, generateQuickReplies } = useCrisisConversation();

  // Check for crisis mode
  const isCrisisMode = searchParams.get('crisis') === 'true';
  const crisisData = searchParams.get('data') ? JSON.parse(decodeURIComponent(searchParams.get('data')!)) : null;

  console.log('DEBUG: Crisis mode detection', { isCrisisMode, crisisData, searchParams: Object.fromEntries(searchParams.entries()) });

  // Combine regular messages with notification messages
  const allMessages = [...notificationMessages, ...messages];

  useEffect(() => {
    // Only auto-scroll if user sent a message recently or processing
    if (isProcessing || messages[messages.length - 1]?.role === 'user') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [allMessages, isProcessing]);

  // Auto-show notifications when component mounts
  useEffect(() => {
    const autoShowNotifications = getAutoShowNotifications();
    
    if (autoShowNotifications.length > 0) {
      // Add notification messages to chat
      const newNotificationMessages: EnhancedMessage[] = autoShowNotifications.map(notification => ({
        role: 'system',
        content: notification.message,
        timestamp: new Date(),
        isNotification: true,
      }));

      setNotificationMessages(newNotificationMessages);
    }
  }, [getAutoShowNotifications, profile, user]);

  // Handle crisis mode initialization
  useEffect(() => {
    if (isCrisisMode && crisisData && messages.length === 0) {
      console.log('DEBUG: Initializing crisis conversation');
      // Add crisis greeting message as a regular message that gets saved
      handleSendMessage(generateProactiveMessage());
    }
  }, [isCrisisMode, crisisData, messages.length]);

  // Handle notification responses with AI-powered extraction
  const handleNotificationResponse = async (message: string) => {
    // Check if this is a response to profile completion
    const profileNotification = getAutoShowNotifications().find(n => n.type === 'profile_incomplete');
    
    if (profileNotification && notificationMessages.length > 0) {
      console.log('DEBUG: Processing profile notification response with AI:', message);
      
      // Get missing profile fields
      const missingFields = [];
      if (!profile?.age) missingFields.push('age');
      if (!profile?.weight) missingFields.push('weight');
      if (!profile?.height) missingFields.push('height');
      
      // Let AI extract profile information naturally
      const profileExtractionPrompt = `You are helping extract profile information. The user is missing: ${missingFields.join(', ')}. 

From their message "${message}", extract any profile information and respond in this exact JSON format:
{
  "extracted": true/false,
  "age": number or null,
  "weight": number or null,
  "height": number or null,
  "confirmation": "confirmation message for the user"
}

Rules for precise extraction:
- Age: Extract just the number (10-120 years). Examples: "44Y" = 44, "I'm 25" = 25, "25 years old" = 25
- Weight: Extract in kg (20-500 kg). Convert if needed: "150 lbs" = 68, "70kg" = 70  
- Height: Extract in cm (100-250 cm). Convert if needed: "5'8\"" = 173, "175cm" = 175

Be precise with numbers - don't add extra digits. "44Y" should be age 44, not 100.

If you can't extract valid information, set extracted to false and ask for clarification.`;

      try {
        const response = await supabase.functions.invoke('chat-completion', {
          body: {
            messages: [
              { role: 'system', content: profileExtractionPrompt },
              { role: 'user', content: message }
            ],
            model: 'gpt-4o-mini'
          }
        });

        if (response.error) throw response.error;

        const aiResponse = response.data?.message?.content;
        console.log('DEBUG: AI profile extraction response:', aiResponse);

        // Try to parse JSON from AI response
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const extractedData = JSON.parse(jsonMatch[0]);
          
          if (extractedData.extracted) {
            const updates: any = {};
            if (extractedData.age) updates.age = extractedData.age;
            if (extractedData.weight) updates.weight = extractedData.weight;
            if (extractedData.height) updates.height = extractedData.height;
            
            console.log('DEBUG: Attempting to update profile with:', updates);
            
            // Show what we're about to save
            await addMessage({
              role: 'assistant',
              content: `I extracted: ${Object.entries(updates).map(([key, value]) => `${key}: ${value}`).join(', ')}. Let me save this to your profile...`,
              timestamp: new Date()
            });
            
            const result = await updateProfile(updates);
            
            if (result.error) {
              console.error('DEBUG: Profile update failed:', result.error);
              await addMessage({
                role: 'assistant',
                content: `Sorry, I couldn't save your profile: ${result.error.message}. Please try again or check your Settings.`,
                timestamp: new Date()
              });
            } else {
              console.log('DEBUG: Profile update succeeded:', result.data);
              await addMessage({
                role: 'assistant',
                content: extractedData.confirmation || 'Perfect! Your profile has been updated successfully.',
                timestamp: new Date()
              });
              
              // Only clear notification after successful update
              clearNotification('profile_incomplete');
              setNotificationMessages([]);
            }
            
            return true;
          } else {
            // AI couldn't extract valid data, send AI's clarification message
            await addMessage({
              role: 'assistant',
              content: extractedData.confirmation || 'I need more specific information. Could you please provide your age, weight, and height more clearly?',
              timestamp: new Date()
            });
            return true;
          }
        }
      } catch (error) {
        console.error('Error in AI profile extraction:', error);
        await addMessage({
          role: 'assistant',
          content: 'I had trouble processing that information. Could you please provide your age, weight, and height? For example: "I am 25 years old, weigh 70kg, and am 175cm tall"',
          timestamp: new Date()
        });
        return true;
      }
    }

    return false; // Indicate this should be processed as a regular chat message
  };

  useEffect(() => {
    // Load API key from localStorage
    const savedApiKey = localStorage.getItem('openai_api_key');
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
  }, []);

  const sendToAI = async (message: string, fromVoice = false) => {
    if (!apiKey.trim()) {
      setShowApiDialog(true);
      return;
    }

    setIsProcessing(true);

    try {
      // Build comprehensive context
      const contextParts = [
        buildFastingContext(fastingContext),
        buildWalkingContext(walkingContext), 
        buildFoodContext(foodContext)
      ].filter(Boolean);

      const contextString = contextParts.length > 0 
        ? `Current user context:\n${contextParts.join('\n')}\n\n`
        : '';

      const conversationHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const systemPrompt = isCrisisMode ? generateSystemPrompt() : `You are a helpful AI assistant for a health and fasting app. You help users with:
1. Fasting guidance and motivation
2. Walking/exercise tracking and encouragement  
3. Food tracking and nutrition advice
4. Creating motivational content and quotes
5. General health and wellness questions

You have access to tools to create motivational content when requested.

Current context: ${contextString}

Be conversational, supportive, and helpful. When users ask for motivational content, use the create_motivator tool.`;

      const { data, error } = await supabase.functions.invoke('chat-completion', {
        body: { 
          message: `${contextString}${message}`,
          conversationHistory: [
            { role: 'system', content: systemPrompt },
            ...conversationHistory
          ]
        },
        headers: {
          'X-OpenAI-API-Key': apiKey
        }
      });

      if (error) throw error;

      if (data.completion) {
        await addMessage({
          role: 'assistant',
          content: data.completion,
          timestamp: new Date(),
          audioEnabled: audioEnabled && fromVoice
        });

        // Play audio if enabled and this was a voice message
        if (audioEnabled && fromVoice) {
          await playTextAsAudio(data.completion);
        }
      }

      // Handle function call results
      if (data.functionCall) {
        if (data.functionCall.name === 'create_motivator') {
          const args = data.functionCall.arguments;
          try {
            await createMotivator({
              title: args.text,
              content: args.text,
              category: args.category || 'general',
              imageUrl: args.image_prompt
            });
            
            await addMessage({
              role: 'assistant',
              content: "I've created that motivator for you! You can view it in the Motivators section.",
              timestamp: new Date(),
            });
          } catch (error) {
            console.error('Error creating motivator:', error);
            await addMessage({
              role: 'assistant',
              content: "I had trouble creating that motivator. Please try again later.",
              timestamp: new Date(),
            });
          }
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

    await addMessage({
      role: 'user',
      content: transcription,
      timestamp: new Date(),
      audioEnabled: true
    });

    // Check if this is a notification response first
    const wasNotificationResponse = await handleNotificationResponse(transcription);
    
    if (!wasNotificationResponse) {
      await sendToAI(transcription, true);
    }
  };

  const handleSendMessage = async (presetMessage?: string) => {
    const messageToSend = presetMessage || inputMessage.trim();
    if (!messageToSend || isProcessing) return;

    try {
      await addMessage({
        role: 'user',
        content: messageToSend,
        timestamp: new Date()
      });

      if (!presetMessage) {
        setInputMessage('');
      }

      // Check if this is a notification response first
      const wasNotificationResponse = await handleNotificationResponse(messageToSend);
      
      if (!wasNotificationResponse) {
        await sendToAI(messageToSend);
      }
    } catch (error) {
      console.error('Error handling message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleImageUpload = (imageUrl: string) => {
    setUploadedImageUrl(imageUrl);
    setShowImageUpload(false);
    
    // Add a message about the uploaded image
    addMessage({
      role: 'user',
      content: `I've uploaded an image: ${imageUrl}`,
      timestamp: new Date()
    });
  };

  const handleClearChat = async () => {
    await clearConversation();
    setNotificationMessages([]); // Also clear notification messages
    toast({
      title: "Chat Cleared",
      description: "Your conversation has been cleared."
    });
  };

  const handleArchiveChat = async () => {
    try {
      await archiveConversation();
      setNotificationMessages([]); // Also clear notification messages
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
                {generateQuickReplies().map((reply, index) => (
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