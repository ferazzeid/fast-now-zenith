import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useDailyDeficit } from '@/hooks/useDailyDeficit';
import { useProfile } from '@/hooks/useProfile';
import { useGoalCalculations } from '@/hooks/useGoalCalculations';
import { useFoodEntries } from '@/hooks/useFoodEntries';
import { useWalkingSession } from '@/hooks/useWalkingSession';
import { useFastingSession } from '@/hooks/useFastingSession';
import { toast } from 'sonner';

export const useDeficitAnalysis = () => {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const { user } = useAuth();
  const { deficitData } = useDailyDeficit();
  const { profile } = useProfile();
  const { weeksToGoal, fatInGrams, thirtyDayProjection } = useGoalCalculations();
  const { todayEntries } = useFoodEntries();
  const { currentSession: walkingSession } = useWalkingSession();
  const { currentSession: fastingSession } = useFastingSession();

  // Separate consumed and unconsumed entries
  const consumedEntries = todayEntries.filter(entry => entry.consumed);
  const unconsumedEntries = todayEntries.filter(entry => !entry.consumed);

  const analyzeDeficit = async () => {
    if (!user) {
      toast.error('User not authenticated');
      return;
    }

    setLoading(true);
    try {
      // Package all relevant data
      const contextData = {
        deficit: {
          todayDeficit: deficitData.todayDeficit,
          bmr: deficitData.bmr,
          tdee: deficitData.tdee,
          caloriesConsumed: deficitData.caloriesConsumed,
          walkingCalories: deficitData.walkingCalories,
          manualCalories: deficitData.manualCalories,
          activityLevel: deficitData.activityLevel,
        },
        goals: {
          currentWeight: profile?.weight,
          goalWeight: profile?.goal_weight,
          weeksToGoal,
          fatInGrams,
          thirtyDayProjection,
        },
        food: {
          consumedToday: consumedEntries.length,
          plannedButNotConsumed: unconsumedEntries.length,
          consumedItems: consumedEntries.slice(0, 5).map(entry => ({
            name: entry.name,
            calories: entry.calories,
            carbs: entry.carbs
          })),
        },
        activity: {
          walkingActive: !!walkingSession,
          walkingDuration: walkingSession ? 
            Math.floor((new Date().getTime() - new Date(walkingSession.start_time).getTime()) / 60000) : 0,
          fastingActive: !!fastingSession,
          fastingDuration: fastingSession ? 
            Math.floor((new Date().getTime() - new Date(fastingSession.start_time).getTime()) / 3600000) : 0,
        },
        profile: {
          age: profile?.age,
          height: profile?.height,
          units: profile?.units,
          activityLevel: profile?.activity_level,
        }
      };

      const messages = [
        {
          role: 'system',
          content: `You are a health and fitness coach analyzing someone's daily progress. Be encouraging, specific, and actionable. Keep responses concise but insightful. Focus on:
          1. Current deficit performance vs goals
          2. Food choices and timing suggestions
          3. Activity recommendations
          4. Progress toward weight goals
          5. Practical next steps

          Be motivational but realistic. If they're doing well, celebrate it. If they need adjustments, suggest them kindly.`
        },
        {
          role: 'user',
          content: `Please analyze my daily progress and provide insights. Here's my current data:

**Calorie Deficit:**
- Today's deficit: ${deficitData.todayDeficit} calories
- BMR: ${deficitData.bmr} | TDEE: ${deficitData.tdee}
- Consumed: ${deficitData.caloriesConsumed} calories
- Burned walking: ${deficitData.walkingCalories} calories
- Manual exercise: ${deficitData.manualCalories} calories

**Goals:**
- Current weight: ${profile?.weight} ${profile?.units === 'metric' ? 'kg' : 'lbs'}
- Goal weight: ${profile?.goal_weight} ${profile?.units === 'metric' ? 'kg' : 'lbs'}
- Estimated weeks to goal: ${weeksToGoal || 'N/A'}
- Fat burning today: ${fatInGrams}g
- 30-day projection: ${thirtyDayProjection}g fat loss

**Food Tracking:**
- Items consumed today: ${consumedEntries.length}
- Items planned but not consumed: ${unconsumedEntries.length}
${consumedEntries.length > 0 ? `- Recent foods: ${consumedEntries.slice(0, 3).map(e => e.name).join(', ')}` : ''}

**Activity:**
${walkingSession ? `- Currently walking (${Math.floor((new Date().getTime() - new Date(walkingSession.start_time).getTime()) / 60000)} minutes so far)` : '- No active walking session'}
${fastingSession ? `- Currently fasting (${Math.floor((new Date().getTime() - new Date(fastingSession.start_time).getTime()) / 3600000)} hours so far)` : '- No active fasting session'}

Please provide a brief analysis with specific suggestions for the rest of my day.`
        }
      ];

      const { data, error } = await supabase.functions.invoke('chat-completion', {
        body: { 
          messages,
          timeout: 30000 // 30 second timeout
        }
      });

      if (error) throw error;

      setAnalysis(data.completion);
      toast.success('Analysis complete!');

    } catch (error) {
      console.error('Error analyzing deficit:', error);
      toast.error('Failed to analyze your data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return {
    analyzeDeficit,
    analysis,
    loading,
    clearAnalysis: () => setAnalysis(null)
  };
};