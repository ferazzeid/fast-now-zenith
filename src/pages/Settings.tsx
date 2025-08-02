import { useState, useEffect } from 'react';
import { Key, Bell, User, Info, LogOut, Shield, CreditCard, Crown, AlertTriangle, Trash2, Database, Heart, Archive, MessageSquare, Sparkles, Palette } from 'lucide-react';
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
import { MotivatorAiChatModal } from '@/components/MotivatorAiChatModal';
import { ThemeToggle } from '@/components/ThemeToggle';
// Removed complex validation utilities - using simple localStorage

const Settings = () => {
  const [openAiKey, setOpenAiKey] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isKeyVisible, setIsKeyVisible] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [useOwnKey, setUseOwnKey] = useState(false);
  const [speechModel, setSpeechModel] = useState('gpt-4o-mini-realtime');
  const [transcriptionModel, setTranscriptionModel] = useState('whisper-1');
  const [ttsModel, setTtsModel] = useState('tts-1');
  const [ttsVoice, setTtsVoice] = useState('alloy');
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
  const [showAiGeneratorModal, setShowAiGeneratorModal] = useState(false);

  useEffect(() => {
    // Load saved API key from localStorage
    const savedApiKey = localStorage.getItem('openai_api_key');
    if (savedApiKey) {
      setOpenAiKey(savedApiKey);
    }

    const checkAdminRole = async () => {
      if (user) {
        try {
          const { data, error } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id)
            .eq('role', 'admin')
            .maybeSingle();
          
          if (error) {
            console.log('Admin check error (expected if no role):', error);
            setIsAdmin(false);
          } else {
            setIsAdmin(!!data);
          }
        } catch (error) {
          console.error('Error checking admin role:', error);
          setIsAdmin(false);
        }
      }
    };

    const fetchUserSettings = async () => {
      if (user) {
        try {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('use_own_api_key, speech_model, transcription_model, tts_model, tts_voice, openai_api_key, weight, height, age, daily_calorie_goal, daily_carb_goal, activity_level, units')
            .eq('user_id', user.id)
            .maybeSingle();

        if (error) {
          console.error('Error loading profile settings:', error);
          return;
        }

        if (profile) {
          setUseOwnKey(profile.use_own_api_key ?? true);
          setSpeechModel(profile.speech_model || 'gpt-4o-mini-realtime');
          setTranscriptionModel(profile.transcription_model || 'whisper-1');
          setTtsModel(profile.tts_model || 'tts-1');
          setTtsVoice(profile.tts_voice || 'alloy');
          setWeight(profile.weight?.toString() || '');
          setHeight(profile.height?.toString() || '');
          setAge(profile.age?.toString() || '');
          setDailyCalorieGoal(profile.daily_calorie_goal?.toString() || '');
          setDailyCarbGoal(profile.daily_carb_goal?.toString() || '');
          setActivityLevel(profile.activity_level || 'sedentary');
          setUnits((profile.units as 'metric' | 'imperial') || 'imperial');
          
          // Load API key from database if available
          if (profile.openai_api_key) {
            setOpenAiKey(profile.openai_api_key);
          }
        }
        } catch (error) {
          console.error('Error fetching user settings:', error);
        }
      }
    };

    checkAdminRole();
    fetchUserSettings();
  }, [user]);

  const handleSaveSettings = async () => {
    try {
      // Simple validation for API key
      if (useOwnKey && openAiKey.trim()) {
        if (!openAiKey.startsWith('sk-')) {
          toast({
            title: "Invalid API Key",
            description: "Please enter a valid OpenAI API key starting with 'sk-'",
            variant: "destructive"
          });
          return;
        }
        
        // Store API key in localStorage
        localStorage.setItem('openai_api_key', openAiKey);
      } else if (!useOwnKey) {
        localStorage.removeItem('openai_api_key');
      }

      // Save user preferences to database
      if (user) {
        const updateData = {
          use_own_api_key: useOwnKey,
          speech_model: speechModel,
          transcription_model: transcriptionModel,
          tts_model: ttsModel,
          tts_voice: ttsVoice,
          openai_api_key: useOwnKey ? openAiKey : null,
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
          description: useOwnKey ? "Using your own API key with selected models" : "Using shared service with selected models",
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

  const handleClearApiKey = () => {
    setOpenAiKey('');
    localStorage.removeItem('openai_api_key');
    toast({
      title: "🗑️ API Key Removed",
      description: "AI features have been disabled.",
    });
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <div className="max-w-md mx-auto pt-20 pb-24">
          <div className="space-y-6">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Settings
              </h1>
              <p className="text-muted-foreground">Customize your fasting experience</p>
            </div>

            {/* Theme Toggle Section */}
            <Card className="p-6 bg-ceramic-plate border-ceramic-rim">
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
                    <span className="text-muted-foreground">Account Type</span>
                    <span className="text-warm-text font-medium">
                      {subscription.subscription_tier === 'paid_user' ? 'Premium User' : 
                       subscription.subscription_tier === 'api_user' ? 'API User' : 
                       subscription.subscription_tier === 'granted_user' ? 'Free User' : 'Free User'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Member since</span>
                    <span className="text-warm-text font-medium">
                      {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
                    </span>
                  </div>
                </div>
                
                <div className="pt-3 border-t border-ceramic-rim space-y-3">
                  {/* Show upgrade button for non-premium users */}
                  {subscription.subscription_tier !== 'paid_user' && subscription.subscription_tier !== 'api_user' && (
                    <Button
                      onClick={async () => {
                        try {
                          await subscription.createSubscription();
                          toast({
                            title: "Redirecting to checkout",
                            description: "Opening payment page..."
                          });
                        } catch (error) {
                          toast({
                            title: "Error",
                            description: "Failed to create subscription. Please try again.",
                            variant: "destructive"
                          });
                        }
                      }}
                      className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                    >
                      <Crown className="w-4 h-4 mr-2" />
                      Upgrade to Premium
                    </Button>
                  )}
                  
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


            {/* User Profile */}
            <Card className="p-6 bg-ceramic-plate border-ceramic-rim">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <User className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold text-warm-text">Profile</h3>
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
                  
                  {/* Daily Goals Section */}
                  <div className="space-y-4 pt-6 border-t border-ceramic-rim/50">
                    <h4 className="text-sm font-medium text-warm-text">Daily Goals</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="dailyCalorieGoal" className="text-warm-text">Calorie Goal</Label>
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
                        <Label htmlFor="dailyCarbGoal" className="text-warm-text">Carb Goal (g)</Label>
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
                    <p className="text-xs text-muted-foreground">
                      Set your daily calorie and carbohydrate targets for better tracking
                    </p>
                  </div>
                  
                  <Button onClick={handleSaveSettings} className="w-full">
                    Save Profile
                  </Button>
                </div>
              </div>
            </Card>

            {/* REMOVED: Notifications section as per plan */}


        {/* AI Settings */}
        <Card className="p-6 bg-ceramic-plate border-ceramic-rim">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Key className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-warm-text">AI Settings</h3>
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="use-own-key" className="text-warm-text font-medium">Use your own API key</Label>
                <p className="text-xs text-muted-foreground">Toggle to configure your own OpenAI API key</p>
              </div>
              <Switch
                id="use-own-key"
                checked={useOwnKey}
                onCheckedChange={setUseOwnKey}
              />
            </div>
            
            {useOwnKey ? (
              <div className="space-y-4 p-4 rounded-lg bg-ceramic-base/50 border border-ceramic-rim">
                <div className="space-y-2">
                  <Label htmlFor="openai-key" className="text-warm-text">OpenAI API Key</Label>
                  <div className="relative">
                    <Input
                      id="openai-key"
                      type={isKeyVisible ? 'text' : 'password'}
                      placeholder="Enter your OpenAI API key"
                      value={openAiKey}
                      onChange={(e) => setOpenAiKey(e.target.value)}
                      className="bg-ceramic-base border-ceramic-rim pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute inset-y-0 right-0 px-3 py-0 h-full"
                      onClick={() => setIsKeyVisible(!isKeyVisible)}
                    >
                      {isKeyVisible ? '🙈' : '👁️'}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Get your API key from{" "}
                    <a 
                      href="https://platform.openai.com/api-keys" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      OpenAI Platform
                    </a>
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-warm-text">Chat Model</Label>
                  <Select value={speechModel} onValueChange={setSpeechModel}>
                    <SelectTrigger className="bg-ceramic-base border-ceramic-rim">
                      <SelectValue placeholder="Select chat model" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gpt-4o-mini-realtime">GPT-4o Mini (Recommended)</SelectItem>
                      <SelectItem value="gpt-4o-realtime">GPT-4o (Premium)</SelectItem>
                      <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo (Fast)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                
                <div className="flex space-x-2">
                  <Button 
                    onClick={handleClearApiKey}
                    variant="outline"
                    className="flex-1 bg-ceramic-base border-ceramic-rim hover:bg-red-50 hover:border-red-200 hover:text-red-600"
                  >
                    Clear API Key
                  </Button>
                  <Button 
                    onClick={handleSaveSettings}
                    className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    Save AI Settings
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground p-3 rounded-lg bg-ceramic-base/30">
                Using shared service with default models and voice settings.
              </p>
            )}

          </div>
        </Card>

            {/* Premium Subscription - Only show if not using own API key */}
            {!useOwnKey && (
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
                  {!subscription.subscribed && subscription.requests_used < subscription.request_limit && (
                    <div className="text-xs text-muted-foreground p-2 rounded bg-ceramic-base/30">
                      {subscription.request_limit - subscription.requests_used} free requests remaining.
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>
        )}



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

              {/* Account Deletion Section */}
              <div className="mt-6 pt-6 border-t border-ceramic-rim">
                <div className="flex items-center space-x-3 mb-4">
                  <Trash2 className="w-5 h-5 text-red-500" />
                  <h4 className="text-md font-semibold text-warm-text">Delete Account</h4>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg mb-4">
                  <p className="text-sm text-red-800 dark:text-red-200 mb-2">
                    <strong>Permanently delete your account and all associated data.</strong>
                  </p>
                  <p className="text-xs text-red-600 dark:text-red-300">
                    {subscription.subscribed 
                      ? "⚠️ You have an active subscription. Your account will be scheduled for deletion when your subscription expires. Your subscription will be canceled immediately but you can continue using premium features until it expires."
                      : "⚠️ This action cannot be undone. All your data will be permanently deleted immediately."
                    }
                  </p>
                </div>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="destructive" 
                      className="w-full bg-red-600 hover:bg-red-700 text-white"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete My Account
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-ceramic-base border-ceramic-rim">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-red-600 flex items-center">
                        <Trash2 className="w-5 h-5 mr-2" />
                        Delete Account Forever?
                      </AlertDialogTitle>
                      <AlertDialogDescription className="text-warm-text/80">
                        {subscription.subscribed ? (
                          <div className="space-y-3">
                            <p className="font-semibold text-orange-600">
                              You have an active subscription. Here's what will happen:
                            </p>
                            <ul className="list-disc list-inside space-y-1 text-sm">
                              <li>Your subscription will be <strong>canceled immediately</strong></li>
                              <li>You can continue using premium features until <strong>{subscription.subscription_end_date ? new Date(subscription.subscription_end_date).toLocaleDateString() : 'your subscription expires'}</strong></li>
                              <li>Your account will be <strong>automatically deleted</strong> when your subscription expires</li>
                              <li>All your data will be permanently deleted at that time</li>
                            </ul>
                            <p className="text-red-600 font-semibold text-sm">
                              No refunds will be provided. You'll keep access until your billing period ends.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <p className="font-semibold text-red-600">
                              This will permanently delete:
                            </p>
                            <ul className="list-disc list-inside space-y-1 text-sm">
                              <li>Your entire account and login credentials</li>
                              <li>All food entries and tracking data</li>
                              <li>All fasting sessions and progress</li>
                              <li>All walking data and statistics</li>
                              <li>Profile information and goals</li>
                              <li>AI usage history and conversations</li>
                            </ul>
                            <p className="text-red-600 font-semibold">
                              This action cannot be undone. Your account will be deleted immediately.
                            </p>
                          </div>
                        )}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="bg-ceramic-base border-ceramic-rim text-warm-text hover:bg-ceramic-base/80">
                        Cancel - Keep My Account
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={async () => {
                          if (user) {
                            try {
                              const { data, error } = await supabase.functions.invoke('delete-account');
                              
                              if (error) {
                                throw new Error(error.message);
                              }

                              if (data.scheduled) {
                                toast({
                                  title: "Account Deletion Scheduled",
                                  description: data.message,
                                  variant: "default",
                                });
                              } else {
                                toast({
                                  title: "Account Deleted",
                                  description: data.message,
                                  variant: "default",
                                });
                                
                                // Sign out and redirect after a moment
                                setTimeout(() => {
                                  signOut();
                                  navigate('/auth');
                                }, 2000);
                              }
                            } catch (error) {
                              toast({
                                title: "Error",
                                description: "Failed to delete account. Please try again.",
                                variant: "destructive",
                              });
                            }
                          }
                        }}
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        {subscription.subscribed 
                          ? "Yes, Schedule Account Deletion" 
                          : "Yes, Delete My Account Forever"
                        }
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
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

      {/* Modals */}
      {showMotivatorsModal && (
        <MotivatorsModal onClose={() => setShowMotivatorsModal(false)} />
      )}
      
      {showAiGeneratorModal && (
        <MotivatorAiChatModal onClose={() => setShowAiGeneratorModal(false)} />
      )}
    </div>
  );
};

export default Settings;