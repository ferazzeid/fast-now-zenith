import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Info, Calculator, Target } from 'lucide-react';
import { ClickableTooltip } from '@/components/ClickableTooltip';
import { useProfile } from '@/hooks/useProfile';
import { useDailyDeficitQuery } from '@/hooks/optimized/useDailyDeficitQuery';
import { useToast } from '@/hooks/use-toast';

const ACTIVITY_LEVELS = {
  sedentary: { 
    label: 'Low (Sedentary)', 
    multiplier: 1.2, 
    description: 'Little to no exercise, desk job'
  },
  moderately_active: { 
    label: 'Medium (Moderately Active)', 
    multiplier: 1.55, 
    description: 'Light exercise 3-5 days per week'
  },
  very_active: { 
    label: 'High (Very Active)', 
    multiplier: 1.725, 
    description: 'Hard exercise 6-7 days per week'
  },
};

export const MetabolismActivitySection = () => {
  const { profile, updateProfile, loading: profileLoading } = useProfile();
  const { deficitData } = useDailyDeficitQuery();
  const { toast } = useToast();
  
  const [localActivityLevel, setLocalActivityLevel] = useState(profile?.activity_level || 'sedentary');
  const [manualTdeeOverride, setManualTdeeOverride] = useState(profile?.manual_tdee_override?.toString() || '');
  const [saving, setSaving] = useState(false);

  // Calculate BMR and TDEE
  const calculateBMR = () => {
    if (!profile?.weight || !profile?.height || !profile?.age) return 0;
    
    const weightKg = profile.weight;
    const heightCm = profile.height;
    
    // Mifflin-St Jeor equation
    let bmr: number;
    if (profile.sex === 'female') {
      bmr = 10 * weightKg + 6.25 * heightCm - 5 * profile.age - 161;
    } else {
      bmr = 10 * weightKg + 6.25 * heightCm - 5 * profile.age + 5;
    }
    return Math.round(bmr);
  };

  const calculateTDEE = (activityLevel: string, bmr: number) => {
    const multiplier = ACTIVITY_LEVELS[activityLevel as keyof typeof ACTIVITY_LEVELS]?.multiplier || 1.2;
    return Math.round(bmr * multiplier);
  };

  const bmr = calculateBMR();
  const calculatedTdee = calculateTDEE(localActivityLevel, bmr);
  const currentTdee = profile?.manual_tdee_override || calculatedTdee;

  const getCalorieAddition = (level: string) => {
    const multiplier = ACTIVITY_LEVELS[level as keyof typeof ACTIVITY_LEVELS]?.multiplier || 1.2;
    return Math.round(bmr * (multiplier - 1.2));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates: any = {
        activity_level: localActivityLevel,
      };

      // Only set manual override if user has entered a value and it's different from calculated
      if (manualTdeeOverride && parseInt(manualTdeeOverride) !== calculatedTdee) {
        updates.manual_tdee_override = parseInt(manualTdeeOverride);
      } else {
        updates.manual_tdee_override = null;
      }

      await updateProfile(updates);
      toast({
        title: "Metabolism Settings Updated",
        description: "Your activity level and TDEE settings have been saved.",
      });
    } catch (error) {
      console.error('Error updating metabolism settings:', error);
      toast({
        title: "Update Failed",
        description: "There was an error updating your settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = () => {
    const currentOverride = profile?.manual_tdee_override?.toString() || '';
    return localActivityLevel !== (profile?.activity_level || 'sedentary') || 
           manualTdeeOverride !== currentOverride;
  };

  if (!profile?.weight || !profile?.height || !profile?.age) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            Metabolism & Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Complete your basic profile information (weight, height, age) to see metabolism calculations.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Calculator className="w-5 h-5" />
          Metabolism & Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* BMR Display */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">Basal Metabolic Rate (BMR)</Label>
            <ClickableTooltip content="Your body's minimum daily calorie needs for basic functions like breathing, circulation, and cell production.">
              <Info className="w-4 h-4 text-muted-foreground" />
            </ClickableTooltip>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold">{bmr} cal/day</span>
            <Badge variant="outline" className="text-xs">Base Rate</Badge>
          </div>
        </div>

        {/* Activity Level */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">Activity Level</Label>
            <ClickableTooltip content="Your daily activity level affects how many calories you burn above your BMR.">
              <Info className="w-4 h-4 text-muted-foreground" />
            </ClickableTooltip>
          </div>
          
          <Select value={localActivityLevel} onValueChange={setLocalActivityLevel}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(ACTIVITY_LEVELS).map(([key, data]) => (
                <SelectItem key={key} value={key}>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span>{data.label}</span>
                      {getCalorieAddition(key) > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          +{getCalorieAddition(key)} cal
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">{data.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* TDEE Display */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">Total Daily Energy Expenditure (TDEE)</Label>
            <ClickableTooltip content="Your total daily calorie burn including BMR and activity. This is used as your 'Base Daily Burn' in deficit calculations.">
              <Info className="w-4 h-4 text-muted-foreground" />
            </ClickableTooltip>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <div className="text-sm text-muted-foreground">Calculated TDEE</div>
                <div className="text-lg font-bold">{calculatedTdee} cal/day</div>
              </div>
              <Target className="w-5 h-5 text-muted-foreground" />
              <div className="flex-1">
                <div className="text-sm text-muted-foreground">Current TDEE</div>
                <div className="text-lg font-bold text-primary">{currentTdee} cal/day</div>
                {profile?.manual_tdee_override && (
                  <Badge variant="outline" className="text-xs mt-1">Manual Override</Badge>
                )}
              </div>
            </div>

            {/* Manual Override */}
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Manual TDEE Override (optional)</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder={calculatedTdee.toString()}
                  value={manualTdeeOverride}
                  onChange={(e) => setManualTdeeOverride(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setManualTdeeOverride('')}
                  disabled={!manualTdeeOverride}
                >
                  Clear
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Leave empty to use calculated value. Override if you know your actual TDEE from metabolic testing.
              </p>
            </div>
          </div>
        </div>

        {/* Save Button */}
        {hasChanges() && (
          <Button 
            onClick={handleSave} 
            disabled={saving || profileLoading}
            className="w-full"
          >
            {saving ? 'Saving...' : 'Save Metabolism Settings'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};