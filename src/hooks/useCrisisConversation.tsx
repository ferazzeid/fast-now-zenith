import { useState, useCallback } from 'react';
import { useMotivators } from '@/hooks/useMotivators';
import { useCrisisSettings } from '@/hooks/useCrisisSettings';
import { useProfile } from '@/hooks/useProfile';

interface CrisisContextData {
  fastType: 'intermittent' | 'longterm';
  timeElapsed: number;
  goalDuration: number;
  progress: number;
  isInEatingWindow?: boolean;
}

export const useCrisisConversation = () => {
  const [isGeneratingContext, setIsGeneratingContext] = useState(false);
  const { motivators } = useMotivators();
  const { settings: crisisSettings } = useCrisisSettings();
  const { profile } = useProfile();

  const generateCrisisContext = useCallback((data: CrisisContextData) => {
    const { fastType, timeElapsed, goalDuration, progress, isInEatingWindow } = data;
    
    const formatTime = (seconds: number) => {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return `${hours}h ${minutes}m`;
    };

    const activeMotivators = motivators.filter(m => m.is_active);
    const hasMotivators = activeMotivators.length > 0;

    // Build context based on fast type and progress
    let contextParts = [
      `I understand you're having a challenging moment during your fast. I'm here to help you work through this.`,
      ``,
      `Your Current Fast:`,
      `• Type: ${fastType === 'intermittent' ? `Intermittent (${Math.floor(goalDuration / 3600)}h fast)` : `Extended Fast (${Math.floor(goalDuration / 3600)} hours)`}`,
      `• Time Elapsed: ${formatTime(timeElapsed)}`,
      `• Progress: ${Math.round(progress)}%`,
    ];

    if (isInEatingWindow) {
      contextParts.push(`• Status: Currently in eating window`);
    }

    if (hasMotivators) {
      contextParts.push(
        ``,
        `Your Goals & Motivators:`,
        ...activeMotivators.slice(0, 3).map(m => `• ${m.title}: ${m.content}`)
      );
    }

    contextParts.push(
      ``,
      `Let's talk about what you're experiencing right now. What's making this moment particularly difficult?`
    );

    return contextParts.join('\n');
  }, [motivators]);

  const generateSystemPrompt = useCallback(() => {
    const intensityDescriptions = {
      1: 'extremely gentle and understanding',
      2: 'very gentle with soft encouragement',
      3: 'gentle but supportive',
      4: 'balanced and understanding',
      5: 'moderately encouraging',
      6: 'confident and motivating',
      7: 'direct and motivating',
      8: 'assertive and challenging',
      9: 'firm and demanding',
      10: 'intense and uncompromising'
    };

    const styleDescriptions = {
      direct: 'straightforward and honest, focusing on facts and practical solutions',
      motivational: 'inspiring and uplifting, focusing on goals and positive outcomes',
      tough_love: 'firm but caring, willing to challenge them when necessary',
      psychological: 'understanding and analytical, exploring underlying emotions and patterns'
    };

    return `You are a specialized crisis intervention AI for fasting support. Your role is to:

1. PROVIDE IMMEDIATE EMOTIONAL SUPPORT - Acknowledge their struggle and validate their feelings
2. ASSESS THE SITUATION - Understand what triggered this crisis moment
3. OFFER COPING STRATEGIES - Provide practical techniques to manage cravings, stress, or discomfort
4. REINFORCE THEIR GOALS - Remind them why they started this fast and their progress so far
5. SUGGEST ALTERNATIVES - If breaking the fast is necessary, help them do it safely and plan to restart

COMMUNICATION STYLE:
- Use a ${styleDescriptions[crisisSettings.style]} approach
- Intensity level: ${crisisSettings.intensity}/10 (${intensityDescriptions[crisisSettings.intensity]})
- Be ${crisisSettings.intensity >= 7 ? 'direct and challenging' : crisisSettings.intensity >= 4 ? 'balanced and supportive' : 'gentle and understanding'}

IMPORTANT GUIDELINES:
- Never shame or judge them for struggling
- Focus on harm reduction if they're determined to break the fast
- Encourage professional help if they mention serious health concerns
- Keep responses conversational, supportive, and actionable
- Ask follow-up questions to understand their specific situation better
- Use their personal motivators and goals in your responses when relevant

HARM REDUCTION OPTIONS (if they're determined to break the fast):
- Water fasting: electrolyte water, bone broth, pickle juice
- Extended fasting: transition to intermittent fasting
- Intermittent fasting: extend eating window by 1-2 hours, then get back on track

Remember: This is a moment of vulnerability. Your goal is to help them through this crisis while respecting their autonomy and wellbeing.`;
  }, [crisisSettings]);

  const generateProactiveMessage = useCallback(() => {
    const messages = [
      `I see you're looking for support right now. That takes courage, and I'm here to help you through this difficult moment.`,
      
      `What's going on? Are you:`,
      `• About to break your fast?`,
      `• Extremely hungry and unsure if you can continue?`,
      `• Having mood swings or emotional difficulties?`,
      `• Already ate something you regret?`,
      `• Dealing with something else entirely?`,
      
      `Let me know what you're experiencing, and we'll work through this together.`
    ];

    return messages.join('\n\n');
  }, []);

  const generateQuickReplies = useCallback(() => {
    return [
      "I'm about to break my fast",
      "I'm extremely hungry",
      "I already ate something",
      "Having mood swings",
      "Physical discomfort",
      "Something else"
    ];
  }, []);

  return {
    generateCrisisContext,
    generateSystemPrompt,
    generateProactiveMessage,
    generateQuickReplies,
    isGeneratingContext
  };
};