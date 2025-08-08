import { useState, useEffect } from 'react';
import { Key, Bell, User, Info, LogOut, Shield, CreditCard, Crown, AlertTriangle, Trash2, Database, Heart, Archive, MessageSquare, Sparkles, Palette, Brain } from 'lucide-react';
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
import { useOptimizedSubscription } from '@/hooks/optimized/useOptimizedSubscription';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { ClearCacheButton } from '@/components/ClearCacheButton';
import { UnitsSelector } from '@/components/UnitsSelector';
import { useArchivedConversations } from '@/hooks/useArchivedConversations';
import { MotivatorsModal } from '@/components/MotivatorsModal';
import { MotivatorAiChatModal } from '@/components/MotivatorAiChatModal';
import { ThemeToggle } from '@/components/ThemeToggle';
import { GlobalProfileOnboarding } from '@/components/GlobalProfileOnboarding';
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
  const subscription = useOptimizedSubscription();
  const { archivedConversations, loading: archiveLoading, restoreConversation, deleteArchivedConversation } = useArchivedConversations();
  const [showMotivatorsModal, setShowMotivatorsModal] = useState(false);
  const [showAiGeneratorModal, setShowAiGeneratorModal] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [profile, setProfile] = useState<any>(null);

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
          const { data: profileData, error } = await supabase
            .from('profiles')
            .select('use_own_api_key, speech_model, transcription_model, tts_model, tts_voice, openai_api_key, weight, height, age, daily_calorie_goal, daily_carb_goal, activity_level, units, enable_fasting_slideshow, enable_walking_slideshow')
            .eq('user_id', user.id)
            .maybeSingle();

        if (error) {
          console.error('Error loading profile settings:', error);
          return;
        }

        if (profileData) {
          setProfile(profileData);
          setUseOwnKey(profileData.use_own_api_key ?? true);
          setSpeechModel(profileData.speech_model || 'gpt-4o-mini-realtime');
          setTranscriptionModel(profileData.transcription_model || 'whisper-1');
          setTtsModel(profileData.tts_model || 'tts-1');
          setTtsVoice(profileData.tts_voice || 'alloy');
          setWeight(profileData.weight?.toString() || '');
          setHeight(profileData.height?.toString() || '');
          setAge(profileData.age?.toString() || '');
          setDailyCalorieGoal(profileData.daily_calorie_goal?.toString() || '');
          setDailyCarbGoal(profileData.daily_carb_goal?.toString() || '');
          setActivityLevel(profileData.activity_level || 'sedentary');
          setUnits((profileData.units as 'metric' | 'imperial') || 'imperial');
          
          // Load API key from database if available
          if (profileData.openai_api_key) {
            setOpenAiKey(profileData.openai_api_key);
          }

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

    checkAdminRole();
    fetchUserSettings();
  }, [user]);

  const handleSaveSettings = async () => {
    try {
      // Validate required fields first
      if (units === 'metric') {
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
      } else {
        if (weight && (parseFloat(weight) < 60 || parseFloat(weight) > 700)) {
          toast({
            title: "Invalid Weight",
            description: "Weight must be between 60-700 lbs",
            variant: "destructive"
          });
          return;
        }
        if (height && (parseInt(height) < 48 || parseInt(height) > 96)) {
          toast({
            title: "Invalid Height",
            description: "Height must be between 48-96 inches", 
            variant: "destructive"
          });
          return;
        }
      }

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
          toast({
            title: "Database Error",
            description: `Failed to save: ${error.message}`,
            variant: "destructive"
          });
          return;
        }

        // Ensure tier reflects latest settings (own API key overrides others)
        try {
          await supabase.rpc('update_user_tier', { _user_id: user.id });
          // Invalidate cached subscription to reflect changes immediately
          // @ts-ignore - optional chaining for safety if hook shape changes
          subscription?.invalidate?.();
        } catch (tierErr) {
          console.warn('Tier update RPC failed:', tierErr);
        }

        console.log('Settings saved successfully');
        toast({
          title: "✅ Settings Saved!",
          description: useOwnKey ? "Using your own API key with selected models" : "Using shared service with selected models",
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
      <div className="max-w-md mx-auto pt-10 pb-24">
          <div className="space-y-6">
          <div className="space-y-2">
            {/* Header */}
            <div className="mb-2 mt-4">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent mb-1">
                  Settings
                </h1>
                {isAdmin && (
                  <Button size="sm" variant="outline" onClick={() => navigate('/admin')}>
                    Admin Dashboard
                  </Button>
                )}
              </div>
              <p className="text-sm text-muted-foreground text-left">Customize your fasting experience</p>
            </div>
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

            {/* Animation Settings */}
            <Card className="p-6 bg-ceramic-plate border-ceramic-rim">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold text-warm-text">Animations</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-warm-text">Fasting Motivator Slideshow</span>
                    </div>
                    <Switch
                      checked={profile?.enable_fasting_slideshow ?? true}
                      onCheckedChange={async (checked) => {
                        try {
                          await supabase
                            .from('profiles')
                            .update({ enable_fasting_slideshow: checked })
                            .eq('user_id', user?.id);
                          toast({
                            title: checked ? "Fasting slideshow enabled" : "Fasting slideshow disabled",
                            description: "Changes will take effect immediately"
                          });
                          setProfile(prev => ({ ...prev, enable_fasting_slideshow: checked }));
                        } catch (error) {
                          toast({
                            title: "Error",
                            description: "Failed to update setting",
                            variant: "destructive"
                          });
                        }
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-warm-text">Walking Motivator Slideshow</span>
                    </div>
                    <Switch
                      checked={profile?.enable_walking_slideshow ?? true}
                      onCheckedChange={async (checked) => {
                        try {
                          await supabase
                            .from('profiles')
                            .update({ enable_walking_slideshow: checked })
                            .eq('user_id', user?.id);
                          toast({
                            title: checked ? "Walking slideshow enabled" : "Walking slideshow disabled",
                            description: "Changes will take effect immediately"
                          });
                          setProfile(prev => ({ ...prev, enable_walking_slideshow: checked }));
                        } catch (error) {
                          toast({
                            title: "Error",
                            description: "Failed to update setting",
                            variant: "destructive"
                          });
                        }
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Disabling slideshows may improve performance on slower devices
                  </p>
                </div>
              </div>
            </Card>


            {/* User Profile */}
            <Card className="p-6 bg-ceramic-plate border-ceramic-rim">
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
                  
                  {/* Daily Goals Section */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-warm-text">Daily Goals</h4>
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
                    <Label htmlFor="activity-level" className="text-warm-text">Activity Level</Label>
                    <Select value={activityLevel} onValueChange={setActivityLevel}>
                      <SelectTrigger className="bg-ceramic-base border-ceramic-rim w-full">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sedentary">Sedentary</SelectItem>
                        <SelectItem value="lightly-active">Lightly Active</SelectItem>
                        <SelectItem value="moderately-active">Moderately Active</SelectItem>
                        <SelectItem value="very-active">Very Active</SelectItem>
                        <SelectItem value="extra-active">Extra Active</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </Card>

            {/* AI & API */}
            <Card className="p-6 bg-ceramic-plate border-ceramic-rim">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Key className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold text-warm-text">AI & API</h3>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="use-own-key" className="text-warm-text">Use my own OpenAI API key</Label>
                    <Switch id="use-own-key" checked={useOwnKey} onCheckedChange={setUseOwnKey} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="openai-key" className="text-warm-text">OpenAI API Key</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="openai-key"
                        type={isKeyVisible ? 'text' : 'password'}
                        placeholder="sk-..."
                        value={openAiKey}
                        onChange={(e) => setOpenAiKey(e.target.value)}
                        disabled={!useOwnKey}
                        className="bg-ceramic-base border-ceramic-rim"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setIsKeyVisible((v) => !v)}
                        className="shrink-0"
                      >
                        {isKeyVisible ? 'Hide' : 'Show'}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Your key is stored securely on your device and in your profile to enable API User mode. It overrides all other account types.
                    </p>
                    <a
                      href="https://platform.openai.com/api-keys"
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm underline text-primary"
                    >
                      Get an OpenAI API key →
                    </a>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button type="button" variant="outline" onClick={handleClearApiKey}>
                      Clear key
                    </Button>
                    <Button type="button" onClick={handleSaveSettings} className="ml-auto bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70">
                      Save key
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            {/* Save Button */}
            <Button onClick={handleSaveSettings} variant="action-primary" size="action-main" className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70">
              Save Settings
            </Button>

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

          {/* Profile Onboarding Modal */}
          <GlobalProfileOnboarding
            isOpen={showOnboarding}
            onClose={() => setShowOnboarding(false)}
          />
        </div>
      );
    };

    export default Settings;
