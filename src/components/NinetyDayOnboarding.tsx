import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target, Calendar, Flame, Clock } from "lucide-react";
import { useJourneyTracking } from "@/hooks/useJourneyTracking";
import { useToast } from "@/hooks/use-toast";
import { ConfirmationModal } from "@/components/ui/ConfirmationModal";

interface NinetyDayOnboardingProps {
  onClose: () => void;
  onStart: () => void;
}

export const NinetyDayOnboarding = ({ onClose, onStart }: NinetyDayOnboardingProps) => {
  const { toast } = useToast();
  const { startJourney, isStartingJourney } = useJourneyTracking();
  
  const [step, setStep] = useState(1);
  const [showStartConfirmation, setShowStartConfirmation] = useState(false);
  const [formData, setFormData] = useState({
    startWeight: "",
    targetWeight: "",
    includeInitiationFast: false,
    dailyDeficitGoal: 1000,
    walkingGoalMinutes: 30,
  });

  const handleInputChange = (field: string, value: string | boolean | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleStartProgram = async () => {
    try {
      const startWeight = parseFloat(formData.startWeight);
      const targetWeight = parseFloat(formData.targetWeight);

      if (!startWeight || !targetWeight || startWeight <= targetWeight) {
        toast({
          title: "Invalid Input",
          description: "Please enter valid start and target weights. Start weight must be higher than target weight.",
          variant: "destructive"
        });
        return;
      }

      await startJourney({ startWeight, targetWeight });
      
      toast({
        title: "90-Day Program Started!",
        description: "Your journey begins now. Track your daily progress and stay motivated!",
      });
      
      onStart();
    } catch (error) {
      console.error("Error starting 90-day program:", error);
      toast({
        title: "Error",
        description: "Failed to start program. Please try again.",
        variant: "destructive"
      });
    }
  };

  const isFormValid = () => {
    const startWeight = parseFloat(formData.startWeight);
    const targetWeight = parseFloat(formData.targetWeight);
    return startWeight > 0 && targetWeight > 0 && startWeight > targetWeight;
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Launch Your 90-Day Program
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {step === 1 && (
            <>
              <div className="text-center space-y-4">
                <h3 className="text-xl font-semibold">Welcome to Your 90-Day Journey</h3>
                <p className="text-muted-foreground">
                  This program combines structured fasting, daily activity tracking, and progressive weight loss 
                  monitoring to help you achieve your goals systematically.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Fasting Milestones
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">Optional</Badge>
                      <span className="text-sm">3-day initiation fast</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="default" className="text-xs">Milestone</Badge>
                      <span className="text-sm">60-hour extended fast</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Daily Tracking
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="text-sm">• Caloric deficit monitoring</div>
                    <div className="text-sm">• Walking and activity goals</div>
                    <div className="text-sm">• Weight projections</div>
                  </CardContent>
                </Card>
              </div>

              <Button onClick={() => setStep(2)} className="w-full">
                Continue to Setup
              </Button>
            </>
          )}

          {step === 2 && (
            <>
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">Program Configuration</h3>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="start-weight">Starting Weight (kg)</Label>
                    <Input
                      id="start-weight"
                      type="number"
                      step="0.1"
                      placeholder="e.g. 80.5"
                      value={formData.startWeight}
                      onChange={(e) => handleInputChange('startWeight', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="target-weight">Target Weight (kg)</Label>
                    <Input
                      id="target-weight"
                      type="number"
                      step="0.1"
                      placeholder="e.g. 70.0"
                      value={formData.targetWeight}
                      onChange={(e) => handleInputChange('targetWeight', e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="initiation-fast">Include 3-Day Initiation Fast</Label>
                      <p className="text-sm text-muted-foreground">Start with an optional 3-day fast</p>
                    </div>
                    <Switch
                      id="initiation-fast"
                      checked={formData.includeInitiationFast}
                      onCheckedChange={(checked) => handleInputChange('includeInitiationFast', checked)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="deficit-goal">Daily Caloric Deficit Goal</Label>
                    <div className="flex items-center gap-2 mt-2">
                      <Input
                        id="deficit-goal"
                        type="number"
                        step="100"
                        className="w-32"
                        value={formData.dailyDeficitGoal}
                        onChange={(e) => handleInputChange('dailyDeficitGoal', parseInt(e.target.value) || 1000)}
                      />
                      <span className="text-sm text-muted-foreground">calories/day</span>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="walking-goal">Daily Walking Goal</Label>
                    <div className="flex items-center gap-2 mt-2">
                      <Input
                        id="walking-goal"
                        type="number"
                        step="5"
                        className="w-32"
                        value={formData.walkingGoalMinutes}
                        onChange={(e) => handleInputChange('walkingGoalMinutes', parseInt(e.target.value) || 30)}
                      />
                      <span className="text-sm text-muted-foreground">minutes/day</span>
                    </div>
                  </div>
                </div>

                {isFormValid() && (
                  <Card className="bg-accent/20">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Flame className="h-4 w-4" />
                        Program Preview
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-2 text-sm">
                        <div className="flex justify-between">
                          <span>Weight to lose:</span>
                          <span className="font-medium">
                            {(parseFloat(formData.startWeight) - parseFloat(formData.targetWeight)).toFixed(1)} kg
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Program length:</span>
                          <span className="font-medium">90 days</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Daily deficit target:</span>
                          <span className="font-medium">{formData.dailyDeficitGoal} cal</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Walking goal:</span>
                          <span className="font-medium">{formData.walkingGoalMinutes} min/day</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                  Back
                </Button>
                <Button 
                  onClick={() => setShowStartConfirmation(true)}
                  disabled={!isFormValid()}
                  className="flex-1"
                >
                  Start 90-Day Program
                </Button>
              </div>
            </>
          )}
        </div>
        
        <ConfirmationModal
          isOpen={showStartConfirmation}
          onClose={() => setShowStartConfirmation(false)}
          onConfirm={handleStartProgram}
          title="Start 90-Day Program"
          description={`Are you sure you want to start the 90-day program? 

Starting Weight: ${formData.startWeight} kg
Target Weight: ${formData.targetWeight} kg
Weight to Lose: ${(parseFloat(formData.startWeight) - parseFloat(formData.targetWeight)).toFixed(1)} kg

This will begin tracking your daily progress and you can reset the program at any time if needed.`}
          confirmText="Start Program"
          cancelText="Review Settings"
          isLoading={isStartingJourney}
        />
      </DialogContent>
    </Dialog>
  );
};