import React, { useState, useEffect } from 'react';
import { X, Heart, Target, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogPortal, DialogOverlay, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { useAuth } from '@/hooks/useAuth';
import { useFastingContext } from '@/hooks/useFastingContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CrisisModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CrisisSettings {
  style: 'direct' | 'motivational' | 'tough_love' | 'psychological';
  intensity: number;
}

export const CrisisModal: React.FC<CrisisModalProps> = ({ isOpen, onClose }) => {
  const [aiResponse, setAiResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [crisisSettings, setCrisisSettings] = useState<CrisisSettings>({
    style: 'psychological',
    intensity: 7
  });
  const { user } = useAuth();
  const { context, buildContextString } = useFastingContext();
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadCrisisSettings();
      generateCrisisIntervention();
    }
  }, [isOpen]);

  const loadCrisisSettings = async () => {
    try {
      const { data } = await supabase
        .from('shared_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['ai_crisis_style', 'ai_coaching_encouragement_level']);

      const settingsMap: Record<string, string> = {};
      if (data) {
        data.forEach(setting => {
          settingsMap[setting.setting_key] = setting.setting_value;
        });
      }

      setCrisisSettings({
        style: (settingsMap.ai_crisis_style as CrisisSettings['style']) || 'psychological',
        intensity: parseInt(settingsMap.ai_coaching_encouragement_level || '7')
      });
    } catch (error) {
      console.error('Error loading crisis settings:', error);
    }
  };

  const generateCrisisIntervention = async () => {
    if (!user || !context) return;

    setLoading(true);
    try {
      // Get user's stored goals/motivations from profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('user_id', user.id)
        .single();

      // Get user's motivators for personalization
      const { data: motivators } = await supabase
        .from('motivators')
        .select('title, content, category')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .limit(3);

      const userGoals = motivators?.map(m => `${m.title} (${m.category})`).join(', ') || 'your fasting goals';
      const contextString = buildContextString(context);

      // Create crisis-specific system prompt based on style
      const stylePrompts = {
        direct: "You are a direct, no-nonsense fasting coach. Be assertive and straightforward.",
        motivational: "You are an uplifting, encouraging fasting coach. Be positive and supportive.",
        tough_love: "You are a tough-love fasting coach. Be firm but caring, challenging the user.",
        psychological: "You are a psychological fasting coach. Use persuasive techniques, remind them of past failures and successes, challenge their commitment."
      };

      const crisisPrompt = `${stylePrompts[crisisSettings.style]}

The user is having a moment of weakness and pressed the panic button during their fast. Your intensity level is ${crisisSettings.intensity}/10. 

User context: ${contextString}
User's goals: ${userGoals}
User's name: ${profile?.display_name || 'there'}

Create a powerful 2-3 sentence crisis intervention that:
${crisisSettings.style === 'psychological' ? 
  "- Reminds them of their past failures and how giving up again will feel\n- Questions their commitment: 'Were you really serious about [their goals]?'\n- Uses psychological pressure: 'Everyone reaches this point, most people push through, are you going to be the one who gives up?'\n- Mentions their specific goals and why they started" :
  "- Addresses their moment of weakness directly\n- Reminds them of their goals and why they started\n- Motivates them to push through this difficult moment"
}

Be ${crisisSettings.intensity > 7 ? 'very intense and confrontational' : crisisSettings.intensity > 5 ? 'moderately firm' : 'gentle but persuasive'}. No pleasantries - get straight to the point.`;

      const response = await supabase.functions.invoke('chat-completion', {
        body: { 
          message: `I'm struggling and want to give up on my fast right now.`,
          conversationHistory: [
            {
              role: 'system',
              content: crisisPrompt
            }
          ]
        },
        headers: {
          'X-OpenAI-API-Key': localStorage.getItem('openaiApiKey') || ''
        }
      });

      console.log('Crisis AI response:', { 
        hasData: !!response.data, 
        response: response.data?.response, 
        error: response.error,
        fullResponse: response.data 
      });

      // Check for AI response in multiple possible formats
      const aiText = response.data?.response || 
                   response.data?.message?.content || 
                   response.data?.choices?.[0]?.message?.content;

      if (aiText) {
        setAiResponse(aiText);
      } else {
        console.error('No AI response found in:', response.data);
        throw new Error('No response from AI');
      }
    } catch (error) {
      console.error('Error generating crisis intervention:', error);
      setAiResponse(generateFallbackMessage());
      // Don't show error toast to user - just use fallback silently
    } finally {
      // Add minimum display time so users can see the modal
      setTimeout(() => setLoading(false), 1000);
    }
  };

  const generateFallbackMessage = () => {
    const messages = {
      psychological: `Look, you've given up before, haven't you? How did that feel? Right now everyone doing intermittent fasting reaches this exact moment - the difference is most people push through. Are you really going to quit on ${context?.fastingGoal || 'your goals'} again? This feeling will pass in 10 minutes, but giving up lasts forever.`,
      tough_love: `Stop right there! You made a commitment to yourself and you're stronger than this craving. This is exactly when your fast begins to work - when it gets difficult. Don't throw away your progress now.`,
      motivational: `You've got this! This difficult moment is proof that your fast is working. Every successful faster has felt exactly what you're feeling right now. You're so close to breaking through to the other side.`,
      direct: `This is temporary. Your goals are permanent. You chose to fast for a reason - that reason hasn't changed in the last few minutes. Push through this moment.`
    };
    return messages[crisisSettings.style];
  };

  const handleContinueFast = () => {
    toast({
      title: "💪 Strong Choice!",
      description: "You chose to stay strong. You've got this!",
    });
    onClose();
  };

  const handleStillStruggling = () => {
    // Could extend to show additional resources or motivators
    generateCrisisIntervention();
  };

  // Add debug logging
  console.log('CrisisModal render:', { isOpen, loading, aiResponse: !!aiResponse });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogPortal>
        <DialogOverlay className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogContent className="fixed left-[50%] top-[50%] z-[101] translate-x-[-50%] translate-y-[-50%] w-full max-w-md bg-red-950 border-red-800 text-white shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:rounded-lg mx-4">
        <VisuallyHidden>
          <DialogTitle>Crisis Intervention</DialogTitle>
          <DialogDescription>Emergency motivational support during difficult moments</DialogDescription>
        </VisuallyHidden>
        <div className="space-y-6 p-2">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto">
              <Heart className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-red-100">STOP</h2>
            <p className="text-red-200 text-sm">Crisis Intervention</p>
          </div>

          {/* AI Crisis Message */}
          <div className="bg-red-900/50 p-4 rounded-lg border border-red-700">
            {loading ? (
              <div className="text-center space-y-2">
                <div className="w-6 h-6 border-2 border-red-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-red-200 text-sm">Generating intervention...</p>
              </div>
            ) : (
              <p className="text-red-100 font-medium leading-relaxed">
                {aiResponse}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={handleContinueFast}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold"
              size="lg"
            >
              <Target className="w-5 h-5 mr-2" />
              I'll Stay Strong
            </Button>
            
            <Button
              onClick={handleStillStruggling}
              variant="outline"
              className="w-full border-red-600 text-red-200 hover:bg-red-800/50"
              disabled={loading}
            >
              <Zap className="w-5 h-5 mr-2" />
              I Still Need Help
            </Button>
          </div>

          {/* Close Button */}
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="absolute top-4 right-4 text-red-300 hover:text-white hover:bg-red-800/50"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
};