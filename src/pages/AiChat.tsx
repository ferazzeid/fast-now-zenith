import { useState, useEffect, useRef } from 'react';
import { Send, Mic, Settings, Volume2, VolumeX, RotateCcw, Camera, Image, Archive, MoreVertical, Trash2 } from 'lucide-react';
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
import { useSingleConversation, type Message } from '@/hooks/useSingleConversation';
import { useFastingContext } from '@/hooks/useFastingContext';
import { useWalkingContext } from '@/hooks/useWalkingContext';
import { useFoodContext } from '@/hooks/useFoodContext';
import { useMotivators } from '@/hooks/useMotivators';
import { ImageUpload } from '@/components/ImageUpload';

const AiChat = () => {
  const [inputMessage, setInputMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showApiDialog, setShowApiDialog] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();
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
      // Use truncated conversation history to reduce API costs
      const enhancedHistory = conversationHistory.slice(-15); // Keep last 15 messages only
      
      // Add minimal context to reduce token usage
      const contextParts = [];
      
      if (walkingContext && walkingContext.isCurrentlyWalking) {
        contextParts.push(`Currently walking: ${walkingContext.currentWalkingDuration} min`);
      }
      
      if (fastingContext && fastingContext.isCurrentlyFasting) {
        contextParts.push(`Currently fasting: ${fastingContext.currentFastDuration}h`);
      }
      
      if (foodContext && foodContext.todayCalories > 0) {
        contextParts.push(`Today: ${foodContext.todayCalories} cal`);
      }
      
      // Only add context if really needed
      if (contextParts.length > 0) {
        enhancedHistory.unshift({
          role: 'system',
          content: `Context: ${contextParts.join(', ')}`
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

      // Handle potential function calls in the response
      if (data.completion) {
        const aiMessage: Message = {
          role: 'assistant',
          content: data.completion,
          timestamp: new Date(),
          audioEnabled: audioEnabled && fromVoice
        };

        await addMessage(aiMessage);

        // Play audio if enabled and this was a voice message
        if (audioEnabled && fromVoice) {
          await playTextAsAudio(data.completion);
        }
      }

      // Handle function call results
      if (data.functionCall) {
        const { name, result } = data.functionCall;
        
        switch (name) {
          case 'create_motivator':
            toast({
              title: "Motivator Created",
              description: "I've created a personalized motivator for you!",
              duration: 3000,
            });
            break;
          case 'start_walking_session':
            if (result.includes('started')) {
              toast({
                title: "Walking Session Started",
                description: "Your walking session has begun. Have a great walk!",
                duration: 3000,
              });
            }
            break;
          case 'add_food_entry':
            if (result.includes('Added')) {
              toast({
                title: "Food Logged",
                description: "I've added this food to your nutrition log!",
                duration: 3000,
              });
            }
            break;
        }
      }

    } catch (error) {
      console.error('Error sending message to AI:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
        duration: 3000,
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

  const handleSendMessage = async (presetMessage?: string) => {
    const messageToSend = presetMessage || inputMessage.trim();
    if (!messageToSend || isProcessing) return;

    const userMessage: Message = {
      role: 'user',
      content: messageToSend,
      timestamp: new Date()
    };

    // Add user message to conversation
    const success = await addMessage(userMessage);
    if (!success) return;

    if (!presetMessage) {
      setInputMessage('');
    }

    await sendToAI(messageToSend, getConversationHistory());
  };

  const handleSaveApiKey = () => {
    localStorage.setItem('openai_api_key', apiKey);
    setShowApiDialog(false);
    toast({
      title: "API Key Saved",
      description: "Your OpenAI API key has been saved locally.",
      duration: 3000,
    });
  };

  const handleImageUpload = async (imageUrl: string) => {
    setUploadedImageUrl(imageUrl);
    setShowImageUpload(false);
    
    // Analyze the food image
    try {
      setIsProcessing(true);
      
      const { data, error } = await supabase.functions.invoke('analyze-food-image', {
        body: { 
          imageUrl: imageUrl
        }
      });

      if (error) throw error;

      if (data.success) {
        const { nutritionData } = data;
        
        // Add the image and analysis to the conversation
        const userMessage: Message = {
          role: 'user',
          content: `[Image uploaded: Food photo]`,
          timestamp: new Date(),
          imageUrl: imageUrl
        };
        
        await addMessage(userMessage);

        // Send analysis to AI for further processing
        const analysisPrompt = `I've analyzed this food image and found: ${nutritionData.name} with ${nutritionData.calories_per_100g} calories per 100g and ${nutritionData.carbs_per_100g}g carbs per 100g. Estimated serving size: ${nutritionData.estimated_serving_size}g. Would you like me to add this to your food log?`;
        
        await sendToAI(analysisPrompt, getConversationHistory());
      } else {
        throw new Error(data.error || 'Failed to analyze image');
      }
    } catch (error) {
      console.error('Error analyzing food image:', error);
      toast({
        title: "Analysis Failed",
        description: "Could not analyze the food image. Please try again.",
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImageRemove = () => {
    setUploadedImageUrl('');
  };

  const handleClearConversation = async () => {
    await clearConversation();
  };

  const handleArchiveConversation = async () => {
    await archiveConversation();
  };

  // Display messages or show welcome message
  const displayMessages = messages.length > 0 ? messages : [
    {
      role: 'assistant' as const,
      content: "Hello! I'm your AI companion for health and wellness. I can help you with fasting guidance, walking sessions, food logging, and creating motivational content. How can I assist you today?",
      timestamp: new Date(),
      audioEnabled: false
    }
  ];

  if (conversationLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] max-w-4xl mx-auto bg-background mt-12">{/* CRITICAL: Always subtract navigation height (80px) from h-screen to prevent layout issues */}
      {/* Header */}
      <div className="flex-shrink-0 border-b border-border p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">AI Companion</h1>
          <div className="flex items-center gap-1 overflow-hidden">
            <div className="flex items-center gap-1 shrink-0">
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
                <Button variant="outline" size="sm" className="shrink-0">
                  <MoreVertical className="h-4 w-4" />
                  <span className="hidden md:inline ml-1">Options</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleArchiveConversation}>
                  <Archive className="h-4 w-4 mr-2" />
                  Archive & Start Fresh
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleClearConversation} className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={showApiDialog} onOpenChange={setShowApiDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="shrink-0">
                  <Settings className="h-4 w-4" />
                  <span className="hidden md:inline ml-1">API</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>OpenAI API Configuration</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="api-key">OpenAI API Key</Label>
                    <Input
                      id="api-key"
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="sk-..."
                      className="mt-2"
                    />
                  </div>
                  <Button onClick={handleSaveApiKey} className="w-full">
                    Save API Key
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>


      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {displayMessages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <Card className={`max-w-[80%] p-3 ${
              message.role === 'user' 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted'
            }`}>
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  {message.imageUrl && (
                    <img 
                      src={message.imageUrl} 
                      alt="Uploaded food" 
                      className="rounded-lg mb-2 max-w-full h-auto max-h-48 object-cover"
                    />
                  )}
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  
                  {/* Yes/No Confirmation Buttons for Assistant Messages */}
                  {message.role === 'assistant' && (
                    message.content.toLowerCase().includes('would you like') || 
                    message.content.toLowerCase().includes('should i') ||
                    message.content.toLowerCase().includes('do you want')
                  ) && (
                    <div className="flex gap-2 mt-3">
                      <Button 
                        size="sm" 
                        onClick={() => handleSendMessage('Yes')}
                        className="text-xs"
                        type="button"
                      >
                        Yes
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleSendMessage('No')}
                        className="text-xs"
                        type="button"
                      >
                        No
                      </Button>
                    </div>
                  )}
                  
                  <p className="text-xs opacity-70 mt-1">
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
            <Card className="max-w-[80%] p-3 bg-muted">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                <p className="text-sm">AI is thinking...</p>
              </div>
            </Card>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input - CRITICAL: Add bottom padding to prevent overlap with navigation */}
      <div className="flex-shrink-0 border-t border-border p-4 pb-6 mb-16">{/* CRITICAL: mb-16 ensures input stays above navigation */}
        <div className="space-y-3">
          {/* Image Upload Section */}
          {showImageUpload && (
            <div className="border border-border rounded-lg p-3 bg-ceramic-plate/50">
              <ImageUpload
                currentImageUrl={uploadedImageUrl}
                onImageUpload={handleImageUpload}
                onImageRemove={handleImageRemove}
              />
            </div>
          )}
          
          {/* Input Area */}
          <div className="flex gap-2 items-end">
            <div className="flex-1 relative">
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask me anything about your health journey..."
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                disabled={isProcessing}
                className="resize-none pr-10"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowImageUpload(!showImageUpload)}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-primary/10"
                title="Upload food photo"
              >
                <Camera className="w-4 h-4" />
              </Button>
            </div>
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
          <div className="flex justify-center">
            <VoiceRecorder
              onTranscription={handleVoiceTranscription}
              isDisabled={isProcessing}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiChat;