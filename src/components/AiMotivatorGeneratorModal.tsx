import { useState } from 'react';
import { X, Sparkles, Send, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useMotivators } from '@/hooks/useMotivators';
import { supabase } from '@/integrations/supabase/client';

interface AiMotivatorGeneratorModalProps {
  onClose: () => void;
}

export const AiMotivatorGeneratorModal = ({ onClose }: AiMotivatorGeneratorModalProps) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();
  const { createMotivator, refreshMotivators } = useMotivators();

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Enter your request",
        description: "Please describe what kind of motivators you'd like to create.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      // Generate motivators using AI
      const { data, error } = await supabase.functions.invoke('chat-completion', {
        body: {
          messages: [
            {
              role: 'system',
              content: `You are a motivational coach helping someone with their fasting journey. Create 3-5 personalized motivators based on the user's request. Each motivator should have a compelling title and inspiring description. 

Format your response as a JSON array of objects with this structure:
[
  {
    "title": "Compelling title (max 50 characters)",
    "content": "Inspiring description (max 200 characters)",
    "category": "health" | "personal" | "mindset" | "achievement"
  }
]

Make each motivator unique, actionable, and emotionally resonant. Focus on the benefits of fasting, personal growth, and achieving goals. Be encouraging and positive.`
            },
            {
              role: 'user',
              content: prompt
            }
          ]
        }
      });

      if (error) throw error;

      const response = data.response;
      let motivators;

      try {
        // Try to parse the JSON response
        motivators = JSON.parse(response);
      } catch (parseError) {
        // If JSON parsing fails, try to extract JSON from the response
        const jsonMatch = response.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          motivators = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('Could not parse AI response');
        }
      }

      if (!Array.isArray(motivators) || motivators.length === 0) {
        throw new Error('Invalid response format');
      }

      // Create each motivator
      let successCount = 0;
      for (const motivatorData of motivators) {
        try {
          await createMotivator({
            title: motivatorData.title,
            content: motivatorData.content,
            category: motivatorData.category || 'personal'
          });
          successCount++;
        } catch (error) {
          console.error('Error creating motivator:', error);
        }
      }

      if (successCount > 0) {
        toast({
          title: "✨ Motivators Created!",
          description: `Successfully created ${successCount} personalized motivator${successCount > 1 ? 's' : ''}.`,
        });
        
        refreshMotivators();
        onClose();
      } else {
        throw new Error('Failed to create any motivators');
      }

    } catch (error) {
      console.error('Error generating motivators:', error);
      toast({
        title: "Generation failed",
        description: "Please try again with a different request.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-ceramic-plate rounded-3xl w-full max-w-md max-h-[85vh] border border-ceramic-rim shadow-2xl mt-4">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-ceramic-rim">
          <div className="text-center flex-1">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles className="w-6 h-6 text-primary" />
              <h3 className="text-xl font-bold text-warm-text">AI Motivator Generator</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Create personalized motivators with AI
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="hover:bg-ceramic-rim"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="bg-primary/10 border border-primary/20 p-4 rounded-lg">
              <h4 className="font-medium text-warm-text mb-2">What should I create?</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>• "Motivators for when I feel tempted to break my fast"</p>
                <p>• "Reminders about why I started my health journey"</p>
                <p>• "Encouragement for reaching my weight goals"</p>
                <p>• "Positive affirmations for discipline and self-control"</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="prompt" className="text-warm-text font-medium">
                Describe what motivators you'd like *
              </Label>
              <Textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="bg-ceramic-base border-ceramic-rim min-h-[120px]"
                placeholder="I want motivators that help me stay focused when I'm tempted to eat outside my eating window. Something about remembering my goals and feeling proud of my progress..."
                disabled={isGenerating}
              />
              <p className="text-xs text-muted-foreground">
                Be specific about your goals, challenges, or what inspires you most.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 bg-ceramic-base border-ceramic-rim"
              disabled={isGenerating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={!prompt.trim() || isGenerating}
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isGenerating ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Generate Motivators
                </>
              )}
            </Button>
          </div>

          <div className="bg-accent/20 p-3 rounded-lg">
            <p className="text-xs text-muted-foreground">
              💡 The AI will create 3-5 personalized motivators based on your request. 
              Each will have a unique title and inspiring description.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};