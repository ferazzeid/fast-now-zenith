import { useState, useEffect } from 'react';
import { Key, Bell, User, Info, LogOut, Shield, CreditCard, Crown, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';  
import { useSubscription } from '@/hooks/useSubscription';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

const Settings = () => {
  const [openAiKey, setOpenAiKey] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isKeyVisible, setIsKeyVisible] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [useOwnKey, setUseOwnKey] = useState(true);
  const [speechModel, setSpeechModel] = useState('gpt-4o-mini-realtime');
  const [transcriptionModel, setTranscriptionModel] = useState('whisper-1');
  const [ttsModel, setTtsModel] = useState('tts-1');
  const [ttsVoice, setTtsVoice] = useState('alloy');
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const subscription = useSubscription();

  useEffect(() => {
    // Load saved API key on component mount
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
          .select('use_own_api_key, speech_model, transcription_model, tts_model, tts_voice, openai_api_key')
          .eq('user_id', user.id)
          .single();

        if (profile) {
          setUseOwnKey(profile.use_own_api_key ?? true);
          setSpeechModel(profile.speech_model || 'gpt-4o-mini-realtime');
          setTranscriptionModel(profile.transcription_model || 'whisper-1');
          setTtsModel(profile.tts_model || 'tts-1');
          setTtsVoice(profile.tts_voice || 'alloy');
          
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
      // Save API key locally if using own key
      if (useOwnKey && openAiKey.trim()) {
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
            openai_api_key: useOwnKey ? openAiKey : null
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

  return (
    <div className="min-h-screen bg-ceramic-base px-4 pt-8 pb-32">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-warm-text">Settings</h1>
          <p className="text-muted-foreground">Customize your fasting experience</p>
        </div>

        {/* AI Configuration */}
        <Card className="p-6 bg-ceramic-plate border-ceramic-rim">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Key className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-warm-text">AI Features</h3>
            </div>
            
            <div className="space-y-4">
              {/* API Key Source Selection */}
              <div className="space-y-3">
                <Label className="text-warm-text">API Key Source</Label>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      id="use-shared"
                      name="api-source"
                      checked={!useOwnKey}
                      onChange={() => setUseOwnKey(false)}
                      className="text-primary"
                    />
                    <Label htmlFor="use-shared" className="text-sm">Use shared service</Label>
                  </div>
                  {subscription.can_use_own_api_key && (
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="use-own"
                        name="api-source"
                        checked={useOwnKey}
                        onChange={() => setUseOwnKey(true)}
                        className="text-primary"
                      />
                      <Label htmlFor="use-own" className="text-sm">Use my own API key</Label>
                    </div>
                  )}
                </div>
                {!subscription.can_use_own_api_key && (
                  <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-lg">
                    <p className="text-sm text-amber-600 dark:text-amber-400 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Own API key option requires premium subscription or unused free requests
                    </p>
                  </div>
                )}
              </div>

              {/* API Key Input (only if using own key) */}
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

              {/* Model Selection */}
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
                onClick={handleSaveSettings}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Save AI Settings
              </Button>
              
              {useOwnKey && (
                <Button
                  onClick={handleClearApiKey}
                  variant="outline"
                  className="w-full bg-ceramic-base border-ceramic-rim"
                >
                  Clear API Key
                </Button>
              )}
              
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
                    'Using shared AI service. Models marked with ⭐ are the most cost-effective options.'
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

        {/* Account */}
        <Card className="p-6 bg-ceramic-plate border-ceramic-rim">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <User className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-warm-text">Account</h3>
            </div>
            
            <div className="space-y-3">
              <div className="bg-accent/20 p-3 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  🔒 Google authentication integration coming soon. 
                  Your data is currently stored locally on your device.
                </p>
              </div>
              
              <Button
                variant="outline"
                className="w-full bg-ceramic-base border-ceramic-rim"
                disabled
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out (Coming Soon)
              </Button>
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
                Fast Now - Your mindful fasting companion
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
  );
};

export default Settings;