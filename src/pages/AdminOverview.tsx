import { useState, useEffect } from 'react';
import { Users, Settings, Key, BarChart3, DollarSign, Eye, EyeOff, Smartphone, Image, Brain, MessageSquare, Sliders, Plus, AlertTriangle, CreditCard, MessageCircle, AlertCircle, TrendingUp, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { RealApiUsageStats } from '@/components/RealApiUsageStats';
import { AdminTierStats } from '@/components/AdminTierStats';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';

interface User {
  id: string;
  user_id: string;
  display_name: string | null;
  is_paid_user: boolean;
  monthly_ai_requests: number;
  ai_requests_reset_date: string;
  created_at: string;
}

interface UsageStats {
  total_users: number;
  paid_users: number;
  total_ai_requests: number;
  monthly_ai_requests: number;
  users_at_free_limit: number;
  users_near_premium_limit: number;
  conversion_opportunities: number;
  free_users_exhausted: number;
  premium_users_over_80_percent: number;
}

interface AISettings {
  system_prompt: string;
  model_name: string;
  temperature: number;
  max_tokens: number;
  include_user_context: boolean;
  response_style: string;
  prompt_templates: Array<{
    name: string;
    prompt: string;
  }>;
}

interface AIBehaviorSettings {
  weak_moment_keywords: string[];
  motivator_suggestion_frequency: number;
  coaching_encouragement_level: number;
  auto_motivator_triggers: boolean;
  slideshow_transition_time: number;
  crisis_style?: 'direct' | 'motivational' | 'tough_love' | 'psychological';
  admin_motivator_templates: Array<{
    id: string;
    title: string;
    description: string;
    category: string;
    imageUrl?: string;
  }>;
}

interface ImageGenerationSettings {
  style_prompt: string;
  image_model: string;
  image_size: string;
  image_quality: string;
}

const AdminOverview = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [sharedApiKey, setSharedApiKey] = useState('');
  const [stripeApiKey, setStripeApiKey] = useState('');
  const [isKeyVisible, setIsKeyVisible] = useState(false);
  const [isStripeKeyVisible, setIsStripeKeyVisible] = useState(false);
  const [pwaSettings, setPwaSettings] = useState({
    app_name: '',
    short_name: '',
    description: '',
    theme_color: '#8B7355',
    background_color: '#F5F2EA'
  });
  const [brandColors, setBrandColors] = useState({
    primary: '140 35% 45%',
    primary_hover: '140 35% 40%',
    accent: '140 25% 85%'
  });
  const [usageStats, setUsageStats] = useState<UsageStats>({
    total_users: 0,
    paid_users: 0,
    total_ai_requests: 0,
    monthly_ai_requests: 0,
    users_at_free_limit: 0,
    users_near_premium_limit: 0,
    conversion_opportunities: 0,
    free_users_exhausted: 0,
    premium_users_over_80_percent: 0,
  });
  const [aiSettings, setAiSettings] = useState<AISettings>({
    system_prompt: '',
    model_name: 'gpt-4o-mini',
    temperature: 0.8,
    max_tokens: 500,
    include_user_context: true,
    response_style: 'encouraging',
    prompt_templates: []
  });
  const [aiBehaviorSettings, setAiBehaviorSettings] = useState<AIBehaviorSettings>({
    weak_moment_keywords: [],
    motivator_suggestion_frequency: 3,
    coaching_encouragement_level: 7,
    auto_motivator_triggers: true,
    slideshow_transition_time: 15,
    admin_motivator_templates: []
  });
  const [imageGenSettings, setImageGenSettings] = useState<ImageGenerationSettings>({
    style_prompt: "Create a clean, modern cartoon-style illustration with soft colors, rounded edges, and a warm, encouraging aesthetic. Focus on themes of personal growth, motivation, weight loss, and healthy lifestyle. Use gentle pastel colors with light gray and green undertones that complement a ceramic-like design. The style should be simple, uplifting, and relatable to people on a wellness journey. Avoid dark themes, futuristic elements, or overly complex designs.",
    image_model: "dall-e-3",
    image_size: "1024x1024",
    image_quality: "hd"
  });
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [monthlyRequestLimit, setMonthlyRequestLimit] = useState('1000');
  const [freeRequestLimit, setFreeRequestLimit] = useState('15');
  const [crisisTriggerHours, setCrisisTriggerHours] = useState('24');
  const [updateLimitsLoading, setUpdateLimitsLoading] = useState(false);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [appIconFile, setAppIconFile] = useState<File | null>(null);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  const [uploadingAppIcon, setUploadingAppIcon] = useState(false);
  const [apiUsageStats, setApiUsageStats] = useState<any[]>([]);
  const [aiResponseLength, setAiResponseLength] = useState('medium');
  const [currentFaviconUrl, setCurrentFaviconUrl] = useState('');
  const [currentAppIconUrl, setCurrentAppIconUrl] = useState('');
  const [showUsageStats, setShowUsageStats] = useState(false);
  
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      
      // Fetch users
      const { data: usersData, error: usersError } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;
      setUsers(usersData || []);

      // Fetch API key
      const { data: apiKeyData, error: apiKeyError } = await supabase
        .from('admin_settings')
        .select('setting_value')
        .eq('setting_key', 'shared_api_key')
        .single();

      if (!apiKeyError && apiKeyData) {
        setSharedApiKey(apiKeyData.setting_value);
      }

      // Fetch Stripe API key
      const { data: stripeKeyData, error: stripeKeyError } = await supabase
        .from('admin_settings')
        .select('setting_value')
        .eq('setting_key', 'stripe_api_key')
        .single();

      if (!stripeKeyError && stripeKeyData) {
        setStripeApiKey(stripeKeyData.setting_value);
      }

      // Fetch PWA settings
      const { data: pwaData, error: pwaError } = await supabase
        .from('admin_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['app_name', 'short_name', 'description', 'theme_color', 'background_color']);

      if (!pwaError && pwaData) {
        const pwaObj = pwaData.reduce((acc, item) => {
          acc[item.setting_key] = item.setting_value;
          return acc;
        }, {} as any);
        setPwaSettings(prev => ({ ...prev, ...pwaObj }));
      }

      // Fetch brand colors
      const { data: colorData, error: colorError } = await supabase
        .from('admin_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['primary_color', 'primary_hover_color', 'accent_color']);

      if (!colorError && colorData) {
        const colorObj = colorData.reduce((acc, item) => {
          const key = item.setting_key.replace('_color', '').replace('primary_hover', 'primary_hover');
          acc[key] = item.setting_value;
          return acc;
        }, {} as any);
        setBrandColors(prev => ({ ...prev, ...colorObj }));
      }

      // Fetch usage stats
      await fetchUsageStats();

      // Fetch AI settings
      const { data: aiData, error: aiError } = await supabase
        .from('admin_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['system_prompt', 'model_name', 'temperature', 'max_tokens', 'include_user_context', 'response_style']);

      if (!aiError && aiData) {
        const aiObj = aiData.reduce((acc, item) => {
          let value = item.setting_value;
          if (item.setting_key === 'temperature') value = parseFloat(value);
          if (item.setting_key === 'max_tokens') value = parseInt(value);
          if (item.setting_key === 'include_user_context') value = value === 'true';
          acc[item.setting_key] = value;
          return acc;
        }, {} as any);
        setAiSettings(prev => ({ ...prev, ...aiObj }));
      }

      // Fetch AI behavior settings
      const { data: behaviorData, error: behaviorError } = await supabase
        .from('admin_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['weak_moment_keywords', 'motivator_suggestion_frequency', 'coaching_encouragement_level', 'auto_motivator_triggers', 'slideshow_transition_time', 'crisis_style']);

      if (!behaviorError && behaviorData) {
        const behaviorObj = behaviorData.reduce((acc, item) => {
          let value = item.setting_value;
          if (item.setting_key === 'weak_moment_keywords') {
            value = value ? JSON.parse(value) : [];
          } else if (item.setting_key === 'motivator_suggestion_frequency') {
            value = parseInt(value) || 3;
          } else if (item.setting_key === 'coaching_encouragement_level') {
            value = parseInt(value) || 7;
          } else if (item.setting_key === 'auto_motivator_triggers') {
            value = value === 'true';
          } else if (item.setting_key === 'slideshow_transition_time') {
            value = parseInt(value) || 15;
          }
          acc[item.setting_key] = value;
          return acc;
        }, {} as any);
        setAiBehaviorSettings(prev => ({ ...prev, ...behaviorObj }));
      }

      // Fetch image generation settings
      const { data: imageData, error: imageError } = await supabase
        .from('admin_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['style_prompt', 'image_model', 'image_size', 'image_quality']);

      if (!imageError && imageData) {
        const imageObj = imageData.reduce((acc, item) => {
          acc[item.setting_key] = item.setting_value;
          return acc;
        }, {} as any);
        setImageGenSettings(prev => ({ ...prev, ...imageObj }));
      }

      // Fetch request limits
      const { data: limitsData, error: limitsError } = await supabase
        .from('admin_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['monthly_request_limit', 'free_request_limit', 'crisis_trigger_hours']);

      if (!limitsError && limitsData) {
        limitsData.forEach(item => {
          if (item.setting_key === 'monthly_request_limit') {
            setMonthlyRequestLimit(item.setting_value || '1000');
          } else if (item.setting_key === 'free_request_limit') {
            setFreeRequestLimit(item.setting_value || '15');
          } else if (item.setting_key === 'crisis_trigger_hours') {
            setCrisisTriggerHours(item.setting_value || '24');
          }
        });
      }

      // Fetch current favicon and app icon URLs
      const { data: iconData, error: iconError } = await supabase
        .from('admin_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['favicon_url', 'app_icon_url']);

      if (!iconError && iconData) {
        iconData.forEach(item => {
          if (item.setting_key === 'favicon_url') {
            setCurrentFaviconUrl(item.setting_value || '');
          } else if (item.setting_key === 'app_icon_url') {
            setCurrentAppIconUrl(item.setting_value || '');
          }
        });
      }

    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast({
        title: "Error",
        description: "Failed to load admin data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUsageStats = async () => {
    try {
      const { data, error } = await supabase.rpc('get_usage_stats');
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        setUsageStats(data[0]);
      }
    } catch (error) {
      console.error('Error fetching usage stats:', error);
    }
  };

  const saveApiKey = async () => {
    try {
      const { error } = await supabase
        .from('admin_settings')
        .upsert({
          setting_key: 'shared_api_key',
          setting_value: sharedApiKey,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "API key saved successfully",
      });
    } catch (error) {
      console.error('Error saving API key:', error);
      toast({
        title: "Error",
        description: "Failed to save API key",
        variant: "destructive",
      });
    }
  };

  const saveStripeApiKey = async () => {
    try {
      const { error } = await supabase
        .from('admin_settings')
        .upsert({
          setting_key: 'stripe_api_key',
          setting_value: stripeApiKey,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Stripe API key saved successfully",
      });
    } catch (error) {
      console.error('Error saving Stripe API key:', error);
      toast({
        title: "Error",
        description: "Failed to save Stripe API key",
        variant: "destructive",
      });
    }
  };

  const savePwaSettings = async () => {
    try {
      const settings = Object.entries(pwaSettings).map(([key, value]) => ({
        setting_key: key,
        setting_value: value,
      }));

      const { error } = await supabase
        .from('admin_settings')
        .upsert(settings);

      if (error) throw error;

      toast({
        title: "Success",
        description: "PWA settings saved successfully",
      });
    } catch (error) {
      console.error('Error saving PWA settings:', error);
      toast({
        title: "Error",
        description: "Failed to save PWA settings",
        variant: "destructive",
      });
    }
  };

  const saveBrandColors = async () => {
    try {
      const colorSettings = [
        { setting_key: 'primary_color', setting_value: brandColors.primary },
        { setting_key: 'primary_hover_color', setting_value: brandColors.primary_hover },
        { setting_key: 'accent_color', setting_value: brandColors.accent },
      ];

      const { error } = await supabase
        .from('admin_settings')
        .upsert(colorSettings);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Brand colors saved successfully",
      });
    } catch (error) {
      console.error('Error saving brand colors:', error);
      toast({
        title: "Error",
        description: "Failed to save brand colors",
        variant: "destructive",
      });
    }
  };

  const saveAiSettings = async () => {
    try {
      const settings = Object.entries(aiSettings).map(([key, value]) => ({
        setting_key: key,
        setting_value: typeof value === 'object' ? JSON.stringify(value) : String(value),
      }));

      const { error } = await supabase
        .from('admin_settings')
        .upsert(settings);

      if (error) throw error;

      toast({
        title: "Success",
        description: "AI settings saved successfully",
      });
    } catch (error) {
      console.error('Error saving AI settings:', error);
      toast({
        title: "Error",
        description: "Failed to save AI settings",
        variant: "destructive",
      });
    }
  };

  const saveAiBehaviorSettings = async () => {
    try {
      const settings = Object.entries(aiBehaviorSettings).map(([key, value]) => ({
        setting_key: key,
        setting_value: typeof value === 'object' ? JSON.stringify(value) : String(value),
      }));

      const { error } = await supabase
        .from('admin_settings')
        .upsert(settings);

      if (error) throw error;

      toast({
        title: "Success",
        description: "AI behavior settings saved successfully",
      });
    } catch (error) {
      console.error('Error saving AI behavior settings:', error);
      toast({
        title: "Error",
        description: "Failed to save AI behavior settings",
        variant: "destructive",
      });
    }
  };

  const saveImageGenerationSettings = async () => {
    try {
      const settings = Object.entries(imageGenSettings).map(([key, value]) => ({
        setting_key: key,
        setting_value: value,
      }));

      const { error } = await supabase
        .from('admin_settings')
        .upsert(settings);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Image generation settings saved successfully",
      });
    } catch (error) {
      console.error('Error saving image generation settings:', error);
      toast({
        title: "Error",
        description: "Failed to save image generation settings",
        variant: "destructive",
      });
    }
  };

  const updateRequestLimits = async () => {
    try {
      setUpdateLimitsLoading(true);
      
      const settings = [
        { setting_key: 'monthly_request_limit', setting_value: monthlyRequestLimit },
        { setting_key: 'free_request_limit', setting_value: freeRequestLimit },
        { setting_key: 'crisis_trigger_hours', setting_value: crisisTriggerHours },
      ];

      const { error } = await supabase
        .from('admin_settings')
        .upsert(settings);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Request limits updated successfully",
      });
    } catch (error) {
      console.error('Error updating request limits:', error);
      toast({
        title: "Error",
        description: "Failed to update request limits",
        variant: "destructive",
      });
    } finally {
      setUpdateLimitsLoading(false);
    }
  };

  const uploadFavicon = async () => {
    if (!faviconFile) return;

    try {
      setUploadingFavicon(true);
      
      const fileExt = faviconFile.name.split('.').pop();
      const fileName = `favicon.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('app-assets')
        .upload(fileName, faviconFile, { upsert: true });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('app-assets')
        .getPublicUrl(fileName);

      await supabase
        .from('admin_settings')
        .upsert({
          setting_key: 'favicon_url',
          setting_value: publicUrl,
        });

      setCurrentFaviconUrl(publicUrl);
      setFaviconFile(null);

      toast({
        title: "Success",
        description: "Favicon uploaded successfully",
      });
    } catch (error) {
      console.error('Error uploading favicon:', error);
      toast({
        title: "Error",
        description: "Failed to upload favicon",
        variant: "destructive",
      });
    } finally {
      setUploadingFavicon(false);
    }
  };

  const uploadAppIcon = async () => {
    if (!appIconFile) return;

    try {
      setUploadingAppIcon(true);
      
      const fileExt = appIconFile.name.split('.').pop();
      const fileName = `app-icon.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('app-assets')
        .upload(fileName, appIconFile, { upsert: true });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('app-assets')
        .getPublicUrl(fileName);

      await supabase
        .from('admin_settings')
        .upsert({
          setting_key: 'app_icon_url',
          setting_value: publicUrl,
        });

      setCurrentAppIconUrl(publicUrl);
      setAppIconFile(null);

      toast({
        title: "Success",
        description: "App icon uploaded successfully",
      });
    } catch (error) {
      console.error('Error uploading app icon:', error);
      toast({
        title: "Error",
        description: "Failed to upload app icon",
        variant: "destructive",
      });
    } finally {
      setUploadingAppIcon(false);
    }
  };

  const addWeakMomentKeyword = () => {
    const keyword = prompt('Enter a weak moment keyword:');
    if (keyword && keyword.trim()) {
      setAiBehaviorSettings(prev => ({
        ...prev,
        weak_moment_keywords: [...prev.weak_moment_keywords, keyword.trim()]
      }));
    }
  };

  const removeWeakMomentKeyword = (index: number) => {
    setAiBehaviorSettings(prev => ({
      ...prev,
      weak_moment_keywords: prev.weak_moment_keywords.filter((_, i) => i !== index)
    }));
  };

  const addPromptTemplate = () => {
    const name = prompt('Enter template name:');
    if (name && name.trim()) {
      const prompt = prompt('Enter template prompt:');
      if (prompt && prompt.trim()) {
        setAiSettings(prev => ({
          ...prev,
          prompt_templates: [...prev.prompt_templates, { name: name.trim(), prompt: prompt.trim() }]
        }));
      }
    }
  };

  const removePromptTemplate = (index: number) => {
    setAiSettings(prev => ({
      ...prev,
      prompt_templates: prev.prompt_templates.filter((_, i) => i !== index)
    }));
  };

  const addMotivatorTemplate = () => {
    const title = prompt('Enter motivator title:');
    if (title && title.trim()) {
      const description = prompt('Enter motivator description:');
      if (description && description.trim()) {
        const category = prompt('Enter category:');
        if (category && category.trim()) {
          const newTemplate = {
            id: Date.now().toString(),
            title: title.trim(),
            description: description.trim(),
            category: category.trim(),
            imageUrl: ''
          };
          setAiBehaviorSettings(prev => ({
            ...prev,
            admin_motivator_templates: [...prev.admin_motivator_templates, newTemplate]
          }));
        }
      }
    }
  };

  const removeMotivatorTemplate = (id: string) => {
    setAiBehaviorSettings(prev => ({
      ...prev,
      admin_motivator_templates: prev.admin_motivator_templates.filter(template => template.id !== id)
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-ceramic-base px-4 pt-8 pb-32 safe-bottom flex items-center justify-center">
        <div className="text-warm-text">Loading admin dashboard...</div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-ceramic-base px-4 pt-8 pb-32 safe-bottom">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-warm-text">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage users and system settings</p>
          </div>

          {/* Usage Stats - Now using AdminTierStats component */}
          <AdminTierStats />

          {/* Quick Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4 bg-ceramic-plate border-ceramic-rim">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold text-warm-text">{usageStats.total_users}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-ceramic-plate border-ceramic-rim">
              <div className="flex items-center space-x-2">
                <CreditCard className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Paid Users</p>
                  <p className="text-2xl font-bold text-warm-text">{usageStats.paid_users}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-ceramic-plate border-ceramic-rim">
              <div className="flex items-center space-x-2">
                <Brain className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm text-muted-foreground">AI Requests</p>
                  <p className="text-2xl font-bold text-warm-text">{usageStats.monthly_ai_requests}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-ceramic-plate border-ceramic-rim">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-orange-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Conversions</p>
                  <p className="text-2xl font-bold text-warm-text">{usageStats.conversion_opportunities}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* API Usage Stats Toggle */}
          <Card className="p-6 bg-ceramic-plate border-ceramic-rim">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-warm-text flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Real-time API Usage
              </h3>
              <Button
                onClick={() => setShowUsageStats(!showUsageStats)}
                variant="outline"
                size="sm"
                className="border-ceramic-rim"
              >
                {showUsageStats ? 'Hide' : 'Show'} Usage Stats
              </Button>
            </div>
            
            {showUsageStats && <RealApiUsageStats />}
          </Card>

          {/* API Keys Management */}
          <Card className="p-6 bg-ceramic-plate border-ceramic-rim">
            <h3 className="text-lg font-semibold text-warm-text mb-4 flex items-center gap-2">
              <Key className="w-5 h-5" />
              API Keys Management
            </h3>
            
            <div className="space-y-4">
              {/* OpenAI API Key */}
              <div>
                <Label htmlFor="api-key" className="text-warm-text">OpenAI API Key</Label>
                <div className="flex gap-2 mt-1">
                  <div className="relative flex-1">
                    <Input
                      id="api-key"
                      type={isKeyVisible ? "text" : "password"}
                      value={sharedApiKey}
                      onChange={(e) => setSharedApiKey(e.target.value)}
                      placeholder="Enter OpenAI API key"
                      className="bg-ceramic-base border-ceramic-rim pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setIsKeyVisible(!isKeyVisible)}
                    >
                      {isKeyVisible ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <Button onClick={saveApiKey} className="bg-primary hover:bg-primary/90">
                    Save
                  </Button>
                </div>
              </div>

              {/* Stripe API Key */}
              <div>
                <Label htmlFor="stripe-key" className="text-warm-text">Stripe API Key</Label>
                <div className="flex gap-2 mt-1">
                  <div className="relative flex-1">
                    <Input
                      id="stripe-key"
                      type={isStripeKeyVisible ? "text" : "password"}
                      value={stripeApiKey}
                      onChange={(e) => setStripeApiKey(e.target.value)}
                      placeholder="Enter Stripe API key"
                      className="bg-ceramic-base border-ceramic-rim pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setIsStripeKeyVisible(!isStripeKeyVisible)}
                    >
                      {isStripeKeyVisible ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <Button onClick={saveStripeApiKey} className="bg-primary hover:bg-primary/90">
                    Save
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Subscription Settings */}
          <Card className="p-6 bg-ceramic-plate border-ceramic-rim">
            <h3 className="text-lg font-semibold text-warm-text mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Subscription Settings
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-warm-text">Monthly Request Limit (Premium Users)</Label>
                <Input
                  type="number"
                  value={monthlyRequestLimit}
                  onChange={(e) => setMonthlyRequestLimit(e.target.value)}
                  className="bg-ceramic-base border-ceramic-rim"
                  min="100"
                  max="10000"
                  step="100"
                />
              </div>
              
              <div>
                <Label className="text-warm-text">Free Request Limit (New Users)</Label>
                <Input
                  type="number"
                  value={freeRequestLimit}
                  onChange={(e) => setFreeRequestLimit(e.target.value)}
                  className="bg-ceramic-base border-ceramic-rim"
                  min="5"
                  max="100"
                  step="5"
                />
              </div>
              
              <div>
                <Label className="text-warm-text">Crisis Trigger (Hours)</Label>
                <Input
                  type="number"
                  value={crisisTriggerHours}
                  onChange={(e) => setCrisisTriggerHours(e.target.value)}
                  className="bg-ceramic-base border-ceramic-rim"
                  min="1"
                  max="168"
                  step="1"
                />
              </div>
            </div>
            
            <Button
              onClick={updateRequestLimits}
              disabled={updateLimitsLoading}
              className="bg-primary hover:bg-primary/90 mt-4"
            >
              {updateLimitsLoading ? 'Saving...' : 'Save Subscription Settings'}
            </Button>
          </Card>

          {/* PWA Settings */}
          <Card className="p-6 bg-ceramic-plate border-ceramic-rim">
            <h3 className="text-lg font-semibold text-warm-text mb-4 flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              PWA Settings
            </h3>
            
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <Label htmlFor="app_name">App Name</Label>
                <Input
                  id="app_name"
                  value={pwaSettings.app_name}
                  onChange={(e) => setPwaSettings(prev => ({ ...prev, app_name: e.target.value }))}
                  className="bg-ceramic-base border-ceramic-rim"
                />
              </div>
              
              <div>
                <Label htmlFor="short_name">Short Name</Label>
                <Input
                  id="short_name"
                  value={pwaSettings.short_name}
                  onChange={(e) => setPwaSettings(prev => ({ ...prev, short_name: e.target.value }))}
                  className="bg-ceramic-base border-ceramic-rim"
                />
              </div>
              
              <div className="md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={pwaSettings.description}
                  onChange={(e) => setPwaSettings(prev => ({ ...prev, description: e.target.value }))}
                  className="bg-ceramic-base border-ceramic-rim"
                />
              </div>
              
              <div>
                <Label htmlFor="theme_color">Theme Color</Label>
                <Input
                  id="theme_color"
                  type="color"
                  value={pwaSettings.theme_color}
                  onChange={(e) => setPwaSettings(prev => ({ ...prev, theme_color: e.target.value }))}
                  className="bg-ceramic-base border-ceramic-rim h-10"
                />
              </div>
              
              <div>
                <Label htmlFor="background_color">Background Color</Label>
                <Input
                  id="background_color"
                  type="color"
                  value={pwaSettings.background_color}
                  onChange={(e) => setPwaSettings(prev => ({ ...prev, background_color: e.target.value }))}
                  className="bg-ceramic-base border-ceramic-rim h-10"
                />
              </div>
            </div>

            {/* Icon Upload Section */}
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <Label>Favicon Upload</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    type="file"
                    accept=".ico,.png,.jpg,.jpeg"
                    onChange={(e) => setFaviconFile(e.target.files?.[0] || null)}
                    className="bg-ceramic-base border-ceramic-rim"
                  />
                  <Button
                    onClick={uploadFavicon}
                    disabled={!faviconFile || uploadingFavicon}
                    size="sm"
                    className="bg-primary hover:bg-primary/90"
                  >
                    {uploadingFavicon ? 'Uploading...' : 'Upload'}
                  </Button>
                </div>
                {currentFaviconUrl && (
                  <div className="mt-2 flex items-center gap-2">
                    <img src={currentFaviconUrl} alt="Current favicon" className="w-6 h-6" />
                    <span className="text-sm text-muted-foreground">Current favicon</span>
                  </div>
                )}
              </div>

              <div>
                <Label>App Icon Upload</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    type="file"
                    accept=".png,.jpg,.jpeg"
                    onChange={(e) => setAppIconFile(e.target.files?.[0] || null)}
                    className="bg-ceramic-base border-ceramic-rim"
                  />
                  <Button
                    onClick={uploadAppIcon}
                    disabled={!appIconFile || uploadingAppIcon}
                    size="sm"
                    className="bg-primary hover:bg-primary/90"
                  >
                    {uploadingAppIcon ? 'Uploading...' : 'Upload'}
                  </Button>
                </div>
                {currentAppIconUrl && (
                  <div className="mt-2 flex items-center gap-2">
                    <img src={currentAppIconUrl} alt="Current app icon" className="w-12 h-12 rounded" />
                    <span className="text-sm text-muted-foreground">Current app icon</span>
                  </div>
                )}
              </div>
            </div>
            
            <Button onClick={savePwaSettings} className="bg-primary hover:bg-primary/90">
              Save PWA Settings
            </Button>
          </Card>

          {/* Brand Colors */}
          <Card className="p-6 bg-ceramic-plate border-ceramic-rim">
            <h3 className="text-lg font-semibold text-warm-text mb-4">Brand Colors</h3>
            
            <div className="grid md:grid-cols-3 gap-4 mb-4">
              <div>
                <Label htmlFor="primary_color">Primary Color (HSL)</Label>
                <Input
                  id="primary_color"
                  value={brandColors.primary}
                  onChange={(e) => setBrandColors(prev => ({ ...prev, primary: e.target.value }))}
                  placeholder="140 35% 45%"
                  className="bg-ceramic-base border-ceramic-rim"
                />
              </div>
              
              <div>
                <Label htmlFor="primary_hover_color">Primary Hover Color (HSL)</Label>
                <Input
                  id="primary_hover_color"
                  value={brandColors.primary_hover}
                  onChange={(e) => setBrandColors(prev => ({ ...prev, primary_hover: e.target.value }))}
                  placeholder="140 35% 40%"
                  className="bg-ceramic-base border-ceramic-rim"
                />
              </div>
              
              <div>
                <Label htmlFor="accent_color">Accent Color (HSL)</Label>
                <Input
                  id="accent_color"
                  value={brandColors.accent}
                  onChange={(e) => setBrandColors(prev => ({ ...prev, accent: e.target.value }))}
                  placeholder="140 25% 85%"
                  className="bg-ceramic-base border-ceramic-rim"
                />
              </div>
            </div>
            
            <Button onClick={saveBrandColors} className="bg-primary hover:bg-primary/90">
              Save Brand Colors
            </Button>
          </Card>

          {/* AI Settings */}
          <Card className="p-6 bg-ceramic-plate border-ceramic-rim">
            <h3 className="text-lg font-semibold text-warm-text mb-4 flex items-center gap-2">
              <Brain className="w-5 h-5" />
              AI Settings
            </h3>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="system_prompt">System Prompt</Label>
                <Textarea
                  id="system_prompt"
                  value={aiSettings.system_prompt}
                  onChange={(e) => setAiSettings(prev => ({ ...prev, system_prompt: e.target.value }))}
                  rows={4}
                  className="bg-ceramic-base border-ceramic-rim"
                  placeholder="Enter the system prompt for AI responses..."
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="model_name">Model Name</Label>
                  <Select value={aiSettings.model_name} onValueChange={(value) => setAiSettings(prev => ({ ...prev, model_name: value }))}>
                    <SelectTrigger className="bg-ceramic-base border-ceramic-rim">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                      <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                      <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                      <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="response_style">Response Style</Label>
                  <Select value={aiSettings.response_style} onValueChange={(value) => setAiSettings(prev => ({ ...prev, response_style: value }))}>
                    <SelectTrigger className="bg-ceramic-base border-ceramic-rim">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="encouraging">Encouraging</SelectItem>
                      <SelectItem value="direct">Direct</SelectItem>
                      <SelectItem value="motivational">Motivational</SelectItem>
                      <SelectItem value="supportive">Supportive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="temperature">Temperature: {aiSettings.temperature}</Label>
                  <Slider
                    value={[aiSettings.temperature]}
                    onValueChange={(value) => setAiSettings(prev => ({ ...prev, temperature: value[0] }))}
                    max={2}
                    min={0}
                    step={0.1}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="max_tokens">Max Tokens</Label>
                  <Input
                    id="max_tokens"
                    type="number"
                    value={aiSettings.max_tokens}
                    onChange={(e) => setAiSettings(prev => ({ ...prev, max_tokens: parseInt(e.target.value) }))}
                    className="bg-ceramic-base border-ceramic-rim"
                    min="100"
                    max="4000"
                    step="50"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="include_user_context"
                  checked={aiSettings.include_user_context}
                  onCheckedChange={(checked) => setAiSettings(prev => ({ ...prev, include_user_context: checked }))}
                />
                <Label htmlFor="include_user_context">Include User Context in Responses</Label>
              </div>

              {/* Prompt Templates */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Prompt Templates</Label>
                  <Button onClick={addPromptTemplate} size="sm" variant="outline" className="border-ceramic-rim">
                    <Plus className="w-4 h-4 mr-1" />
                    Add Template
                  </Button>
                </div>
                <div className="space-y-2">
                  {aiSettings.prompt_templates.map((template, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-ceramic-base rounded border border-ceramic-rim">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{template.name}</div>
                        <div className="text-xs text-muted-foreground truncate">{template.prompt}</div>
                      </div>
                      <Button
                        onClick={() => removePromptTemplate(index)}
                        size="sm"
                        variant="ghost"
                        className="text-red-500 hover:text-red-700"
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <Button onClick={saveAiSettings} className="bg-primary hover:bg-primary/90">
                Save AI Settings
              </Button>
            </div>
          </Card>

          {/* AI Behavior Settings */}
          <Card className="p-6 bg-ceramic-plate border-ceramic-rim">
            <h3 className="text-lg font-semibold text-warm-text mb-4 flex items-center gap-2">
              <Sliders className="w-5 h-5" />
              AI Behavior Settings
            </h3>
            
            <div className="space-y-4">
              {/* Weak Moment Keywords */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Weak Moment Keywords</Label>
                  <Button onClick={addWeakMomentKeyword} size="sm" variant="outline" className="border-ceramic-rim">
                    <Plus className="w-4 h-4 mr-1" />
                    Add Keyword
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {aiBehaviorSettings.weak_moment_keywords.map((keyword, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {keyword}
                      <button
                        onClick={() => removeWeakMomentKeyword(index)}
                        className="ml-1 text-red-500 hover:text-red-700"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Motivator Suggestion Frequency: {aiBehaviorSettings.motivator_suggestion_frequency}</Label>
                  <Slider
                    value={[aiBehaviorSettings.motivator_suggestion_frequency]}
                    onValueChange={(value) => setAiBehaviorSettings(prev => ({ ...prev, motivator_suggestion_frequency: value[0] }))}
                    max={10}
                    min={1}
                    step={1}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>Coaching Encouragement Level: {aiBehaviorSettings.coaching_encouragement_level}</Label>
                  <Slider
                    value={[aiBehaviorSettings.coaching_encouragement_level]}
                    onValueChange={(value) => setAiBehaviorSettings(prev => ({ ...prev, coaching_encouragement_level: value[0] }))}
                    max={10}
                    min={1}
                    step={1}
                    className="mt-2"
                  />
                </div>
              </div>

              <div>
                <Label>Slideshow Transition Time (seconds): {aiBehaviorSettings.slideshow_transition_time}</Label>
                <Slider
                  value={[aiBehaviorSettings.slideshow_transition_time]}
                  onValueChange={(value) => setAiBehaviorSettings(prev => ({ ...prev, slideshow_transition_time: value[0] }))}
                  max={60}
                  min={5}
                  step={5}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="crisis_style">Crisis Response Style</Label>
                <Select value={aiBehaviorSettings.crisis_style || 'motivational'} onValueChange={(value) => setAiBehaviorSettings(prev => ({ ...prev, crisis_style: value as any }))}>
                  <SelectTrigger className="bg-ceramic-base border-ceramic-rim">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="direct">Direct</SelectItem>
                    <SelectItem value="motivational">Motivational</SelectItem>
                    <SelectItem value="tough_love">Tough Love</SelectItem>
                    <SelectItem value="psychological">Psychological</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="auto_motivator_triggers"
                  checked={aiBehaviorSettings.auto_motivator_triggers}
                  onCheckedChange={(checked) => setAiBehaviorSettings(prev => ({ ...prev, auto_motivator_triggers: checked }))}
                />
                <Label htmlFor="auto_motivator_triggers">Enable Auto Motivator Triggers</Label>
              </div>

              {/* Admin Motivator Templates */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Admin Motivator Templates</Label>
                  <Button onClick={addMotivatorTemplate} size="sm" variant="outline" className="border-ceramic-rim">
                    <Plus className="w-4 h-4 mr-1" />
                    Add Template
                  </Button>
                </div>
                <div className="space-y-2">
                  {aiBehaviorSettings.admin_motivator_templates.map((template) => (
                    <div key={template.id} className="flex items-center gap-2 p-3 bg-ceramic-base rounded border border-ceramic-rim">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{template.title}</div>
                        <div className="text-xs text-muted-foreground">{template.description}</div>
                        <Badge variant="outline" className="mt-1 text-xs">{template.category}</Badge>
                      </div>
                      <Button
                        onClick={() => removeMotivatorTemplate(template.id)}
                        size="sm"
                        variant="ghost"
                        className="text-red-500 hover:text-red-700"
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <Button onClick={saveAiBehaviorSettings} className="bg-primary hover:bg-primary/90">
                Save AI Behavior Settings
              </Button>
            </div>
          </Card>

          {/* Image Generation Settings */}
          <Card className="p-6 bg-ceramic-plate border-ceramic-rim">
            <h3 className="text-lg font-semibold text-warm-text mb-4 flex items-center gap-2">
              <Image className="w-5 h-5" />
              Image Generation Settings
            </h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="style_prompt">Default Style Prompt</Label>
                <Textarea
                  id="style_prompt"
                  value={imageGenSettings.style_prompt}
                  onChange={(e) => setImageGenSettings(prev => ({ ...prev, style_prompt: e.target.value }))}
                  rows={4}
                  className="bg-ceramic-base border-ceramic-rim"
                  placeholder="Describe the default style for AI-generated images..."
                />
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="image_model">Image Model</Label>
                  <Select value={imageGenSettings.image_model} onValueChange={(value) => setImageGenSettings(prev => ({ ...prev, image_model: value }))}>
                    <SelectTrigger className="bg-ceramic-base border-ceramic-rim">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dall-e-3">DALL-E 3</SelectItem>
                      <SelectItem value="dall-e-2">DALL-E 2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="image_size">Image Size</Label>
                  <Select value={imageGenSettings.image_size} onValueChange={(value) => setImageGenSettings(prev => ({ ...prev, image_size: value }))}>
                    <SelectTrigger className="bg-ceramic-base border-ceramic-rim">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1024x1024">1024x1024</SelectItem>
                      <SelectItem value="1024x1792">1024x1792</SelectItem>
                      <SelectItem value="1792x1024">1792x1024</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="image_quality">Image Quality</Label>
                  <Select value={imageGenSettings.image_quality} onValueChange={(value) => setImageGenSettings(prev => ({ ...prev, image_quality: value }))}>
                    <SelectTrigger className="bg-ceramic-base border-ceramic-rim">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="hd">HD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={saveImageGenerationSettings} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                Save Image Generation Settings
              </Button>
            </div>
          </Card>

          {/* User Management */}
          <Card className="p-6 bg-ceramic-plate border-ceramic-rim">
            <h3 className="text-lg font-semibold text-warm-text mb-4 flex items-center gap-2">
              <Users className="w-5 h-5" />
              User Management
            </h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-ceramic-rim">
                    <th className="text-left p-2 text-warm-text">User</th>
                    <th className="text-left p-2 text-warm-text">Status</th>
                    <th className="text-left p-2 text-warm-text">AI Requests</th>
                    <th className="text-left p-2 text-warm-text">Reset Date</th>
                    <th className="text-left p-2 text-warm-text">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {users.slice(0, 10).map((user) => (
                    <tr key={user.id} className="border-b border-ceramic-rim/50">
                      <td className="p-2">
                        <div>
                          <div className="font-medium text-warm-text">
                            {user.display_name || 'Anonymous User'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {user.user_id.slice(0, 8)}...
                          </div>
                        </div>
                      </td>
                      <td className="p-2">
                        <Badge variant={user.is_paid_user ? "default" : "secondary"}>
                          {user.is_paid_user ? 'Premium' : 'Free'}
                        </Badge>
                      </td>
                      <td className="p-2 text-warm-text">
                        {user.monthly_ai_requests}
                      </td>
                      <td className="p-2 text-muted-foreground text-xs">
                        {new Date(user.ai_requests_reset_date).toLocaleDateString()}
                      </td>
                      <td className="p-2 text-muted-foreground text-xs">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {users.length > 10 && (
              <div className="mt-4 text-center">
                <p className="text-muted-foreground text-sm">
                  Showing 10 of {users.length} users
                </p>
              </div>
            )}
          </Card>

        </div>
      </div>
    </TooltipProvider>
  );
};

export default AdminOverview;
