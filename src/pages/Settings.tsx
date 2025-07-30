import { useState, useEffect } from 'react';
import { User, Info, LogOut, Shield, CreditCard, Crown, AlertTriangle, Trash2, Heart, Sparkles, Palette } from 'lucide-react';
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
import { useSubscription } from '@/hooks/useSubscription';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { ClearCacheButton } from '@/components/ClearCacheButton';
import { UnitsSelector } from '@/components/UnitsSelector';
import { useArchivedConversations } from '@/hooks/useArchivedConversations';
import { MotivatorsModal } from '@/components/MotivatorsModal';

import { ThemeToggle } from '@/components/ThemeToggle';
// Removed complex validation utilities - using simple localStorage

const Settings = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [age, setAge] = useState('');
  const [dailyCalorieGoal, setDailyCalorieGoal] = useState('');
  const [dailyCarbGoal, setDailyCarbGoal] = useState('');
  const [activityLevel, setActivityLevel] = useState('sedentary');
  const [units, setUnits] = useState<'metric' | 'imperial'>('imperial');
  const { toast } = useToast();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const subscription = useSubscription();
  const { archivedConversations, loading: archiveLoading, restoreConversation, deleteArchivedConversation } = useArchivedConversations();
  const [showMotivatorsModal, setShowMotivatorsModal] = useState(false);

  useEffect(() => {
    const checkAdminRole = async () => {
      if (user) {
        const { data } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .single();
        setIsAdmin(!!data);
      }
    };

    const fetchUserSettings = async () => {
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('weight, height, age, daily_calorie_goal, daily_carb_goal, activity_level, units')
          .eq('user_id', user.id)
          .single();

        if (profile) {
          setWeight(profile.weight?.toString() || '');
          setHeight(profile.height?.toString() || '');
          setAge(profile.age?.toString() || '');
          setDailyCalorieGoal(profile.daily_calorie_goal?.toString() || '');
          setDailyCarbGoal(profile.daily_carb_goal?.toString() || '');
          setActivityLevel(profile.activity_level || 'sedentary');
          setUnits((profile.units as 'metric' | 'imperial') || 'imperial');
        }
      }
    };

    checkAdminRole();
    fetchUserSettings();
  }, [user]);

  const handleSaveSettings = async () => {
    try {
      // Save user preferences to database
      if (user) {
        const updateData = {
          weight: weight ? parseFloat(weight) : null,
          height: height ? parseInt(height) : null,
          age: age ? parseInt(age) : null,
          daily_calorie_goal: dailyCalorieGoal ? parseInt(dailyCalorieGoal) : null,
          daily_carb_goal: dailyCarbGoal ? parseInt(dailyCarbGoal) : null,
          activity_level: activityLevel,
          units: units
        };
        
        const { data, error } = await supabase
          .from('profiles')
          .update(updateData)
          .eq('user_id', user.id);

        if (error) {
          console.error('Settings save error:', error);
          throw error;
        }

        console.log('Settings saved successfully');
        toast({
          title: "✅ Settings Saved!",
          description: "Profile settings have been updated successfully",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings",
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

  return (
    <div className="min-h-screen bg-ceramic-base safe-top safe-bottom">
      <ScrollArea className="h-screen">
        <div className="px-4 pt-8 pb-24">
          <div className="max-w-md mx-auto space-y-6 bg-ceramic-base">
            {/* Header */}
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold text-warm-text">Settings</h1>
              <p className="text-muted-foreground">Customize your fasting experience</p>
            </div>

            {/* Theme Toggle Section */}
            <Card className="p-6 bg-ceramic-plate border-ceramic-rim">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Palette className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold text-warm-text">Appearance</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-warm-text">Theme</p>
                      <p className="text-xs text-muted-foreground">Choose your preferred color scheme</p>
                    </div>
                    <ThemeToggle />
                  </div>
                </div>
              </div>
            </Card>

            {/* Account Section */}
            <Card className="p-6 bg-ceramic-plate border-ceramic-rim">
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
                    <span className="text-muted-foreground">Member since</span>
                    <span className="text-warm-text font-medium">
                      {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
                    </span>
                  </div>
                </div>
                
                <div className="pt-3 border-t border-ceramic-rim">
                  <Button
                    onClick={() => {
                      signOut();
                      navigate('/auth');
                    }}
                    variant="outline"
                    className="w-full bg-ceramic-base border-ceramic-rim hover:bg-red-50 hover:border-red-200 hover:text-red-600"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </Button>
                </div>
              </div>
            </Card>

            {/* Motivators */}
            <Card className="p-6 bg-ceramic-plate border-ceramic-rim">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Heart className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold text-warm-text">Motivators</h3>
                </div>
                <div className="space-y-4">
                  <Button
                    onClick={() => setShowMotivatorsModal(true)}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    <Heart className="w-4 h-4 mr-2" />
                    Manage Motivators
                  </Button>
                  <p className="text-sm text-muted-foreground">
                    Create, edit, and organize your personal motivational content, images, and quotes to inspire your fasting journey.
                  </p>
                </div>
              </div>
            </Card>

            {/* User Profile & Goals */}
            <Card className="p-6 bg-ceramic-plate border-ceramic-rim">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <User className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold text-warm-text">Profile & Goals</h3>
                </div>
                
                <div className="space-y-4">
                  <UnitsSelector
                    selectedUnits={units}
                    onUnitsChange={setUnits}
                  />
                  
                  {/* Physical Attributes Section */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-warm-text">Physical Attributes</h4>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="weight" className="text-warm-text">Weight ({units === 'metric' ? 'kg' : 'lbs'})</Label>
                        <Input
                          id="weight"
                          type="number"
                          placeholder={units === 'metric' ? '70' : '154'}
                          value={weight}
                          onChange={(e) => setWeight(e.target.value)}
                          className="bg-ceramic-base border-ceramic-rim"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="height" className="text-warm-text">Height ({units === 'metric' ? 'cm' : 'in'})</Label>
                        <Input
                          id="height"
                          type="number"
                          placeholder={units === 'metric' ? '175' : '69'}
                          value={height}
                          onChange={(e) => setHeight(e.target.value)}
                          className="bg-ceramic-base border-ceramic-rim"
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
                  </div>
                  
                  {/* Activity Level Section */}
                  <div className="space-y-4 pt-6 border-t border-ceramic-rim/50">
                    <h4 className="text-sm font-medium text-warm-text">Activity Level</h4>
                    <div className="space-y-2">
                      <Select value={activityLevel} onValueChange={setActivityLevel}>
                        <SelectTrigger className="bg-ceramic-base border-ceramic-rim">
                          <SelectValue placeholder="Select your activity level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sedentary" className="text-left">
                            <div className="flex flex-col items-start">
                              <span className="font-medium">Sedentary</span>
                              <span className="text-xs text-muted-foreground">Little to no exercise</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="lightly_active" className="text-left">
                            <div className="flex flex-col items-start">
                              <span className="font-medium">Lightly Active</span>
                              <span className="text-xs text-muted-foreground">Light exercise 1-3 days/week</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="moderately_active" className="text-left">
                            <div className="flex flex-col items-start">
                              <span className="font-medium">Moderately Active</span>
                              <span className="text-xs text-muted-foreground">Moderate exercise 3-5 days/week</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="very_active" className="text-left">
                            <div className="flex flex-col items-start">
                              <span className="font-medium">Very Active</span>
                              <span className="text-xs text-muted-foreground">Hard exercise 6-7 days/week</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="extremely_active" className="text-left">
                            <div className="flex flex-col items-start">
                              <span className="font-medium">Extremely Active</span>
                              <span className="text-xs text-muted-foreground">Very hard exercise, physical job</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        This affects your base daily calorie burn (TDEE) calculation
                      </p>
                    </div>
                  </div>
                  
                  {/* Goals Section */}
                  <div className="space-y-4 pt-6 border-t border-ceramic-rim/50">
                    <h4 className="text-sm font-medium text-warm-text">Daily Goals</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="dailyCalorieGoal" className="text-warm-text">Daily Calorie Goal</Label>
                        <Input
                          id="dailyCalorieGoal"
                          type="number"
                          placeholder="2000"
                          value={dailyCalorieGoal}
                          onChange={(e) => setDailyCalorieGoal(e.target.value)}
                          className="bg-ceramic-base border-ceramic-rim"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="dailyCarbGoal" className="text-warm-text">Daily Carb Goal (g)</Label>
                        <Input
                          id="dailyCarbGoal"
                          type="number"
                          placeholder="150"
                          value={dailyCarbGoal}
                          onChange={(e) => setDailyCarbGoal(e.target.value)}
                          className="bg-ceramic-base border-ceramic-rim"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {weight && height && age && (
                    <div className="bg-primary/10 border border-primary/20 p-3 rounded-lg">
                      <p className="text-sm text-primary font-medium">
                        Estimated BMR: {Math.round(
                          parseFloat(weight) && parseFloat(height) && parseFloat(age) 
                            ? 10 * parseFloat(weight) + 6.25 * parseFloat(height) - 5 * parseFloat(age) + 5
                            : 0
                        )} calories/day
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Basal Metabolic Rate - calories needed at rest
                      </p>
                    </div>
                  )}
                  
                  <Button onClick={handleSaveSettings} className="w-full">
                    Save Profile
                  </Button>
                </div>
              </div>
            </Card>

            {/* REMOVED: Notifications section as per plan */}



            {/* Premium Subscription */}
            <Card className="p-6 bg-ceramic-plate border-ceramic-rim">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <CreditCard className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold text-warm-text">Premium Subscription</h3>
                </div>

            {subscription.loading ? (
              <div className="text-center py-4">
                <p className="text-muted-foreground">Loading subscription status...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Subscription Status */}
                <div className="bg-accent/20 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {subscription.subscribed ? (
                        <Crown className="w-5 h-5 text-yellow-500" />
                      ) : (
                        <CreditCard className="w-5 h-5 text-muted-foreground" />
                      )}
                      <span className="font-medium text-warm-text">
                        {subscription.subscribed ? 'Premium' : 'Free'} Plan
                      </span>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      subscription.subscribed 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                    }`}>
                      {subscription.subscription_status}
                    </span>
                  </div>

                  {/* Usage Progress */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">AI Requests Used</span>
                      <span className="text-warm-text">
                        {subscription.requests_used} / {subscription.request_limit}
                      </span>
                    </div>
                    <div className="w-full bg-ceramic-base rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          (subscription.requests_used / subscription.request_limit) >= 0.9 
                            ? 'bg-red-500' 
                            : (subscription.requests_used / subscription.request_limit) >= 0.8 
                            ? 'bg-amber-500' 
                            : 'bg-primary'
                        }`}
                        style={{ 
                          width: `${Math.min(100, (subscription.requests_used / subscription.request_limit) * 100)}%` 
                        }}
                      />
                    </div>
                  </div>

                  {/* Usage Warning */}
                  {subscription.getUsageWarning() && (
                    <div className={`mt-3 p-2 rounded-lg flex items-center gap-2 ${
                      subscription.getUsageWarning()?.level === 'critical' 
                        ? 'bg-red-500/10 border border-red-500/20'
                        : subscription.getUsageWarning()?.level === 'warning'
                        ? 'bg-amber-500/10 border border-amber-500/20'
                        : 'bg-blue-500/10 border border-blue-500/20'
                    }`}>
                      <AlertTriangle className={`w-4 h-4 ${
                        subscription.getUsageWarning()?.level === 'critical' 
                          ? 'text-red-500'
                          : subscription.getUsageWarning()?.level === 'warning'
                          ? 'text-amber-500'
                          : 'text-blue-500'
                      }`} />
                      <p className={`text-sm ${
                        subscription.getUsageWarning()?.level === 'critical' 
                          ? 'text-red-600 dark:text-red-400'
                          : subscription.getUsageWarning()?.level === 'warning'
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-blue-600 dark:text-blue-400'
                      }`}>
                        {subscription.getUsageWarning()?.message}
                      </p>
                    </div>
                  )}
                </div>

                {/* Subscription Actions */}
                <div className="space-y-3">
                  {!subscription.subscribed ? (
                    <Button
                      onClick={subscription.createSubscription}
                      className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground"
                    >
                      <Crown className="w-4 h-4 mr-2" />
                      Upgrade to Premium - $9/month
                    </Button>
                  ) : (
                    <Button
                      onClick={subscription.openCustomerPortal}
                      variant="outline"
                      className="w-full bg-ceramic-base border-ceramic-rim"
                    >
                      <CreditCard className="w-4 h-4 mr-2" />
                      Manage Subscription
                    </Button>
                  )}

                  <Button
                    onClick={subscription.checkSubscription}
                    variant="ghost"
                    className="w-full text-muted-foreground hover:text-warm-text"
                  >
                    Refresh Status
                  </Button>
                </div>

                {/* Premium Benefits */}
                {!subscription.subscribed && (
                  <div className="bg-primary/5 p-3 rounded-lg">
                    <h4 className="font-medium text-warm-text mb-2">Premium Benefits:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• 1,000 AI requests per month (generous limit)</li>
                      <li>• Priority support</li>
                      <li>• All AI features included</li>
                      <li>• Cancel anytime, no hassle</li>
                    </ul>
                  </div>
                )}

                {/* Free users info - Compact */}
                {!subscription.subscribed && subscription.requests_used < subscription.free_requests_limit && (
                  <div className="text-xs text-muted-foreground p-2 rounded bg-ceramic-base/30">
                    {subscription.free_requests_limit - subscription.requests_used} free requests remaining.
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>



        {/* Reset Account */}
        {user && (
          <Card className="p-6 bg-ceramic-plate border-ceramic-rim border-red-200 dark:border-red-800">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Trash2 className="w-5 h-5 text-red-600" />
                <h3 className="text-lg font-semibold text-warm-text">Reset Account</h3>
              </div>
              
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 rounded-lg">
                <p className="text-sm text-red-700 dark:text-red-300">
                  <strong>⚠️ Danger Zone:</strong> This will permanently delete ALL your data including chat conversations, motivators, food entries, fasting sessions, and walking data. This action cannot be undone.
                </p>
              </div>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full bg-red-600 hover:bg-red-700">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Reset Account & Delete All Data
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-ceramic-plate border-ceramic-rim">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-warm-text flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                      Reset Account - Final Warning
                    </AlertDialogTitle>
                    <AlertDialogDescription className="space-y-3">
                      <p>
                        <strong>This action will permanently delete:</strong>
                      </p>
                      <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
                        <li>All chat conversations and history</li>
                        <li>All personal motivators and templates</li>
                        <li>All food entries and tracking data</li>
                        <li>All fasting sessions and progress</li>
                        <li>All walking data and statistics</li>
                        <li>Profile information and goals</li>
                        <li>AI usage history</li>
                      </ul>
                      <p className="text-red-600 font-semibold">
                        There is no way to recover this data once deleted. Are you absolutely sure?
                      </p>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="bg-ceramic-base border-ceramic-rim text-warm-text hover:bg-ceramic-base/80">
                      Cancel - Keep My Data
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={async () => {
                        if (user) {
                          try {
                            // Delete all user data
                            await Promise.all([
                              supabase.from('chat_conversations').delete().eq('user_id', user.id),
                              supabase.from('motivators').delete().eq('user_id', user.id),
                              supabase.from('food_entries').delete().eq('user_id', user.id),
                              supabase.from('user_foods').delete().eq('user_id', user.id),
                              supabase.from('fasting_sessions').delete().eq('user_id', user.id),
                              supabase.from('walking_sessions').delete().eq('user_id', user.id),
                              supabase.from('manual_calorie_burns').delete().eq('user_id', user.id),
                              supabase.from('ai_usage_logs').delete().eq('user_id', user.id),
                              supabase.from('profiles').update({
                                weight: null,
                                height: null,
                                age: null,
                                daily_calorie_goal: null,
                                daily_carb_goal: null,
                                activity_level: 'sedentary',
                                monthly_ai_requests: 0,
                                openai_api_key: null,
                                use_own_api_key: false
                              }).eq('user_id', user.id)
                            ]);
                            
                            // Clear localStorage to remove any cached data
                            localStorage.removeItem('openai_api_key');
                            localStorage.removeItem('food_analysis_cache');
                            localStorage.removeItem('walking_stats');
                            localStorage.removeItem('fasting_context');
                            
                            toast({
                              title: "Account Reset Complete",
                              description: "All your data has been deleted. Reloading app to clear cache...",
                              variant: "default",
                            });
                            
                            // Force reload to clear all React state and caches
                            setTimeout(() => {
                              window.location.reload();
                            }, 1500);
                          } catch (error) {
                            toast({
                              title: "Error",
                              description: "Failed to reset account. Please try again.",
                              variant: "destructive",
                            });
                          }
                        }
                      }}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      Yes, Delete Everything
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </Card>
        )}

        {/* About */}
        <Card className="p-6 bg-ceramic-plate border-ceramic-rim">
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
            
            <div className="bg-accent/20 p-3 rounded-lg">
              <p className="text-xs text-muted-foreground text-center">
                Made with ❤️ for your wellness journey
              </p>
            </div>
            
            <ClearCacheButton />
            
            <div className="bg-muted/20 p-2 rounded text-center">
              <p className="text-xs text-muted-foreground">
                Will log you out and require you to sign in again
              </p>
            </div>
            
            {isAdmin && (
              <Button
                onClick={() => navigate('/admin')}
                className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground"
              >
                <Shield className="w-4 h-4 mr-2" />
                Admin Dashboard
              </Button>
            )}
             </div>
           </Card>
           </div>
         </div>
       </ScrollArea>

       {/* Modals */}
       {showMotivatorsModal && (
         <MotivatorsModal onClose={() => setShowMotivatorsModal(false)} />
       )}
     </div>
   );
 };
 
 export default Settings;