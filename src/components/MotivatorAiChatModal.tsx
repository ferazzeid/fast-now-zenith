import { useState, useEffect, useRef } from 'react';
import { X, Send, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { UniversalModal } from '@/components/ui/universal-modal';
import { useToast } from '@/hooks/use-toast';
import { useMotivators } from '@/hooks/useMotivators';
import { supabase } from '@/integrations/supabase/client';
import { CircularVoiceButton } from '@/components/CircularVoiceButton';
import { generate_image } from '@/utils/imageGeneration';
import { RegenerateImageButton } from '@/components/RegenerateImageButton';
import { PremiumGate } from '@/components/PremiumGate';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  audioEnabled?: boolean;
}

interface MotivatorAiChatModalProps {
  onClose: () => void;
}

export const MotivatorAiChatModal = ({ onClose }: MotivatorAiChatModalProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { createMotivator, updateMotivator, refreshMotivators } = useMotivators();

  // Initial AI message with specific examples
  useEffect(() => {
    const initialMessage: Message = {
      role: 'assistant',
      content: `Welcome! I'm here to help you create powerful motivators for your fasting journey. Let me share some real examples that work incredibly well:

**Fitting into clothes** - This is one of the most powerful motivators. Think about:
• That pair of pants you bought but never wore
• Clothes you used to fit into years ago
• A tuxedo or special outfit for an upcoming event (wedding, reunion, etc.)

The magic happens when you combine this with:
• A specific deadline (like a wedding date)
• Financial investment (you bought something expensive)
• Social validation (others will see you)
• Progress tracking (trying them on regularly)

**Impressing someone specific** - This might not be the most noble goal, but it works:
• Someone who used to like you but doesn't anymore
• People who insulted you or doubted you
• Someone you want to attract or re-attract

For each motivator, record a voice message telling me:
1. What specifically motivates you
2. Why it's important to you
3. Any deadlines or events involved
4. The emotional impact you want

I'll create each motivator in your database with a placeholder image. Then you should replace it with real photos - like actually wearing those tight clothes or a photo of the person you want to impress.

What's your first powerful motivator? Record it and tell me everything!`,
      timestamp: new Date()
    };
    setMessages([initialMessage]);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
    if (!messageToSend || isLoading) return;

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

  const sendToAI = async (message: string, fromVoice = false) => {
    setIsLoading(true);

    try {
      // Build conversation history for context
      const conversationHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const systemPrompt = `You are a motivational coach specialized in creating powerful fasting motivators. Your goal is to help users create specific, emotionally resonant motivators.

IMPORTANT: Each voice message from the user should be processed individually to create separate motivators. If they mention multiple motivators in one message, split them into separate ones.

When a user describes a motivator, immediately create it by responding with a JSON object:
{
  "action": "create_motivator",
  "title": "Brief, powerful title (max 50 chars)",
  "content": "Detailed description based on their story (max 200 chars)",
  "category": "personal" | "health" | "achievement" | "mindset"
}

MOTIVATOR CREATION GUIDELINES:
- Use their exact words and emotional language
- Include specific details they mentioned (dates, people, clothes, etc.)
- Make it personal and emotionally charged
- Focus on the outcome they want
- Include any deadlines or social elements
- Reference specific items (clothes, photos, events)

RESPONSE STYLE:
- After creating each motivator, tell them: "I've created your motivator! I'm also generating a motivational image for it automatically - you can replace it later with your own photos if you prefer."
- Ask if they have more motivators to add
- Keep responses encouraging and action-oriented
- Don't ask too many clarifying questions - create the motivator from what they give you

ALWAYS create the motivator immediately when they describe one. Don't ask for permission.`;

      const { data, error } = await supabase.functions.invoke('chat-completion', {
        body: {
          message,
          conversationHistory: [
            { role: 'system', content: systemPrompt },
            ...conversationHistory
          ]
        }
      });

      if (error) throw error;

      // Check if response contains motivator creation JSON
      let motivatorCreated = false;
      let aiResponse = data.completion;

      try {
        // Look for JSON in the response
        const jsonMatch = data.completion.match(/\{[\s\S]*?"action":\s*"create_motivator"[\s\S]*?\}/);
        if (jsonMatch) {
          const motivatorData = JSON.parse(jsonMatch[0]);
          if (motivatorData.action === 'create_motivator') {
            // Create the motivator first
            const motivatorId = await createMotivator({
              title: motivatorData.title,
              content: motivatorData.content,
              category: motivatorData.category || 'personal'
            });
            
            motivatorCreated = true;
            // Remove JSON from AI response for display
            aiResponse = data.completion.replace(jsonMatch[0], '').trim();
            
            toast({
              title: "✨ Motivator Created!",
              description: `"${motivatorData.title}" has been added to your motivators.`,
            });

            // Generate image in background if motivator was created successfully
            if (motivatorId) {
              generateImageForMotivator(motivatorId, motivatorData.title, motivatorData.content);
            }
          }
        }
      } catch (parseError) {
        console.error('Error parsing motivator JSON:', parseError);
      }

      const aiMessage: Message = {
        role: 'assistant',
        content: aiResponse || data.completion,
        timestamp: new Date(),
        audioEnabled: audioEnabled && fromVoice
      };

      setMessages(prev => [...prev, aiMessage]);

      // Play audio if enabled and this was a voice message
      if (audioEnabled && fromVoice && aiResponse) {
        await playTextAsAudio(aiResponse);
      }

      if (motivatorCreated) {
        refreshMotivators();
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

  const generateImageForMotivator = async (motivatorId: string, title: string, content: string) => {
    try {
      setIsGeneratingImage(true);

      // Extract concept from title/content
      let concept = title;
      try {
        // Get user's OpenAI API key
        const { data: profile } = await supabase
          .from('profiles')
          .select('openai_api_key, use_own_api_key')
          .maybeSingle();

        let apiKey = profile?.use_own_api_key ? (profile.openai_api_key || undefined) : undefined;
        if (!apiKey && typeof window !== 'undefined' && profile?.use_own_api_key) {
          const localKey = localStorage.getItem('openai_api_key');
          if (localKey) apiKey = localKey;
        }

        const { data: conceptData } = await supabase.functions.invoke('extract-motivator-concept', {
          body: { title, content, apiKey }
        });
        if (conceptData?.concept) concept = conceptData.concept;
      } catch {}

      // Define style presets
      const STYLE_PRESETS: Record<string, string> = {
        'minimalist_bw': 'Minimalist vector poster in pure black and white only (no other colors). Single bold silhouette or icon as visual metaphor: {concept}. Flat shapes, clean geometry, strong contrast, ample negative space. Centered composition, no people or faces, no text/letters/logos/watermarks/UI. No gradients, no textures, no 3D, no photorealism, no backgrounds/scenes/props/patterns. 1:1 square, crisp, editorial poster quality.',
        'vibrant_color': 'Minimalist poster design of {concept}. Use exactly 2-3 colors maximum: deep red, black, and white only. Clean geometric shapes, bold silhouette, strong contrast. Centered composition, no text, no fonts, no letters, no words, no numbers, no UI elements, no people, no faces. Simple, modern, classic aesthetic. Professional poster quality, 1:1 square format.',
        'photorealistic': 'Professional photography of {concept}. Realistic, natural lighting with soft shadows and depth. High-quality DSLR camera shot, crisp focus, natural colors and textures. Clean composition with subtle background blur. Documentary or editorial photography style, authentic and inspiring mood. No people or faces, no artificial effects, no text/logos. Square format, professional quality.',
        'artistic_painterly': 'Artistic illustration of {concept} in watercolor or oil painting style. Soft brushstrokes, artistic texture, flowing colors that blend naturally. Inspiring and uplifting mood with warm or cool color palette. Hand-painted aesthetic, organic shapes, artistic interpretation rather than literal representation. No people or faces, no text/logos. Square canvas format, fine art quality.'
      };

      // Load brand primary color and optional admin template
      let primaryColor = "220 35% 45%";
      let adminTemplate: string | undefined;
      let selectedPreset = 'minimalist_bw';
      try {
        const { data: settingsData } = await supabase
          .from('shared_settings')
          .select('setting_key, setting_value')
          .in('setting_key', ['brand_primary_color', 'ai_image_motivator_prompt', 'ai_image_motivator_prompt_preset']);
        settingsData?.forEach((s) => {
          if (s.setting_key === 'brand_primary_color' && s.setting_value) primaryColor = s.setting_value;
          if (s.setting_key === 'ai_image_motivator_prompt' && s.setting_value) adminTemplate = s.setting_value;
          if (s.setting_key === 'ai_image_motivator_prompt_preset' && s.setting_value) selectedPreset = s.setting_value;
        });
      } catch {}

      const defaultConceptTemplate =
        "Create a minimalist illustration in the style of a black and white photograph, using only black, white, and {primary_color}. The subject of the image should be: {concept}. No accent color, no other colors, no background details, no people or faces, no text. Style: simple, modern, and inspiring.";
      // Use preset template or custom admin template
      const templateToUse = (adminTemplate && adminTemplate.includes('{concept}'))
        ? adminTemplate
        : STYLE_PRESETS[selectedPreset] || defaultConceptTemplate;

      const imagePrompt = templateToUse
        .replace(/{concept}/g, concept)
        .replace(/{primary_color}/g, primaryColor);
      
      const filename = `motivator-${motivatorId}.jpg`;
      const imageUrl = await generate_image(imagePrompt, filename);
      await updateMotivator(motivatorId, { imageUrl });
      
      toast({
        title: "🎨 Image Generated!",
        description: "AI generated an image for your motivator.",
      });
      
    } catch (error) {
      console.error('Error generating image for motivator:', error);
      console.log('Image generation failed, but motivator was created successfully');
    } finally {
      setIsGeneratingImage(false);
    }
  };



  return (
    <UniversalModal
      isOpen={true}
      onClose={onClose}
      title="AI Motivator Coach"
      variant="standard"
      size="md"
      showCloseButton={true}
    >
      {/* Audio toggle */}
      <div className="flex items-center gap-2 mb-4 justify-end">
        <Switch
          id="modal-audio-mode"
          checked={audioEnabled}
          onCheckedChange={setAudioEnabled}
          className="scale-75"
        />
        <Label htmlFor="modal-audio-mode" className="text-sm">
          {audioEnabled ? <Volume2 className="h-3 w-3" /> : <VolumeX className="h-3 w-3" />}
        </Label>
      </div>

      {/* Messages */}
      <div className="space-y-4 max-h-[400px] overflow-y-auto mb-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <Card className={`max-w-[85%] p-3 ${
                message.role === 'user' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted'
              }`}>
                <div className="flex items-start gap-2">
                  <div className="flex-1">
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
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
          
          {isLoading && (
            <div className="flex justify-start">
              <Card className="max-w-[85%] p-3 bg-muted">
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  <p className="text-sm">AI is thinking...</p>
                </div>
              </Card>
            </div>
          )}
          
          {isGeneratingImage && (
            <div className="flex justify-start">
              <Card className="max-w-[85%] p-3 bg-muted">
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  <p className="text-sm">🎨 Generating motivational image...</p>
                </div>
              </Card>
            </div>
          )}
          
          <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-border pt-4 mt-4 space-y-3">
        {/* Text Input */}
        <div className="flex gap-2 items-end">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Tell me what motivates you..."
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            onClick={() => handleSendMessage()}
            disabled={!inputMessage.trim() || isLoading}
            size="default"
            className="flex-shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Voice Recording */}
        <div className="flex justify-center">
          <PremiumGate feature="Voice Input" grayOutForFree={true}>
            <CircularVoiceButton
              onTranscription={handleVoiceTranscription}
              isDisabled={isLoading}
              size="lg"
            />
          </PremiumGate>
        </div>
      </div>
    </UniversalModal>
  );
};