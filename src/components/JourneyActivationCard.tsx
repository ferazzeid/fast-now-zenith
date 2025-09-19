import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Rocket, Target } from "lucide-react";
import { useJourneyTracking } from "@/hooks/useJourneyTracking";

interface JourneyActivationCardProps {
  currentWeight: number | null;
  goalWeight: number | null;
}

export const JourneyActivationCard = ({ currentWeight, goalWeight }: JourneyActivationCardProps) => {
  const { startJourney, isStartingJourney } = useJourneyTracking();
  const [startWeight, setStartWeight] = useState(currentWeight?.toString() || '');
  const [targetWeight, setTargetWeight] = useState(goalWeight?.toString() || '');

  const handleStartJourney = () => {
    const startWeightNum = parseFloat(startWeight);
    const targetWeightNum = parseFloat(targetWeight);

    if (!startWeightNum || !targetWeightNum) {
      return;
    }

    if (startWeightNum <= targetWeightNum) {
      return;
    }

    startJourney({ startWeight: startWeightNum, targetWeight: targetWeightNum });
  };

  const isFormValid = () => {
    const startWeightNum = parseFloat(startWeight);
    const targetWeightNum = parseFloat(targetWeight);
    return startWeightNum > 0 && targetWeightNum > 0 && startWeightNum > targetWeightNum;
  };

  return (
    <Card className="border-2 border-dashed border-primary/50">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Rocket className="h-5 w-5 text-primary" />
          Start Your 90-Day Journey
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Begin tracking your weight loss progress with daily deficit and fat loss calculations
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="start-weight">Starting Weight (kg)</Label>
            <Input
              id="start-weight"
              type="number"
              step="0.1"
              value={startWeight}
              onChange={(e) => setStartWeight(e.target.value)}
              placeholder="Enter current weight"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="target-weight">Target Weight (kg)</Label>
            <Input
              id="target-weight"
              type="number"
              step="0.1"
              value={targetWeight}
              onChange={(e) => setTargetWeight(e.target.value)}
              placeholder="Enter goal weight"
            />
          </div>
        </div>

        {startWeight && targetWeight && (
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-primary" />
              <span className="font-medium text-sm">Journey Preview</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Weight to Lose</p>
                <p className="font-semibold">
                  {parseFloat(startWeight) && parseFloat(targetWeight) 
                    ? (parseFloat(startWeight) - parseFloat(targetWeight)).toFixed(1) + ' kg'
                    : '-- kg'
                  }
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Journey Length</p>
                <p className="font-semibold">90 Days</p>
              </div>
            </div>
          </div>
        )}

        <Button 
          onClick={handleStartJourney}
          disabled={!isFormValid() || isStartingJourney}
          className="w-full"
          size="lg"
        >
          {isStartingJourney ? (
            "Starting Journey..."
          ) : (
            <>
              <Rocket className="h-4 w-4 mr-2" />
              Start 90-Day Journey
            </>
          )}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          You can only have one active journey at a time. Starting a new journey will end your current one.
        </p>
      </CardContent>
    </Card>
  );
};