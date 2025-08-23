import { useState, useEffect } from 'react';
import { Key, Bell, User, Info, LogOut, Shield, CreditCard, Crown, AlertTriangle, Trash2, Database, Heart, Archive, MessageSquare, Sparkles, Palette, Brain, Wifi } from 'lucide-react';
import { ClickableTooltip } from '@/components/ClickableTooltip';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';  
import { useProfile } from '@/hooks/useProfile';
import { useAccess } from '@/hooks/useAccess';

import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

import { ClearCacheButton } from '@/components/ClearCacheButton';


import { MotivatorAiChatModal } from '@/components/MotivatorAiChatModal';
import { MotivatorsModal } from '@/components/MotivatorsModal';
import { ThemeToggle } from '@/components/ThemeToggle';
import { GlobalProfileOnboarding } from '@/components/GlobalProfileOnboarding';
import { useConnectionStore } from '@/stores/connectionStore';
import { useCacheManager } from '@/hooks/useCacheManager';
// Removed complex validation utilities - using simple localStorage

const Settings = () => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [speechModel, setSpeechModel] = useState('gpt-4o-mini-realtime');
  const [transcriptionModel, setTranscriptionModel] = useState('whisper-1');
  const [ttsModel, setTtsModel] = useState('tts-1');
  const [ttsVoice, setTtsVoice] = useState('alloy');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [age, setAge] = useState('');
  const [sex, setSex] = useState('');
  const [dailyCalorieGoal, setDailyCalorieGoal] = useState('');
  const [dailyCarbGoal, setDailyCarbGoal] = useState('');
  const [activityLevel, setActivityLevel] = useState('sedentary');
  
  const { toast } = useToast();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { isAdmin: accessIsAdmin, originalIsAdmin, hasPremiumFeatures, createSubscription, openCustomerPortal, isTrial, daysRemaining, access_level } = useAccess();
  const isWebPlatform = true; // Default to web for now
  const platformName = 'Stripe'; // Default to Stripe for now
  
  const [showMotivatorsModal, setShowMotivatorsModal] = useState(false);
  const [showAiGeneratorModal, setShowAiGeneratorModal] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const { profile, updateProfile, loading: profileLoading } = useProfile();
  const { isOnline } = useConnectionStore();
  const { clearGoalsCache, clearProfileCache } = useCacheManager();

  useEffect(() => {

    // Admin status now comes from useAccess hook
    setIsAdmin(accessIsAdmin);

    const fetchUserSettings = async () => {
      if (user) {
        try {
          const { data: profileData, error } = await supabase
            .from('profiles')
            .select('speech_model, transcription_model, tts_model, tts_voice, weight, height, age, sex, daily_calorie_goal, daily_carb_goal, activity_level, enable_fasting_slideshow, enable_walking_slideshow')
            .eq('user_id', user.id)
            .maybeSingle() as { data: any; error: any };

        if (error) {
          console.error('Error loading profile settings:', error);
          return;
        }

        if (profileData) {
          // Profile data is now managed by useProfile hook, but we still need to set form fields
          setSpeechModel(profileData.speech_model || 'gpt-4o-mini-realtime');
          setTranscriptionModel(profileData.transcription_model || 'whisper-1');
          setTtsModel(profileData.tts_model || 'tts-1');
          setTtsVoice(profileData.tts_voice || 'alloy');
          setWeight(profileData.weight?.toString() || '');
          setHeight(profileData.height?.toString() || '');
          setAge(profileData.age?.toString() || '');
          setSex(profileData.sex || '');
          setDailyCalorieGoal(profileData.daily_calorie_goal?.toString() || '');
          setDailyCarbGoal(profileData.daily_carb_goal?.toString() || '');
          setActivityLevel(profileData.activity_level || 'sedentary');

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

  const handleSaveSettings = async () => {
    try {
      // Validate required fields (metric only now)
      if (weight && (parseFloat(weight) < 30 || parseFloat(weight) > 300)) {
        toast({
          title: "Invalid Weight",
          description: "Weight must be between 30-300 kg",
          variant: "destructive"
        });
        return;
      }
      if (height && (parseInt(height) < 100 || parseInt(height) > 250)) {
        toast({
          title: "Invalid Height", 
          description: "Height must be between 100-250 cm",
          variant: "destructive"
        });
        return;
      }


      // Save user preferences to database
      if (user) {
        const updateData = {
          speech_model: speechModel,
          transcription_model: transcriptionModel,
          tts_model: ttsModel,
          tts_voice: ttsVoice,
          weight: weight ? parseFloat(weight) : null,
          height: height ? parseInt(height) : null,
          age: age ? parseInt(age) : null,
          sex: (sex as 'male' | 'female') || null,
          daily_calorie_goal: dailyCalorieGoal ? parseInt(dailyCalorieGoal) : null,
          daily_carb_goal: dailyCarbGoal ? parseInt(dailyCarbGoal) : null,
          activity_level: activityLevel
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
          await clearGoalsCache({ showToast: false });
          await clearProfileCache({ showToast: false });
          
          toast({
            title: "Profile Updated",
            description: "Sex updated successfully. Goal recommendations have been refreshed.",
          });
        }
        const error = result?.error;

        // Ensure tier reflects latest settings (own API key overrides others)
        try {
          await supabase.rpc('update_user_tier', { _user_id: user.id });
        } catch (tierErr) {
          console.warn('Tier update RPC failed:', tierErr);
        }

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

  const handleResetAccount = async () => {
    if (!user) return;

    try {
      // Delete all user data but keep the account
      const deleteOperations = [
        supabase.from('chat_conversations').delete().eq('user_id', user.id),
        supabase.from('motivators').delete().eq('user_id', user.id),
        supabase.from('food_entries').delete().eq('user_id', user.id),
        supabase.from('user_foods').delete().eq('user_id', user.id),
        supabase.from('fasting_sessions').delete().eq('user_id', user.id),
        supabase.from('walking_sessions').delete().eq('user_id', user.id),
        supabase.from('manual_calorie_burns').delete().eq('user_id', user.id),
        supabase.from('daily_activity_overrides').delete().eq('user_id', user.id),
        supabase.from('daily_food_templates').delete().eq('user_id', user.id),
        supabase.from('default_food_favorites').delete().eq('user_id', user.id)
      ];

      await Promise.all(deleteOperations);

      // Reset profile data but keep account settings
      await supabase
        .from('profiles')
        .update({
          weight: null,
          height: null,
          age: null,
          daily_calorie_goal: null,
          daily_carb_goal: null,
          goal_weight: null,
          onboarding_completed: false
        })
        .eq('user_id', user.id);

      toast({
        title: "Account Reset Complete",
        description: "All your data has been cleared. You can start fresh!",
      });

      // Navigate to home to start fresh
      navigate('/');
    } catch (error) {
      console.error('Error resetting account:', error);
      toast({
        title: "Error",
        description: "Failed to reset account. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;

    try {
      // Call the delete account edge function
      const { data, error } = await supabase.functions.invoke('delete-account', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) throw error;

      if (data.scheduled) {
        toast({
          title: "Account Deletion Scheduled",
          description: data.message,
        });
      } else {
        toast({
          title: "Account Deleted",
          description: data.message,
        });
        // Sign out and redirect
        await signOut();
        navigate('/auth');
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      toast({
        title: "Error",
        description: "Failed to delete account. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <div className="max-w-md mx-auto pt-10 pb-24">
        <div className="space-y-6">
          <div className="space-y-2">
            {/* Header */}
            <div className="mb-2 mt-4">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent mb-1">
                  Settings
                </h1>
                {(isAdmin || originalIsAdmin) && (
                  <Button size="sm" variant="outline" onClick={() => navigate('/admin')}>
                    Admin Dashboard
                  </Button>
                )}
              </div>
              <p className="text-sm text-muted-foreground text-left">Customize your fasting experience</p>
            </div>
          </div>

            {/* User Profile */}
            <Card className="p-6 bg-card border-ceramic-rim">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <User className="w-5 h-5 text-primary" />
                    <h3 className="text-lg font-semibold text-warm-text">Profile</h3>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowOnboarding(true)}
                    className="w-8 h-8 p-0 rounded-full bg-ceramic-plate/80 backdrop-blur-sm border border-ceramic-rim hover:bg-ceramic-plate hover:scale-110 transition-all duration-200"
                    title="Setup Profile Walkthrough"
                  >
                    <Brain className="w-4 h-4 text-warm-text" />
                  </Button>
                </div>
                
                <div className="space-y-4">
                  
                  {/* Physical Attributes Section */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-warm-text">Physical Attributes</h4>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="weight" className="text-warm-text">Weight (kg)</Label>
                        <Input
                          id="weight"
                          type="number"
                          placeholder="70"
                          value={weight}
                          onChange={(e) => setWeight(e.target.value)}
                          className="bg-ceramic-base border-ceramic-rim"
                          min="30"
                          max="300"
                          step="0.1"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="height" className="text-warm-text">Height (cm)</Label>
                        <Input
                          id="height"
                          type="number"
                          placeholder="175"
                          value={height}
                          onChange={(e) => setHeight(e.target.value)}
                          className="bg-ceramic-base border-ceramic-rim"
                          min="100"
                          max="250"
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
                          className="bg-ceramic-base border-ceramic-rim"
                        />
                      </div>
                    </div>
                    
                    {/* Sex Selection */}
                    <div className="space-y-2">
                      <Label htmlFor="sex" className="text-warm-text">Biological Sex</Label>
                      <Select value={sex} onValueChange={setSex}>
                        <SelectTrigger className="bg-ceramic-base border-ceramic-rim">
                          <SelectValue placeholder="Select sex" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  {/* Daily Goals Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-medium text-warm-text">Daily Goals</h4>
                      <ClickableTooltip content="Set your daily calorie and carb targets. These help track your progress and calculate deficits. Leave blank if you don't want to track these goals.">
                        <Info className="w-4 h-4 text-muted-foreground" />
                      </ClickableTooltip>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="daily-calorie-goal" className="text-warm-text">Calorie Goal</Label>
                        <Input
                          id="daily-calorie-goal"
                          type="number"
                          placeholder="2000"
                          value={dailyCalorieGoal}
                          onChange={(e) => setDailyCalorieGoal(e.target.value)}
                          className="bg-ceramic-base border-ceramic-rim"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="daily-carb-goal" className="text-warm-text">Carb Goal (g)</Label>
                        <Input
                          id="daily-carb-goal"
                          type="number"
                          placeholder="200"
                          value={dailyCarbGoal}
                          onChange={(e) => setDailyCarbGoal(e.target.value)}
                          className="bg-ceramic-base border-ceramic-rim"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Activity Level Section */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="activity-level" className="text-warm-text">Activity Level</Label>
                      <ClickableTooltip content="Affects calorie burn calculations. Most people should choose 'Sedentary' (office work) or 'Lightly Active' (some walking). This is your default setting.">
                        <Info className="w-4 h-4 text-muted-foreground" />
                      </ClickableTooltip>
                    </div>
                    <Select value={activityLevel} onValueChange={setActivityLevel}>
                      <SelectTrigger className="bg-ceramic-base border-ceramic-rim w-full">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                       <SelectContent>
                          <SelectItem value="sedentary">Low</SelectItem>
                          <SelectItem value="moderately_active">Medium</SelectItem>
                          <SelectItem value="very_active">High</SelectItem>
                       </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </Card>

            {/* Save Settings Button - under Profile */}
            <Button onClick={handleSaveSettings} variant="action-primary" size="action-main" className="w-full">
              Save Settings
            </Button>

            {/* Account Section - moved up (2nd priority) */}
            <Card className="p-6 bg-card border-ceramic-rim">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <User className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold text-warm-text">Account</h3>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Email</span>
                    <span className="text-warm-text font-medium">{user?.email}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Login Method</span>
                    <span className="text-warm-text font-medium">
                      {user?.app_metadata?.provider === 'google' ? 'Google' : 'Email'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Account Type</span>
                    <span className="text-warm-text font-medium">
                      {isTrial ? 'Trial User' : 
                       hasPremiumFeatures ? 'Premium User' : 'Free User'}
                    </span>
                  </div>
                  {(isTrial || hasPremiumFeatures) && daysRemaining && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">
                        {isTrial ? 'Trial expires' : 'Premium expires'}
                      </span>
                      <span className="text-warm-text font-medium">
                        {new Date(Date.now() + daysRemaining * 24 * 60 * 60 * 1000).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Member since</span>
                    <span className="text-warm-text font-medium">
                      {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
                    </span>
                  </div>
                </div>
                <div className="pt-3 border-t border-ceramic-rim space-y-3">
                  {access_level === 'free' && (
                    <Button
                      onClick={async () => {
                        try {
                          await createSubscription();
                          toast({ 
                            title: isWebPlatform ? "Redirecting to checkout" : `Use ${platformName} to upgrade`, 
                            description: isWebPlatform ? "Opening payment page..." : `Purchases are managed via ${platformName}.`,
                          });
                        } catch {
                          toast({ title: "Error", description: "Failed to start subscription. Please try again.", variant: "destructive" });
                        }
                      }}
                      className="w-full bg-gradient-to-r from-primary to-primary-glow hover:from-primary-hover hover:to-primary"
                    >
                      <Crown className="w-4 h-4 mr-2" />
                      {isWebPlatform ? 'Upgrade to Premium' : `Upgrade via ${platformName}`}
                    </Button>
                  )}
                  {hasPremiumFeatures && (
                    <Button
                      onClick={async () => {
                        try {
                          await openCustomerPortal();
                          toast({ 
                            title: "Opening customer portal", 
                            description: "Manage your subscription...",
                          });
                        } catch {
                          toast({ title: "Error", description: "Failed to open customer portal. Please try again.", variant: "destructive" });
                        }
                      }}
                      variant="outline"
                      className="w-full bg-ceramic-base border-ceramic-rim justify-start"
                    >
                      Manage Subscription
                    </Button>
                  )}
                  <Button
                    onClick={() => { signOut(); navigate('/auth'); }}
                    variant="outline"
                    className="w-full bg-ceramic-base border-ceramic-rim justify-start hover:bg-red-50 hover:border-red-200 hover:text-red-600"
                  >
                    Sign Out
                  </Button>
                </div>
              </div>
            </Card>

            {/* Appearance Section - moved up (3rd priority) */}
            <Card className="p-6 bg-card border-ceramic-rim">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Palette className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold text-warm-text">Appearance</h3>
                </div>
                <div className="flex justify-center">
                  <ThemeToggle />
                </div>
              </div>
            </Card>



            {/* Account Management - moved down (5th priority) */}
            <Card className="p-6 bg-card border-ceramic-rim border-destructive/20">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                  <h3 className="text-lg font-semibold text-warm-text">Account Management</h3>
                </div>
                
                 <div className="space-y-3">
                   {/* Cache clear */}
                   
                   {/* Clear Cache */}
                   <ClearCacheButton />
                   
                   {/* Reset Account */}
                   <AlertDialog>
                     <AlertDialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="w-full border-orange-500/30 text-orange-600 hover:bg-orange-500/10 justify-start"
                    >
                      Reset Account Data
                    </Button>
                     </AlertDialogTrigger>
                     <AlertDialogContent>
                       <AlertDialogHeader>
                         <AlertDialogTitle>Reset Account Data?</AlertDialogTitle>
                         <AlertDialogDescription>
                           This will permanently delete all your data (food entries, fasting sessions, walking history, motivators, etc.) but keep your account active. You can start fresh with a clean slate.
                         </AlertDialogDescription>
                       </AlertDialogHeader>
                       <AlertDialogFooter>
                         <AlertDialogCancel>Cancel</AlertDialogCancel>
                         <AlertDialogAction
                           onClick={handleResetAccount}
                           className="bg-orange-500 hover:bg-orange-600"
                         >
                           Reset All Data
                         </AlertDialogAction>
                       </AlertDialogFooter>
                     </AlertDialogContent>
                   </AlertDialog>

                   {/* Delete Account */}
                   <AlertDialog>
                     <AlertDialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="w-full border-destructive/30 text-destructive hover:bg-destructive/10 justify-start"
                    >
                      Delete Account
                    </Button>
                     </AlertDialogTrigger>
                     <AlertDialogContent>
                       <AlertDialogHeader>
                         <AlertDialogTitle>Delete Account Permanently?</AlertDialogTitle>
                         <AlertDialogDescription>
                           This will permanently delete your account and all associated data. This action cannot be undone. If you have an active subscription, it will be canceled.
                         </AlertDialogDescription>
                       </AlertDialogHeader>
                       <AlertDialogFooter>
                         <AlertDialogCancel>Cancel</AlertDialogCancel>
                         <AlertDialogAction
                           onClick={handleDeleteAccount}
                           className="bg-destructive hover:bg-destructive/80"
                         >
                           Delete Forever
                         </AlertDialogAction>
                       </AlertDialogFooter>
                     </AlertDialogContent>
                   </AlertDialog>
                </div>
              </div>
            </Card>



            {/* About */}
            <Card className="p-6 bg-card border-ceramic-rim">
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

            {/* Legal */}
            <Card className="p-6 bg-card border-ceramic-rim">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Shield className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold text-warm-text">Legal</h3>
                </div>
                <div className="space-y-4">
                  <a
                    href="https://fastnow.app/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full text-left text-sm text-foreground hover:underline"
                  >
                    <div className="flex items-center">
                      <Shield className="w-4 h-4 mr-2" />
                      Privacy Policy
                    </div>
                  </a>
                  <a
                    href="https://fastnow.app/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full text-left text-sm text-foreground hover:underline"
                  >
                    <div className="flex items-center">
                      <Info className="w-4 h-4 mr-2" />
                      Terms of Service
                    </div>
                  </a>
                </div>
              </div>
            </Card>
        </div>

        {/* Modals */}
          {showMotivatorsModal && (
            <MotivatorsModal onClose={() => setShowMotivatorsModal(false)} />
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
