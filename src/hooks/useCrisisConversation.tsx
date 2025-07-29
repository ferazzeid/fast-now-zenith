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

    // For intermittent fasting, cap time elapsed at goal duration and show today's progress
    let displayTime = timeElapsed;
    let displayProgress = progress;
    let statusText = '';

    if (fastType === 'intermittent') {
      displayTime = Math.min(timeElapsed, goalDuration);
      statusText = isInEatingWindow ? 'Currently in eating window' : `Fasting for ${formatTime(displayTime)} today`;
    } else {
      statusText = `Extended fast: ${formatTime(displayTime)} elapsed`;
    }

    return statusText;
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
    return `I'm here to help you through this difficult moment. What's going on?`;
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