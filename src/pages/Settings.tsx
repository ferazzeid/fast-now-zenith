import { useState, useEffect, useCallback } from 'react';
import { Key, Bell, User, Info, LogOut, Shield, CreditCard, Crown, AlertTriangle, Trash2, Database, Heart, Archive, MessageSquare, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { ClearCacheButton } from '@/components/ClearCacheButton';
import { UnitsSelector } from '@/components/UnitsSelector';
import { MotivatorsModal } from '@/components/MotivatorsModal';
import { MotivatorAiChatModal } from '@/components/MotivatorAiChatModal';
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
  const navigate = useNavigate();
  const [showMotivatorsModal, setShowMotivatorsModal] = useState(false);
  const [showAiGeneratorModal, setShowAiGeneratorModal] = useState(false);
  
  // AI-centric state management
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState({
    loading: false,
    subscribed: false,
    subscription_status: 'free',
    requests_used: 0,
    request_limit: 15,
    free_requests_limit: 15,
    createSubscription: () => {},
    openCustomerPortal: () => {},
    checkSubscription: () => {},
    getUsageWarning: () => null
  });
  const [archivedConversations, setArchivedConversations] = useState([]);
  const [archiveLoading, setArchiveLoading] = useState(false);

  // AI-powered authentication management
  const signOut = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('chat-completion', {
        body: {
          message: "Sign me out",
          action: "sign_out"
        }
      });

      if (error) throw error;

      // Clear local state
      setUser(null);
      localStorage.removeItem('openai_api_key');
      
      // Redirect to auth page
      navigate('/auth');
      
      toast({
        title: "Signed out successfully",
        description: "See you next time!"
      });
    } catch (error) {
      console.error('Error signing out:', error);
      // Fallback to direct supabase signout
      await supabase.auth.signOut();
      navigate('/auth');
    }
  }, [navigate, toast]);

  // AI-powered subscription management
  const createSubscription = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('chat-completion', {
        body: {
          message: "Create a premium subscription for me",
          action: "create_subscription"
        }
      });

      if (error) throw error;

      if (data.url) {
        window.open(data.url, '_blank');
        toast({
          title: "Redirecting to checkout",
          description: "Opening payment page..."
        });
      }
    } catch (error) {
      console.error('Error creating subscription:', error);
      toast({
        title: "Error",
        description: "Failed to create subscription. Please try again.",
        variant: "destructive"
      });
    }
  }, [toast]);

  const openCustomerPortal = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('chat-completion', {
        body: {
          message: "Open my customer billing portal",
          action: "open_customer_portal"
        }
      });

      if (error) throw error;

      if (data.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast({
        title: "Error",
        description: "Failed to open billing portal. Please try again.",
        variant: "destructive"
      });
    }
  }, [toast]);

  const checkSubscription = useCallback(async () => {
    try {
      setSubscription(prev => ({ ...prev, loading: true }));
      
      const { data, error } = await supabase.functions.invoke('chat-completion', {
        body: {
          message: "Check my subscription status and usage",
          action: "check_subscription"
        }
      });

      if (error) throw error;

      if (data.subscription) {
        setSubscription(prev => ({
          ...prev,
          loading: false,
          subscribed: data.subscription.subscribed || false,
          subscription_status: data.subscription.subscription_status || 'free',
          requests_used: data.subscription.requests_used || 0,
          request_limit: data.subscription.request_limit || 15,
          free_requests_limit: data.subscription.free_requests_limit || 15,
          createSubscription,
          openCustomerPortal,
          checkSubscription,
          getUsageWarning: () => {
            const percentage = (data.subscription.requests_used / data.subscription.request_limit) * 100;
            if (percentage >= 100) {
              return {
                level: 'critical',
                message: data.subscription.subscribed 
                  ? 'Monthly limit reached. Upgrade limits in admin panel or use your own API key.'
                  : 'Free requests used up. Upgrade to premium for 1,000 monthly requests.',
              };
            } else if (percentage >= 90) {
              return {
                level: 'warning',
                message: `You've used ${data.subscription.requests_used} of ${data.subscription.request_limit} requests this month.`,
              };
            } else if (percentage >= 80) {
              return {
                level: 'info',
                message: `You've used ${data.subscription.requests_used} of ${data.subscription.request_limit} requests this month.`,
              };
            }
            return null;
          }
        }));
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
      setSubscription(prev => ({ ...prev, loading: false }));
    }
  }, [createSubscription, openCustomerPortal]);

  // AI-powered conversation management
  const restoreConversation = useCallback(async (conversationId) => {
    try {
      const { data, error } = await supabase.functions.invoke('chat-completion', {
        body: {
          message: `Restore archived conversation`,
          action: "restore_conversation",
          conversation_id: conversationId
        }
      });

      if (error) throw error;

      // Remove from archived list
      setArchivedConversations(prev => prev.filter(conv => conv.id !== conversationId));
      
      toast({
        title: "Conversation restored",
        description: "You can now continue your chat"
      });
    } catch (error) {
      console.error('Error restoring conversation:', error);
      toast({
        title: "Error",
        description: "Failed to restore conversation",
        variant: "destructive"
      });
    }
  }, [toast]);

  const deleteArchivedConversation = useCallback(async (conversationId) => {
    try {
      const { data, error } = await supabase.functions.invoke('chat-completion', {
        body: {
          message: `Delete archived conversation permanently`,
          action: "delete_conversation",
          conversation_id: conversationId
        }
      });

      if (error) throw error;

      // Remove from archived list
      setArchivedConversations(prev => prev.filter(conv => conv.id !== conversationId));
      
      toast({
        title: "Conversation deleted",
        description: "The conversation has been permanently removed"
      });
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast({
        title: "Error",
        description: "Failed to delete conversation",
        variant: "destructive"
      });
    }
  }, [toast]);

  // AI-powered data loading
  const loadUserData = useCallback(async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      setUser(authUser);

      const { data, error } = await supabase.functions.invoke('chat-completion', {
        body: {
          message: "Load my complete user profile, settings, and archived conversations",
          action: "load_user_data"
        }
      });

      if (error) throw error;

      if (data.profile) {
        const profile = data.profile;
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
        
        if (profile.openai_api_key) {
          setOpenAiKey(profile.openai_api_key);
        }
      }

      if (data.admin_role) {
        setIsAdmin(data.admin_role);
      }

      if (data.archived_conversations) {
        setArchivedConversations(data.archived_conversations);
      }

      // Update subscription state
      if (data.subscription) {
        setSubscription(prev => ({
          ...prev,
          subscribed: data.subscription.subscribed || false,
          subscription_status: data.subscription.subscription_status || 'free',
          requests_used: data.subscription.requests_used || 0,
          request_limit: data.subscription.request_limit || 15,
          free_requests_limit: data.subscription.free_requests_limit || 15,
          createSubscription,
          openCustomerPortal,
          checkSubscription: () => checkSubscription(),
          getUsageWarning: () => {
            const percentage = (data.subscription.requests_used / data.subscription.request_limit) * 100;
            if (percentage >= 100) {
              return {
                level: 'critical',
                message: data.subscription.subscribed 
                  ? 'Monthly limit reached. Upgrade limits in admin panel or use your own API key.'
                  : 'Free requests used up. Upgrade to premium for 1,000 monthly requests.',
              };
            } else if (percentage >= 90) {
              return {
                level: 'warning',
                message: `You've used ${data.subscription.requests_used} of ${data.subscription.request_limit} requests this month.`,
              };
            } else if (percentage >= 80) {
              return {
                level: 'info',
                message: `You've used ${data.subscription.requests_used} of ${data.subscription.request_limit} requests this month.`,
              };
            }
            return null;
          }
        }));
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  }, [createSubscription, openCustomerPortal, checkSubscription]);

  // Load initial data when component mounts
  useEffect(() => {
    // Load saved API key from localStorage
    const savedApiKey = localStorage.getItem('openai_api_key');
    if (savedApiKey) {
      setOpenAiKey(savedApiKey);
    }

    // Load user data via AI
    loadUserData();
  }, [loadUserData]);

  // AI-powered settings save
  const handleSaveSettings = useCallback(async () => {
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

      // Save user preferences via AI
      if (user) {
        const settingsData = {
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

        const { data, error } = await supabase.functions.invoke('chat-completion', {
          body: {
            message: `Save my profile settings and preferences`,
            action: "save_user_settings",
            settings_data: settingsData
          }
        });

        if (error) throw error;

        toast({
          title: "✅ Settings Saved!",
          description: useOwnKey ? "Using your own API key with selected models" : "Using shared service with selected models",
        });
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive"
      });
    }
  }, [user, useOwnKey, openAiKey, speechModel, transcriptionModel, ttsModel, ttsVoice, weight, height, age, dailyCalorieGoal, dailyCarbGoal, activityLevel, units, toast]);

  const handleClearApiKey = () => {
    setOpenAiKey('');
    localStorage.removeItem('openai_api_key');
    toast({
      title: "🗑️ API Key Removed",
      description: "AI features have been disabled.",
    });
  };

  // AI-powered walking history clearing
  const handleClearWalkingHistory = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.functions.invoke('chat-completion', {
        body: {
          message: "Clear all my walking history",
          action: "clear_walking_history"
        }
      });

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
  }, [user, toast]);

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

            {/* Account Section - Moved to top */}
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
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={() => setShowMotivatorsModal(true)}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      <Heart className="w-4 h-4 mr-2" />
                      Manage
                    </Button>
                    <Button
                      onClick={() => setShowAiGeneratorModal(true)}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate with AI
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Create, edit, and organize your personal motivational content, images, and quotes. Use AI to automatically generate personalized motivators for your fasting journey.
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
                          <SelectItem value="sedentary">
                            <div className="flex flex-col">
                              <span className="font-medium">Sedentary</span>
                              <span className="text-xs text-muted-foreground">Little to no exercise</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="lightly_active">
                            <div className="flex flex-col">
                              <span className="font-medium">Lightly Active</span>
                              <span className="text-xs text-muted-foreground">Light exercise 1-3 days/week</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="moderately_active">
                            <div className="flex flex-col">
                              <span className="font-medium">Moderately Active</span>
                              <span className="text-xs text-muted-foreground">Moderate exercise 3-5 days/week</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="very_active">
                            <div className="flex flex-col">
                              <span className="font-medium">Very Active</span>
                              <span className="text-xs text-muted-foreground">Hard exercise 6-7 days/week</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="extremely_active">
                            <div className="flex flex-col">
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

            {/* Voice Settings - Available for all users */}
            <div className="space-y-2 p-4 rounded-lg bg-ceramic-base/50 border border-ceramic-rim">
              <Label className="text-warm-text">AI Voice</Label>
              <Select value={ttsVoice} onValueChange={setTtsVoice} disabled={!useOwnKey && !subscription.subscribed}>
                <SelectTrigger className="bg-ceramic-base border-ceramic-rim">
                  <SelectValue placeholder="Select voice" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alloy">Alloy</SelectItem>
                  <SelectItem value="echo">Echo</SelectItem>
                  <SelectItem value="fable">Fable</SelectItem>
                  <SelectItem value="onyx">Onyx</SelectItem>
                  <SelectItem value="nova">Nova</SelectItem>
                  <SelectItem value="shimmer">Shimmer</SelectItem>
                </SelectContent>
              </Select>
              {!useOwnKey && !subscription.subscribed && (
                <p className="text-xs text-muted-foreground">
                  Voice selection available with premium subscription or own API key
                </p>
              )}
            </div>
          </div>
        </Card>

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
                            // AI-powered account reset
                            const { data, error } = await supabase.functions.invoke('chat-completion', {
                              body: {
                                message: "Reset my account and delete all my data permanently",
                                action: "reset_account"
                              }
                            });

                            if (error) throw error;
                            
                            // Clear local state
                            setWeight('');
                            setHeight('');
                            setAge('');
                            setDailyCalorieGoal('');
                            setDailyCarbGoal('');
                            setActivityLevel('sedentary');
                            setArchivedConversations([]);
                            localStorage.removeItem('openai_api_key');
                            
                            toast({
                              title: "Account Reset Complete",
                              description: "All your data has been deleted. Your account is now fresh.",
                              variant: "default",
                            });
                          } catch (error) {
                            console.error('Error resetting account:', error);
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
       
       {showAiGeneratorModal && (
         <MotivatorAiChatModal onClose={() => setShowAiGeneratorModal(false)} />
       )}
     </div>
   );
 };
 
 export default Settings;