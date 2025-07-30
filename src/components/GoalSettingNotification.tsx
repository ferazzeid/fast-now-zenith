import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Target, Calculator, Zap } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';

interface GoalOption {
  id: string;
  title: string;
  description: string;
  calorieGoal: number;
  carbGoal: number;
  deficitAmount: number;
  expectedWeightLoss: string;
  ketosisLevel: string;
}

interface GoalSettingNotificationProps {
  onGoalSelected: (calorieGoal: number, carbGoal: number) => void;
  onDismiss: () => void;
}

export const GoalSettingNotification: React.FC<GoalSettingNotificationProps> = ({
  onGoalSelected,
  onDismiss
}) => {
  const { profile, calculateBMR } = useProfile();
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);

  if (!profile || !profile.weight || !profile.height || !profile.age) {
    return null;
  }

  const bmr = calculateBMR();
  const activityMultipliers = {
    sedentary: 1.2,
    lightly_active: 1.375,
    moderately_active: 1.55,
    very_active: 1.725,
    extra_active: 1.9
  };
  
  const activityLevel = profile.activity_level || 'moderately_active';
  const tdee = Math.round(bmr * activityMultipliers[activityLevel as keyof typeof activityMultipliers]);

  const goalOptions: GoalOption[] = [
    {
      id: 'moderate',
      title: 'Moderate Fat Loss',
      description: 'Sustainable weight loss with moderate carb restriction',
      calorieGoal: tdee - 500,
      carbGoal: 40,
      deficitAmount: 500,
      expectedWeightLoss: '1 lb/week',
      ketosisLevel: 'Light ketosis (3-5 days)'
    },
    {
      id: 'aggressive',
      title: 'Aggressive Fat Loss',
      description: 'Faster weight loss with strict carb restriction',
      calorieGoal: tdee - 750,
      carbGoal: 25,
      deficitAmount: 750,
      expectedWeightLoss: '1.5 lbs/week',
      ketosisLevel: 'Moderate ketosis (2-3 days)'
    },
    {
      id: 'extreme',
      title: 'Maximum Fat Loss',
      description: 'Very rapid weight loss with minimal carbs',
      calorieGoal: tdee - 1000,
      carbGoal: 15,
      deficitAmount: 1000,
      expectedWeightLoss: '2 lbs/week',
      ketosisLevel: 'Deep ketosis (1-2 days)'
    }
  ];

  const handleGoalSelection = (goal: GoalOption) => {
    setSelectedGoal(goal.id);
    onGoalSelected(goal.calorieGoal, goal.carbGoal);
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          <Target className="w-6 h-6 text-primary" />
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Let's Set Your Goals!
            </h3>
            <p className="text-sm text-muted-foreground">
              Based on your profile, here are personalized recommendations
            </p>
          </div>
        </div>

        <div className="bg-muted/50 p-3 rounded-lg">
          <div className="flex items-center space-x-2 text-sm">
            <Calculator className="w-4 h-4 text-primary" />
            <span className="font-medium">Your Metabolic Profile:</span>
          </div>
          <div className="text-xs text-muted-foreground mt-1 space-y-1">
            <div>• BMR: {bmr} calories/day (at rest)</div>
            <div>• TDEE: {tdee} calories/day (with activity)</div>
            <div>• Activity Level: {activityLevel.replace('_', ' ')}</div>
          </div>
        </div>

        <div className="space-y-3">
          {goalOptions.map((goal) => (
            <Button
              key={goal.id}
              variant={selectedGoal === goal.id ? "default" : "outline"}
              className="w-full h-auto p-4 justify-start"
              onClick={() => handleGoalSelection(goal)}
            >
              <div className="text-left space-y-2 w-full">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{goal.title}</span>
                  <Zap className="w-4 h-4" />
                </div>
                <p className="text-xs opacity-80">{goal.description}</p>
                <div className="grid grid-cols-2 gap-2 text-xs opacity-70">
                  <div>📊 {goal.calorieGoal} cal/day (-{goal.deficitAmount})</div>
                  <div>🥬 {goal.carbGoal}g carbs/day</div>
                  <div>📈 {goal.expectedWeightLoss}</div>
                  <div>⚡ {goal.ketosisLevel}</div>
                </div>
              </div>
            </Button>
          ))}
        </div>

        <div className="flex space-x-2 pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="flex-1"
          >
            Skip for now
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onGoalSelected(0, 0)}
            className="flex-1"
          >
            Set manually
          </Button>
        </div>
      </div>
    </Card>
  );
};