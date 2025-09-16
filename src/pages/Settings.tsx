import { useState, useEffect } from 'react';
import { Key, Bell, User, Info, Brain, Wifi, Crown, Settings as SettingsIcon, LogOut, Trash2, RotateCcw, Navigation2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { ClickableTooltip } from '@/components/ClickableTooltip';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';  
import { useProfile } from '@/hooks/useProfile';
import { useAccess } from '@/hooks/useAccess';
import { SubscriptionStatus } from '@/components/SubscriptionStatus';
import { NavigationPreferences } from '@/components/NavigationPreferences';

import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';


import { CalorieGoalWarning } from '@/components/CalorieGoalWarning';
import { UserColorPicker } from '@/components/UserColorPicker';

import { MotivatorAiChatModal } from '@/components/MotivatorAiChatModal';
import { MotivatorsModal } from '@/components/MotivatorsModal';
import { ThemeToggle } from '@/components/ThemeToggle';
import { GlobalProfileOnboarding } from '@/components/GlobalProfileOnboarding';
import { useConnectionStore } from '@/stores/connectionStore';
import { useUnifiedCacheManager } from '@/hooks/useUnifiedCacheManager';
// Removed complex validation utilities - using simple localStorage

const Settings = () => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [age, setAge] = useState('');
  const [sex, setSex] = useState('');
  const [targetDeficit, setTargetDeficit] = useState('1000');
  const [dailyCalorieGoal, setDailyCalorieGoal] = useState('');
  const [dailyCarbGoal, setDailyCarbGoal] = useState('');
  const [activityLevel, setActivityLevel] = useState('sedentary');
  const [manualTdeeOverride, setManualTdeeOverride] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#3b82f6');
  
  const { toast } = useToast();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAdmin: accessIsAdmin, ...access } = useAccess();
  const isWebPlatform = true; // Default to web for now
  const platformName = 'Stripe'; // Default to Stripe for now
  
  const [showMotivatorsModal, setShowMotivatorsModal] = useState(false);
  const [showAiGeneratorModal, setShowAiGeneratorModal] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const { profile, updateProfile, loading: profileLoading } = useProfile();
  const { isOnline } = useConnectionStore();
  const { clearGoalsCache, clearProfileCache } = useUnifiedCacheManager();

  useEffect(() => {

    // Admin status now comes from useAccess hook
    setIsAdmin(accessIsAdmin);

    const fetchUserSettings = async () => {
      if (user) {
        try {
          const { data: profileData, error } = await supabase
            .from('profiles')
            .select('weight, height, age, sex, daily_calorie_goal, daily_carb_goal, activity_level, manual_tdee_override, target_deficit, enable_fasting_slideshow, enable_walking_slideshow, primary_color')
            .eq('user_id', user.id)
            .maybeSingle() as { data: any; error: any };

        if (error) {
          console.error('Error loading profile settings:', error);
          return;
        }

        if (profileData) {
          // Profile data is now managed by useProfile hook, but we still need to set form fields
          setWeight(profileData.weight?.toString() || '');
          setHeight(profileData.height?.toString() || '');
          setAge(profileData.age?.toString() || '');
          setSex(profileData.sex || '');
          setTargetDeficit(profileData.target_deficit?.toString() || '1000');
          setDailyCalorieGoal(profileData.daily_calorie_goal?.toString() || '');
          setDailyCarbGoal(profileData.daily_carb_goal?.toString() || '');
          setActivityLevel(profileData.activity_level || 'lightly_active');
          setManualTdeeOverride(profileData.manual_tdee_override?.toString() || '');
          setPrimaryColor(profileData.primary_color || '#3b82f6');

          // Check if profile is incomplete and show onboarding
          const isIncomplete = !profileData.weight || !profileData.height || !profileData.age || 
            (!profileData.activity_level && !profileData['activity-level']);
          console.log('Profile incompleteness check:', { 
            weight: profileData.weight, 
            height: profileData.height, 
            age: profileData.age, 
            activity_level: profileData.activity_level,
            isIncomplete 
          });
          if (isIncomplete) {
            setShowOnboarding(true);
          }
        } else {
          // No profile data exists, show onboarding
          setShowOnboarding(true);
        }
        } catch (error) {
          console.error('Error fetching user settings:', error);
        }
      }
    };

    fetchUserSettings();
  }, [user, accessIsAdmin]);

  // BMR calculation function with proper unit conversion
  const calculateBMR = () => {
    if (!weight || !height || !age || !sex) return 0;
    
    // Convert to metric for calculation if needed
    let weightKg: number;
    let heightCm: number;
    
    if (profile?.units === 'metric') {
      weightKg = parseFloat(weight);
      heightCm = parseInt(height);
    } else {
      // Imperial: convert pounds to kg, inches to cm
      weightKg = parseFloat(weight) * 0.453592;
      heightCm = parseInt(height) * 2.54;
    }
    
    const ageNum = parseInt(age);
    
    // Mifflin-St Jeor equation
    let bmr: number;
    if (sex === 'female') {
      bmr = 10 * weightKg + 6.25 * heightCm - 5 * ageNum - 161;
    } else {
      bmr = 10 * weightKg + 6.25 * heightCm - 5 * ageNum + 5;
    }
    return Math.round(bmr);
  };

  // Calculate TDEE using proper multipliers (matches InlineActivitySelector)
  const getCalorieAddition = (level: string) => {
    const bmr = calculateBMR();
    const multipliers = {
      sedentary: 1.2,          // Little/no exercise
      lightly_active: 1.375,   // Light exercise 1-3 days/week
      moderately_active: 1.55, // Moderate exercise 3-5 days/week
      very_active: 1.725       // Hard exercise 6-7 days/week
    };
    
    const sedentaryTdee = bmr * 1.2;
    const levelTdee = bmr * (multipliers[level as keyof typeof multipliers] || 1.2);
    
    // Show additional calories above sedentary level
    return Math.round(levelTdee - sedentaryTdee);
  };

  // Calculate TDEE for dynamic goal calculation
  const calculateTDEE = () => {
    if (manualTdeeOverride && parseFloat(manualTdeeOverride) > 0) {
      return parseFloat(manualTdeeOverride);
    }
    
    const bmr = calculateBMR();
    if (bmr === 0) return 0;
    
    const multipliers = {
      sedentary: 1.2,
      lightly_active: 1.375,
      moderately_active: 1.55,
      very_active: 1.725
    };
    
    return Math.round(bmr * (multipliers[activityLevel as keyof typeof multipliers] || 1.375));
  };

  // Calculate dynamic calorie goal based on TDEE and target deficit (no safety floor manipulation)
  const calculateDynamicCalorieGoal = () => {
    const tdee = calculateTDEE();
    const deficit = parseFloat(targetDeficit) || 1000;
    
    if (tdee === 0) return 0;
    
    const calorieGoal = tdee - deficit;
    return Math.round(calorieGoal);
  };

  // Check if calorie goal is below recommended minimums
  const isLowCalorieGoal = () => {
    const goal = calculateDynamicCalorieGoal();
    const safetyFloor = sex === 'male' ? 1500 : sex === 'female' ? 1200 : 1200;
    return goal > 0 && goal < safetyFloor;
  };

  // Auto-calculate goals when inputs change (for preview only)
  const getCalculatedGoals = () => {
    const calculatedCalorieGoal = calculateDynamicCalorieGoal();
    const calculatedCarbGoal = 30; // Fixed carb goal
    return { calculatedCalorieGoal, calculatedCarbGoal };
  };

  const handleSaveSettings = async () => {
    try {
      // Validate required fields - now supports both metric and imperial
      if (weight) {
        const weightNum = parseFloat(weight);
        if (profile?.units === 'metric') {
          if (weightNum < 30 || weightNum > 300) {
            toast({
              title: "Invalid Weight",
              description: "Weight must be between 30-300 kg",
              variant: "destructive"
            });
            return;
          }
        } else {
          if (weightNum < 66 || weightNum > 660) {
            toast({
              title: "Invalid Weight", 
              description: "Weight must be between 66-660 lbs",
              variant: "destructive"
            });
            return;
          }
        }
      }
      
      if (height) {
        const heightNum = parseInt(height);
        if (profile?.units === 'metric') {
          if (heightNum < 100 || heightNum > 250) {
            toast({
              title: "Invalid Height",
              description: "Height must be between 100-250 cm", 
              variant: "destructive"
            });
            return;
          }
        } else {
          if (heightNum < 39 || heightNum > 98) {
            toast({
              title: "Invalid Height",
              description: "Height must be between 39-98 inches",
              variant: "destructive"
            });
            return;
          }
        }
      }


        // Save user preferences to database with auto-calculated goals
        if (user) {
          const { calculatedCalorieGoal, calculatedCarbGoal } = getCalculatedGoals();
          
          const updateData = {
            weight: weight ? parseFloat(weight) : null,
            height: height ? parseInt(height) : null,
            age: age ? parseInt(age) : null,
            sex: (sex as 'male' | 'female') || null,
            daily_calorie_goal: calculatedCalorieGoal || (dailyCalorieGoal ? parseInt(dailyCalorieGoal) : null),
            daily_carb_goal: calculatedCarbGoal || (dailyCarbGoal ? parseInt(dailyCarbGoal) : null),
            activity_level: activityLevel,
            manual_tdee_override: manualTdeeOverride ? parseInt(manualTdeeOverride) : null,
            target_deficit: targetDeficit ? parseInt(targetDeficit) : 1000,
            primary_color: primaryColor
          };
        
        console.log('Settings: User ID:', user?.id);
        console.log('Settings: Saving profile data:', updateData);
        
        // Use the useProfile hook's updateProfile method instead of direct Supabase call
        const result = await updateProfile(updateData);
        
        if (result?.error) {
          console.error('Settings save error:', result.error);
          toast({
            title: "Database Error",
            description: `Failed to save: ${result.error.message}`,
            variant: "destructive"
          });
          return;
        }
        
        const data = result?.data;

        // If sex changed, clear relevant caches without page reload
        if (data && updateData.sex && updateData.sex !== profile?.sex) {
          console.log('🔄 Sex changed - clearing goal and profile caches');
          clearGoalsCache();
          clearProfileCache();
          
          toast({
            title: "Profile Updated",
            description: "Sex updated successfully. Goal recommendations have been refreshed.",
          });
        }
        const error = result?.error;

        console.log('Settings saved successfully');
        toast({
          title: "✅ Settings Saved!",
          description: "Your settings have been updated successfully.",
        });
      }
    } catch (error: any) {
      console.error('Settings save error:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to save settings. Please try again.",
        variant: "destructive"
      });
    }
  };


  const handleClearWalkingHistory = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('walking_sessions')
        .update({ deleted_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .is('deleted_at', null);

      if (error) throw error;

      toast({
        title: "Walking History Cleared",
        description: "All walking sessions have been removed from your history.",
      });
    } catch (error) {
      console.error('Error clearing walking history:', error);
      toast({
        title: "Error",
        description: "Failed to clear walking history. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSignOut = async () => {
    try {
      // Use the auth hook's signOut method which handles cache clearing and proper error handling
      await signOut();
      navigate('/auth');
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleResetData = async () => {
    if (!user) return;
    
    const confirmed = window.confirm(
      "Are you sure you want to reset all your data? This will clear all your fasting sessions, food entries, walking sessions, and goals. This action cannot be undone."
    );
    
    if (!confirmed) return;

    try {
      // Clear all user data
      await Promise.all([
        supabase.from('fasting_sessions').delete().eq('user_id', user.id),
        supabase.from('food_entries').delete().eq('user_id', user.id),
        supabase.from('walking_sessions').delete().eq('user_id', user.id),
        supabase.from('motivators').delete().eq('user_id', user.id),
        supabase.from('chat_conversations').delete().eq('user_id', user.id)
      ]);

      // Clear React Query cache to ensure UI updates immediately
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['food-entries'] }),
        queryClient.invalidateQueries({ queryKey: ['daily-totals'] }),
        queryClient.invalidateQueries({ queryKey: ['daily-deficit-stable'] }),
        queryClient.invalidateQueries({ queryKey: ['walking-sessions'] }),
        queryClient.invalidateQueries({ queryKey: ['fasting-sessions'] }),
        queryClient.invalidateQueries({ queryKey: ['motivators'] }),
        queryClient.invalidateQueries({ queryKey: ['goals'] }),
        queryClient.invalidateQueries({ queryKey: ['chat_conversations'] })
      ]);

      // Also remove cached data entirely for immediate effect
      queryClient.removeQueries({ queryKey: ['food-entries'] });
      queryClient.removeQueries({ queryKey: ['daily-totals'] });
      queryClient.removeQueries({ queryKey: ['daily-deficit-stable'] });

      toast({
        title: "Data Reset Complete",
        description: "All your data has been cleared successfully.",
      });
    } catch (error) {
      console.error('Error resetting data:', error);
      toast({
        title: "Error",
        description: "Failed to reset data. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    
    const confirmed = window.confirm(
      "Are you sure you want to delete your account? This will permanently delete all your data and cannot be undone. You will be logged out immediately."
    );
    
    if (!confirmed) return;

    try {
      const { error } = await supabase.functions.invoke('delete-account');
      
      if (error) throw error;

      toast({
        title: "Account Deleted",
        description: "Your account has been successfully deleted.",
      });
      
      // Sign out after deletion
      await supabase.auth.signOut();
      navigate('/auth');
    } catch (error) {
      console.error('Error deleting account:', error);
      toast({
        title: "Error",
        description: "Failed to delete account. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <div className="max-w-md mx-auto pt-10 pb-40 safe-bottom">
        <div className="space-y-6">
          <div className="space-y-2">
            {/* Header */}
            <div className="mb-2 mt-4">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-foreground mb-1">
                  Settings
                </h1>
                {(accessIsAdmin) && (
                  <Button size="sm" variant="secondary" onClick={() => navigate('/admin')} className="border border-muted-foreground/20">
                    Admin Dashboard
                  </Button>
                )}
              </div>
              <p className="text-sm text-muted-foreground text-left">Customize your fasting experience</p>
            </div>
          </div>

            {/* User Profile */}
            <Card className="p-6 bg-card">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <User className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-semibold text-warm-text">Profile</h3>
                  </div>
                  {accessIsAdmin && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowOnboarding(true)}
                      className="w-8 h-8 p-0 rounded-full bg-ceramic-plate/80 backdrop-blur-sm hover:bg-ceramic-plate hover:scale-110 transition-all duration-200"
                      title="Setup Profile Walkthrough"
                    >
                      <Brain className="w-4 h-4 text-warm-text" />
                    </Button>
                  )}
                </div>
                
                <div className="space-y-8">
                  
                  {/* Measurement System Selection - Top */}
                  <div className="space-y-4 mt-6">
                    <div className="flex items-center gap-2">
                      <Label className="text-warm-text">Measurement System</Label>
                      <ClickableTooltip content="Choose how distances, speeds, and weights are displayed throughout the app">
                        <Info className="w-4 h-4 text-muted-foreground" />
                      </ClickableTooltip>
                    </div>
                    <Select 
                      value={profile?.units || 'imperial'} 
                      onValueChange={async (value: 'metric' | 'imperial') => {
                        await updateProfile({ units: value });
                        toast({
                          title: "Units Updated",
                          description: `Switched to ${value === 'metric' ? 'metric (km, km/h, kg)' : 'imperial (miles, mph, lbs)'} system`,
                        });
                      }}
                    >
                      <SelectTrigger className="bg-ceramic-base">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover z-50">
                        <SelectItem value="imperial">Imperial</SelectItem>
                        <SelectItem value="metric">Metric</SelectItem>
                      </SelectContent>
                    </Select>
                    <Card className="text-xs text-muted-foreground bg-ceramic-plate/30 p-2">
                      <div className="space-y-1">
                        <div><strong>Imperial:</strong> miles, mph, lbs</div>
                        <div><strong>Metric:</strong> kilometers, km/h, kg</div>
                      </div>
                    </Card>
                  </div>
                  
                  {/* Physical Attributes Section */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-warm-text">Physical Attributes</h4>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="weight" className="text-warm-text">
                          Weight ({profile?.units === 'metric' ? 'kg' : 'lbs'})
                        </Label>
                        <Input
                          id="weight"
                          type="number"
                          placeholder={profile?.units === 'metric' ? '70' : '154'}
                          value={weight}
                          onChange={(e) => setWeight(e.target.value)}
                          className="bg-ceramic-base"
                          min={profile?.units === 'metric' ? '30' : '66'}
                          max={profile?.units === 'metric' ? '300' : '660'}
                          step="0.1"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="height" className="text-warm-text">
                          Height ({profile?.units === 'metric' ? 'cm' : 'in'})
                        </Label>
                        <Input
                          id="height"
                          type="number"
                          placeholder={profile?.units === 'metric' ? '175' : '69'}
                          value={height}
                          onChange={(e) => setHeight(e.target.value)}
                          className="bg-ceramic-base"
                          min={profile?.units === 'metric' ? '100' : '39'}
                          max={profile?.units === 'metric' ? '250' : '98'}
                          step="1"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="age" className="text-warm-text">Age</Label>
                        <Input
                          id="age"
                          type="number"
                          placeholder="30"
                          value={age}
                          onChange={(e) => setAge(e.target.value)}
                          className="bg-ceramic-base"
                        />
                      </div>
                    </div>
                    
                    {/* Sex Selection */}
                    <div className="space-y-2">
                      <Label htmlFor="sex" className="text-warm-text">Biological Sex</Label>
                      <Select value={sex} onValueChange={setSex}>
                        <SelectTrigger className="bg-ceramic-base">
                          <SelectValue placeholder="Select sex" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  {/* Activity Level Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="activity-level" className="text-warm-text">Activity Level</Label>
                      <ClickableTooltip content="Affects calorie burn calculations. Most people should choose 'Lightly Active' (recommended default for daily activities) or 'Sedentary' (office work only). Choose based on your typical weekly activity level.">
                        <Info className="w-4 h-4 text-muted-foreground" />
                      </ClickableTooltip>
                    </div>
                     <Select value={activityLevel} onValueChange={setActivityLevel}>
                       <SelectTrigger className="bg-ceramic-base w-full">
                         <SelectValue placeholder="Select" />
                       </SelectTrigger>
                         <SelectContent>
                            <SelectItem value="sedentary">Sedentary {getCalorieAddition('sedentary') > 0 ? `(+${getCalorieAddition('sedentary')} cal)` : ''}</SelectItem>
                            <SelectItem value="lightly_active">Lightly Active (+{getCalorieAddition('lightly_active')} cal)</SelectItem>
                            <SelectItem value="moderately_active">Moderately Active (+{getCalorieAddition('moderately_active')} cal)</SelectItem>
                            <SelectItem value="very_active">Very Active (+{getCalorieAddition('very_active')} cal)</SelectItem>
                         </SelectContent>
                     </Select>
                   </div>
                  
                  {/* Dynamic Goals Section */}
                  <div className="space-y-4">
                     <div className="flex items-center gap-2">
                       <h4 className="text-sm font-medium text-warm-text">Dynamic Goals</h4>
                       <ClickableTooltip content="Goals are calculated automatically when you save. Calorie goal = TDEE - deficit. Carb goal is fixed at 30g.">
                         <Info className="w-4 h-4 text-muted-foreground" />
                       </ClickableTooltip>
                     </div>
                    
                    {/* Target Deficit Input */}
                    <div className="space-y-2">
                      <Label htmlFor="target-deficit" className="text-warm-text">Target Deficit (cal/day)</Label>
                      <Input
                        id="target-deficit"
                        type="number"
                        placeholder="1000"
                        value={targetDeficit}
                        onChange={(e) => setTargetDeficit(e.target.value)}
                        className="bg-ceramic-base"
                        min="0"
                        max="2000"
                        step="50"
                      />
                    </div>

                      {/* Calculated Goals Display */}
                      <Card className="bg-ceramic-plate/30 p-3 space-y-3">
                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Calculated Goals</div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <div className="text-xs text-muted-foreground">Calorie Goal</div>
                            <div className="text-lg font-semibold text-warm-text">
                              {calculateDynamicCalorieGoal() > 0 ? `${calculateDynamicCalorieGoal()} cal` : '— cal'}
                            </div>
                            {calculateDynamicCalorieGoal() > 0 && calculateTDEE() > 0 && (
                              <div className="text-xs text-muted-foreground">
                                TDEE {calculateTDEE()} - {targetDeficit}
                              </div>
                            )}
                          </div>
                          
                          <div className="space-y-1">
                            <div className="text-xs text-muted-foreground">Carb Goal</div>
                            <div className="text-lg font-semibold text-warm-text">30g</div>
                            <div className="text-xs text-muted-foreground">Fixed</div>
                          </div>
                        </div>
                        
                        {/* Calorie Warning */}
                        {calculateDynamicCalorieGoal() > 0 && isLowCalorieGoal() && (
                          <CalorieGoalWarning 
                            calorieGoal={calculateDynamicCalorieGoal()} 
                            sex={sex} 
                          />
                        )}
                      </Card>
                  </div>
                   
                   {/* Manual TDEE Override - Bottom with Separator */}
                   {calculateBMR() > 0 && (
                     <div className="space-y-4 pt-6">
                       <Separator className="bg-ceramic-rim" />
                       <div className="space-y-4">
                         <div className="flex items-center gap-2">
                           <Label htmlFor="manual-tdee" className="text-warm-text">Manual Daily Burn Override</Label>
                           <ClickableTooltip content="Override the calculated daily burn if you know your actual TDEE from metabolic testing.">
                             <Info className="w-4 h-4 text-muted-foreground" />
                           </ClickableTooltip>
                         </div>
                         <div className="flex gap-2">
                           <Input
                             id="manual-tdee"
                             type="number"
                             placeholder={`${Math.round(calculateBMR() * (1.2 + (getCalorieAddition(activityLevel) / calculateBMR())))} (calculated)`}
                             value={manualTdeeOverride}
                             onChange={(e) => setManualTdeeOverride(e.target.value)}
                             className="bg-ceramic-base flex-1"
                           />
                           {manualTdeeOverride && (
                             <Button
                               variant="outline"
                               size="sm"
                               onClick={() => setManualTdeeOverride('')}
                               className="bg-ceramic-base"
                             >
                               Clear
                             </Button>
                           )}
                         </div>
                       </div>
                     </div>
                    )}
                    
                  </div>
                </div>
              </Card>

            {/* Appearance Section */}
            <Card className="p-6 bg-card">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Brain className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold text-warm-text">Appearance</h3>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-warm-text">Theme</div>
                  <ThemeToggle />
                </div>
                
                <UserColorPicker 
                  value={primaryColor}
                  onChange={setPrimaryColor}
                  disabled={profileLoading}
                />
              </div>
            </Card>

            {/* Save Settings Button - under Profile */}
            <Button onClick={handleSaveSettings} variant="action-primary" size="action-main" className="w-full">
              Save Settings
            </Button>

          {/* Account Information */}
          <Card className="p-6 bg-card">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Key className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold text-warm-text">Account</h3>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Email</span>
                  <span className="text-sm font-medium">{user?.email}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Member Since</span>
                  <span className="text-sm font-medium">
                    {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <div className="flex gap-2">
                    {accessIsAdmin && (
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 rounded-full">
                        Admin
                      </span>
                    )}
                    {!accessIsAdmin && access.hasPremiumFeatures && (
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full">
                        Premium
                      </span>
                    )}
                    {access.isTrial && (
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full">
                        Trial ({access.daysRemaining}d)
                      </span>
                    )}
                    {!accessIsAdmin && !access.hasPremiumFeatures && !access.isTrial && (
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200 rounded-full">
                        Free
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="pt-2 space-y-2">
                  <Button 
                    onClick={() => navigate('/account')}
                    variant="secondary" 
                    className="w-full border border-muted-foreground/20"
                  >
                    Manage Account
                  </Button>
                  
                  <Button 
                    onClick={handleSignOut}
                    variant="default"
                    className="w-full"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </Button>
                </div>
              </div>
            </div>
          </Card>

            {/* Navigation Section */}
            <Card className="p-6 bg-card">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Navigation2 className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold text-warm-text">Navigation</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Customize which navigation buttons appear at the bottom of the screen. At least one button must remain active.
                </p>
                <NavigationPreferences />
              </div>
            </Card>


            {/* About */}
            <Card className="p-6 bg-card">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Info className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold text-warm-text">About</h3>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Version</span>
                    <span className="text-warm-text font-medium">1.0.0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Build</span>
                    <span className="text-warm-text font-medium">Beta</span>
                  </div>
                </div>
              </div>
            </Card>
        </div>

        {/* Modals */}
          {showMotivatorsModal && (
            <MotivatorsModal 
              isOpen={showMotivatorsModal}
              onClose={() => setShowMotivatorsModal(false)} 
            />
          )}
          
          {showAiGeneratorModal && (
            <MotivatorAiChatModal onClose={() => setShowAiGeneratorModal(false)} />
          )}

        {/* Profile Onboarding Modal */}
        <GlobalProfileOnboarding
          isOpen={showOnboarding}
          onClose={() => setShowOnboarding(false)}
        />
      </div>
      
      
    </div>
  );
};

export default Settings;
