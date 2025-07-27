import { useState, useEffect } from 'react';
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
import { useAuth } from '@/hooks/useAuth';  
import { useSubscription } from '@/hooks/useSubscription';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { ClearCacheButton } from '@/components/ClearCacheButton';
import { UnitsSelector } from '@/components/UnitsSelector';
import { useArchivedConversations } from '@/hooks/useArchivedConversations';
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
          .select('use_own_api_key, speech_model, transcription_model, tts_model, tts_voice, openai_api_key, weight, height, age, daily_calorie_goal, daily_carb_goal, activity_level, units')
          .eq('user_id', user.id)
          .single();

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
        console.log('Saving settings for user:', user.id);
        console.log('API key length:', openAiKey?.length || 0);
        console.log('Use own key:', useOwnKey);
        console.log('Will save openai_api_key as:', useOwnKey ? openAiKey : null);
        
        const { data, error } = await supabase
          .from('profiles')
          .update({
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
          })
          .eq('user_id', user.id);

        console.log('Update result:', { data, error });

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
    <div className="min-h-screen bg-ceramic-base safe-top safe-bottom">
      <ScrollArea className="h-screen">
        <div className="px-4 pt-8 pb-24">
          <div className="max-w-md mx-auto space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold text-warm-text">Settings</h1>
              <p className="text-muted-foreground">Customize your fasting experience</p>
            </div>

            {/* Motivators */}
            <Card className="p-6 bg-ceramic-plate border-ceramic-rim">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Heart className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold text-warm-text">Motivators</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setShowMotivatorsModal(true)}
                      className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                    >
                      <Heart className="w-4 h-4 mr-2" />
                      Manage Motivators
                    </Button>
                    <Button
                      onClick={() => setShowAiGeneratorModal(true)}
                      className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
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

        {/* AI Configuration */}
        <Card className="p-6 bg-ceramic-plate border-ceramic-rim">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Key className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-warm-text">AI Features</h3>
            </div>
            
            <div className="space-y-4">
              {/* AI Service Status */}
              <div className="space-y-3">
                {subscription.subscribed ? (
                  <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Crown className="w-5 h-5 text-green-500" />
                      <span className="font-medium text-green-600 dark:text-green-400">Premium AI Access</span>
                    </div>
                    <p className="text-sm text-green-600 dark:text-green-400">
                      You have unlimited access to our AI-powered fasting assistant. No setup required!
                    </p>
                  </div>
                ) : (
                  <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg space-y-3">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-blue-500" />
                      <span className="font-medium text-blue-600 dark:text-blue-400">Free Tier AI Access</span>
                    </div>
                    <p className="text-sm text-blue-600 dark:text-blue-400">
                      You get {subscription.request_limit} AI requests using our shared service. 
                      Used: {subscription.requests_used}/{subscription.request_limit}
                    </p>
                    <Button
                      onClick={subscription.createSubscription}
                      className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground"
                    >
                      <Crown className="w-4 h-4 mr-2" />
                      Upgrade to Premium
                    </Button>
                  </div>
                )}
              </div>

              {/* Free Users: Own API Key Option */}
              {!subscription.subscribed && (
                <details className="group">
                  <summary className="cursor-pointer select-none">
                    <div className="flex items-center justify-between p-3 bg-ceramic-base rounded-lg border border-ceramic-rim">
                      <div className="flex items-center gap-2">
                        <Key className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-warm-text">Alternative: Use my own API key</span>
                      </div>
                      <div className="text-xs text-muted-foreground group-open:rotate-180 transition-transform">⌄</div>
                    </div>
                  </summary>
                  
                  <div className="mt-3 space-y-3 p-3 bg-ceramic-base/50 rounded-lg border border-ceramic-rim/50">
                    <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-lg">
                      <p className="text-xs text-amber-600 dark:text-amber-400">
                        Use your own OpenAI API key instead of upgrading. You'll get full model control but pay OpenAI directly.
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="use-own-key-free"
                        checked={useOwnKey}
                        onCheckedChange={setUseOwnKey}
                      />
                      <Label htmlFor="use-own-key-free" className="text-sm text-warm-text">
                        Use my own API key instead of shared service
                      </Label>
                    </div>

                    {useOwnKey && (
                      <div className="space-y-3">
                        <Label htmlFor="api-key" className="text-warm-text">
                          OpenAI API Key
                        </Label>
                        <div className="space-y-2">
                          <Input
                            id="api-key"
                            type={isKeyVisible ? 'text' : 'password'}
                            placeholder="sk-..."
                            value={openAiKey}
                            onChange={(e) => setOpenAiKey(e.target.value)}
                            className="bg-ceramic-base border-ceramic-rim"
                            maxLength={100}
                          />
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="show-key"
                              checked={isKeyVisible}
                              onCheckedChange={setIsKeyVisible}
                            />
                            <Label htmlFor="show-key" className="text-sm text-muted-foreground">
                              Show API key
                            </Label>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </details>
              )}

              {/* Premium Users: Advanced Own API Key Option */}
              {subscription.subscribed && (
                <details className="group">
                  <summary className="cursor-pointer select-none">
                    <div className="flex items-center justify-between p-3 bg-ceramic-base rounded-lg border border-ceramic-rim">
                      <div className="flex items-center gap-2">
                        <Key className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-warm-text">Advanced: Use my own API key</span>
                      </div>
                      <div className="text-xs text-muted-foreground group-open:rotate-180 transition-transform">⌄</div>
                    </div>
                  </summary>
                  
                  <div className="mt-3 space-y-3 p-3 bg-ceramic-base/50 rounded-lg border border-ceramic-rim/50">
                    <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-lg">
                      <p className="text-xs text-amber-600 dark:text-amber-400">
                        Optional: Use your own OpenAI API key for custom model control. Most users don't need this.
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="use-own-key-premium"
                        checked={useOwnKey}
                        onCheckedChange={setUseOwnKey}
                      />
                      <Label htmlFor="use-own-key-premium" className="text-sm text-warm-text">
                        Use my own API key instead of shared service
                      </Label>
                    </div>

                    {useOwnKey && (
                      <div className="space-y-3">
                        <Label htmlFor="api-key-premium" className="text-warm-text">
                          OpenAI API Key
                        </Label>
                        <div className="space-y-2">
                          <Input
                            id="api-key-premium"
                            type={isKeyVisible ? 'text' : 'password'}
                            placeholder="sk-..."
                            value={openAiKey}
                            onChange={(e) => setOpenAiKey(e.target.value)}
                            className="bg-ceramic-base border-ceramic-rim"
                            maxLength={100}
                          />
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="show-key-premium"
                              checked={isKeyVisible}
                              onCheckedChange={setIsKeyVisible}
                            />
                            <Label htmlFor="show-key-premium" className="text-sm text-muted-foreground">
                              Show API key
                            </Label>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </details>
              )}

              {/* Voice Selection (Always visible for shared service) */}
              {!useOwnKey && (
                <div className="space-y-2">
                  <Label className="text-warm-text">AI Voice</Label>
                  <Select value={ttsVoice} onValueChange={setTtsVoice}>
                    <SelectTrigger className="bg-ceramic-base border-ceramic-rim">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="alloy">Alloy (Balanced ⭐)</SelectItem>
                      <SelectItem value="echo">Echo (Male)</SelectItem>
                      <SelectItem value="fable">Fable (Expressive)</SelectItem>
                      <SelectItem value="onyx">Onyx (Deep)</SelectItem>
                      <SelectItem value="nova">Nova (Warm)</SelectItem>
                      <SelectItem value="shimmer">Shimmer (Soft)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Choose your preferred assistant voice. Speech and transcription models are optimized by our team.
                  </p>
                </div>
              )}

              {/* Model Selection (Only when using own API key) */}
              {useOwnKey && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-warm-text">Speech Model (Real-time)</Label>
                      <Select value={speechModel} onValueChange={setSpeechModel}>
                        <SelectTrigger className="bg-ceramic-base border-ceramic-rim">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="gpt-4o-mini-realtime">GPT-4o Mini (Cost-effective ⭐)</SelectItem>
                          <SelectItem value="gpt-4o-realtime">GPT-4o (Premium)</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        {speechModel === 'gpt-4o-mini-realtime' ? 'Most cost-effective for voice chat' : 'Higher quality but more expensive'}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-warm-text">Transcription Model</Label>
                      <Select value={transcriptionModel} onValueChange={setTranscriptionModel}>
                        <SelectTrigger className="bg-ceramic-base border-ceramic-rim">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="whisper-1">Whisper-1 (Recommended ⭐)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-warm-text">Text-to-Speech Model</Label>
                      <Select value={ttsModel} onValueChange={setTtsModel}>
                        <SelectTrigger className="bg-ceramic-base border-ceramic-rim">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="tts-1">TTS-1 (Cost-effective ⭐)</SelectItem>
                          <SelectItem value="tts-1-hd">TTS-1 HD (Premium)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-warm-text">Voice</Label>
                      <Select value={ttsVoice} onValueChange={setTtsVoice}>
                        <SelectTrigger className="bg-ceramic-base border-ceramic-rim">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="alloy">Alloy (Balanced ⭐)</SelectItem>
                          <SelectItem value="echo">Echo (Male)</SelectItem>
                          <SelectItem value="fable">Fable (Expressive)</SelectItem>
                          <SelectItem value="onyx">Onyx (Deep)</SelectItem>
                          <SelectItem value="nova">Nova (Warm)</SelectItem>
                          <SelectItem value="shimmer">Shimmer (Soft)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button
                    onClick={handleClearApiKey}
                    variant="outline"
                    className="w-full bg-ceramic-base border-ceramic-rim"
                  >
                    Clear API Key
                  </Button>
                </>
              )}
              
              <Button
                onClick={handleSaveSettings}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Save AI Settings
              </Button>
              
              <div className="bg-accent/20 p-3 rounded-lg">
                <p className="text-xs text-muted-foreground">
                  {useOwnKey ? (
                    <>Your API key enables voice-to-text, AI chat, and smart motivator creation. 
                    Get your key from{' '}
                    <a 
                      href="https://platform.openai.com/api-keys" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      OpenAI Platform
                    </a></>
                  ) : (
                    'Using shared fasting assistant service. Voice and models are optimized by our team for the best experience.'
                  )}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Subscription Management */}
        <Card className="p-6 bg-ceramic-plate border-ceramic-rim">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <CreditCard className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-warm-text">AI Subscription</h3>
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

                {/* Free users info */}
                {!subscription.subscribed && subscription.requests_used < subscription.free_requests_limit && (
                  <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-lg">
                    <p className="text-sm text-blue-600 dark:text-blue-400">
                      You have {subscription.free_requests_limit - subscription.requests_used} free requests remaining. 
                      Use your own API key for unlimited access or upgrade to premium.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>

        {/* Notifications */}
        <Card className="p-6 bg-ceramic-plate border-ceramic-rim">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Bell className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-warm-text">Notifications</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-warm-text font-medium">Push Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Get reminders and encouragement during fasts
                  </p>
                </div>
                <Switch
                  checked={notificationsEnabled}
                  onCheckedChange={setNotificationsEnabled}
                />
              </div>
              
              <div className="bg-accent/20 p-3 rounded-lg">
                <p className="text-xs text-muted-foreground">
                  SMS and email notifications will be available in future updates
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* User Profile */}
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
              
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="weight" className="text-warm-text">
                    Weight ({units === 'metric' ? 'kg' : 'lbs'})
                  </Label>
                  <Input
                    id="weight"
                    type="number"
                    placeholder={units === 'metric' ? '70' : '150'}
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="bg-ceramic-base border-ceramic-rim"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="height" className="text-warm-text">
                    Height ({units === 'metric' ? 'cm' : 'inches'})
                  </Label>
                  <Input
                    id="height"
                    type="number"
                    placeholder={units === 'metric' ? '175' : '70'}
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
              
              {/* Activity Level Selector */}
              <div className="space-y-2">
                <Label htmlFor="activityLevel" className="text-warm-text">Activity Level</Label>
                <Select value={activityLevel} onValueChange={setActivityLevel}>
                  <SelectTrigger className="bg-ceramic-base border-ceramic-rim">
                    <SelectValue placeholder="Select your activity level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sedentary">
                      <div className="flex flex-col">
                        <span className="font-medium">Sedentary</span>
                        <span className="text-xs text-muted-foreground">Little or no exercise</span>
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

        {/* Archived Conversations */}
        <Card className="p-6 bg-ceramic-plate border-ceramic-rim">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Archive className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-warm-text">Archived Conversations</h3>
            </div>
            
            {archiveLoading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                <p className="text-sm text-muted-foreground mt-2">Loading archived conversations...</p>
              </div>
            ) : archivedConversations.length > 0 ? (
              <div className="space-y-3">
                <div className="bg-accent/20 p-3 rounded-lg">
                  <p className="text-xs text-muted-foreground">
                    {archivedConversations.length} archived conversation{archivedConversations.length !== 1 ? 's' : ''} available
                  </p>
                </div>
                
                <ScrollArea className="h-48">
                  <div className="space-y-2">
                    {archivedConversations.map((conv) => (
                      <div key={conv.id} className="flex items-center justify-between p-3 bg-ceramic-base border border-ceramic-rim rounded-lg">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <MessageSquare className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            <p className="text-sm font-medium text-warm-text truncate">
                              {conv.title}
                            </p>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {conv.messages.length} message{conv.messages.length !== 1 ? 's' : ''} • {conv.last_message_at.toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => restoreConversation(conv.id)}
                            className="h-8 w-8 p-0"
                            title="Restore conversation"
                          >
                            <Archive className="w-3 h-3" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                                title="Delete permanently"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Archived Conversation</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to permanently delete this archived conversation? 
                                  This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteArchivedConversation(conv.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete Forever
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            ) : (
              <div className="text-center py-6">
                <Archive className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No archived conversations</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Archive conversations from AI Chat to keep them for reference
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* Data Management */}
        <Card className="p-6 bg-ceramic-plate border-ceramic-rim">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Database className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-warm-text">Data Management</h3>
            </div>
            
            <div className="space-y-3">
              <div className="bg-accent/20 p-3 rounded-lg">
                <p className="text-xs text-muted-foreground">
                  Manage your personal data and history. Cleared data is soft-deleted and may be recoverable.
                </p>
              </div>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full bg-ceramic-base border-ceramic-rim hover:bg-destructive/10 hover:border-destructive/20 hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear Walking History
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Clear Walking History</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to clear all your walking session history? 
                      This will remove all walking sessions from your dashboard and statistics.
                      Data is soft-deleted and may be recoverable by contacting support.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleClearWalkingHistory}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Clear History
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </Card>

        {/* Account */}
        <Card className="p-6 bg-ceramic-plate border-ceramic-rim">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <User className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-warm-text">Account</h3>
            </div>
            
            <div className="space-y-3">
              {user ? (
                <>
                  <div className="bg-green-500/10 border border-green-500/20 p-3 rounded-lg">
                    <p className="text-sm text-green-600 dark:text-green-400">
                      ✅ Signed in as {user.email}
                    </p>
                  </div>
                  
                  <Button
                    variant="outline"
                    className="w-full bg-ceramic-base border-ceramic-rim hover:bg-destructive/10 hover:border-destructive/20 hover:text-destructive"
                    onClick={signOut}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </Button>
                </>
              ) : (
                <div className="bg-accent/20 p-3 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Sign in to sync your data across devices and access premium features.
                  </p>
                </div>
              )}
            </div>
          </div>
        </Card>

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
                FastNow - Your mindful app
              </p>
            </div>
            
            <ClearCacheButton />
            
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