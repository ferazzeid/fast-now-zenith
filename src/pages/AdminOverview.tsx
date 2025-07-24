import { useState, useEffect } from 'react';
import { Users, Settings, Key, BarChart3, DollarSign, Eye, EyeOff, Smartphone, Image, Brain, MessageSquare, Sliders, Plus, AlertTriangle } from 'lucide-react';
import { AdminMotivatorCreation } from '@/components/AdminMotivatorCreation';
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
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [monthlyRequestLimit, setMonthlyRequestLimit] = useState('1000');
  const [freeRequestLimit, setFreeRequestLimit] = useState('15');
  const [updateLimitsLoading, setUpdateLimitsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      // Fetch all users with profiles
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesData) {
        setUsers(profilesData);
        
        // Calculate enhanced usage stats
        const freeLimit = parseInt(freeRequestLimit || '15');
        const premiumLimit = parseInt(monthlyRequestLimit || '1000');
        
        const freeUsers = profilesData.filter(u => !u.is_paid_user);
        const premiumUsers = profilesData.filter(u => u.is_paid_user);
        
        const stats = {
          total_users: profilesData.length,
          paid_users: premiumUsers.length,
          total_ai_requests: profilesData.reduce((sum, u) => sum + (u.monthly_ai_requests || 0), 0),
          monthly_ai_requests: profilesData.reduce((sum, u) => sum + (u.monthly_ai_requests || 0), 0),
          users_at_free_limit: freeUsers.filter(u => (u.monthly_ai_requests || 0) >= freeLimit).length,
          users_near_premium_limit: premiumUsers.filter(u => (u.monthly_ai_requests || 0) >= premiumLimit * 0.8).length,
          conversion_opportunities: freeUsers.filter(u => (u.monthly_ai_requests || 0) >= freeLimit * 0.8).length,
          free_users_exhausted: freeUsers.filter(u => (u.monthly_ai_requests || 0) >= freeLimit).length,
          premium_users_over_80_percent: premiumUsers.filter(u => (u.monthly_ai_requests || 0) >= premiumLimit * 0.8).length,
        };
        setUsageStats(stats);
      }

      // Fetch shared OpenAI key
      const { data: settingsData } = await supabase
        .from('shared_settings')
        .select('setting_value')
        .eq('setting_key', 'shared_openai_key')
        .single();

      if (settingsData) {
        setSharedApiKey(settingsData.setting_value || '');
      }

      // Fetch shared Stripe key
      const { data: stripeSettingsData } = await supabase
        .from('shared_settings')
        .select('setting_value')
        .eq('setting_key', 'stripe_secret_key')
        .single();

      if (stripeSettingsData) {
        setStripeApiKey(stripeSettingsData.setting_value || '');
      }

      // Fetch PWA settings
      const { data: pwaData } = await supabase
        .from('shared_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['pwa_app_name', 'pwa_short_name', 'pwa_description', 'pwa_theme_color', 'pwa_background_color', 'brand_primary_color', 'brand_primary_hover', 'brand_accent_color']);

      if (pwaData) {
        const pwaMap = pwaData.reduce((acc, setting) => {
          acc[setting.setting_key] = setting.setting_value;
          return acc;
        }, {} as Record<string, string>);

        setPwaSettings({
          app_name: pwaMap.pwa_app_name || '',
          short_name: pwaMap.pwa_short_name || '',
          description: pwaMap.pwa_description || '',
          theme_color: pwaMap.pwa_theme_color || '#8B7355',
          background_color: pwaMap.pwa_background_color || '#F5F2EA'
        });
        
        setBrandColors({
          primary: pwaMap.brand_primary_color || '140 35% 45%',
          primary_hover: pwaMap.brand_primary_hover || '140 35% 40%',
          accent: pwaMap.brand_accent_color || '140 25% 85%'
        });
      }

      // Fetch request limits
      const { data: limitsData } = await supabase
        .from('shared_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['monthly_request_limit', 'free_request_limit']);

      if (limitsData) {
        const limitsMap = limitsData.reduce((acc, setting) => {
          acc[setting.setting_key] = setting.setting_value;
          return acc;
        }, {} as Record<string, string>);

        setMonthlyRequestLimit(limitsMap.monthly_request_limit || '1000');
        setFreeRequestLimit(limitsMap.free_request_limit || '15');
      }

      // Fetch AI settings
      const { data: aiData } = await supabase
        .from('shared_settings')
        .select('setting_key, setting_value')
        .in('setting_key', [
          'ai_system_prompt', 
          'ai_model_name', 
          'ai_temperature', 
          'ai_max_tokens', 
          'ai_include_user_context', 
          'ai_response_style',
          'ai_prompt_templates',
          'ai_weak_moment_keywords',
          'ai_motivator_suggestion_frequency',
          'ai_coaching_encouragement_level',
          'ai_auto_motivator_triggers',
          'ai_slideshow_transition_time',
          'ai_crisis_style',
          'ai_admin_motivator_templates'
        ]);

      if (aiData) {
        const aiMap = aiData.reduce((acc, setting) => {
          acc[setting.setting_key] = setting.setting_value;
          return acc;
        }, {} as Record<string, string>);

        setAiSettings({
          system_prompt: aiMap.ai_system_prompt || '',
          model_name: aiMap.ai_model_name || 'gpt-4o-mini',
          temperature: parseFloat(aiMap.ai_temperature || '0.8'),
          max_tokens: parseInt(aiMap.ai_max_tokens || '500'),
          include_user_context: aiMap.ai_include_user_context === 'true',
          response_style: aiMap.ai_response_style || 'encouraging',
          prompt_templates: aiMap.ai_prompt_templates ? JSON.parse(aiMap.ai_prompt_templates) : []
        });

        setAiBehaviorSettings({
          weak_moment_keywords: aiMap.ai_weak_moment_keywords ? JSON.parse(aiMap.ai_weak_moment_keywords) : [],
          motivator_suggestion_frequency: parseInt(aiMap.ai_motivator_suggestion_frequency || '3'),
          coaching_encouragement_level: parseInt(aiMap.ai_coaching_encouragement_level || '7'),
          auto_motivator_triggers: aiMap.ai_auto_motivator_triggers === 'true',
          slideshow_transition_time: parseInt(aiMap.ai_slideshow_transition_time || '15'),
          crisis_style: (aiMap.ai_crisis_style as any) || 'psychological',
          admin_motivator_templates: aiMap.ai_admin_motivator_templates ? JSON.parse(aiMap.ai_admin_motivator_templates) : []
        });
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const togglePaidStatus = async (userId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('profiles')
      .update({ is_paid_user: !currentStatus })
      .eq('user_id', userId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update user status",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: `User ${!currentStatus ? 'upgraded to' : 'downgraded from'} paid status`,
      });
      fetchAdminData();
    }
  };

  const resetUserUsage = async (userId: string) => {
    const { error } = await supabase
      .from('profiles')
      .update({ 
        monthly_ai_requests: 0,
        ai_requests_reset_date: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to reset user usage",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "User AI usage reset successfully",
      });
      fetchAdminData();
    }
  };

  const saveSharedApiKey = async () => {
    const { error } = await supabase
      .from('shared_settings')
      .update({ setting_value: sharedApiKey })
      .eq('setting_key', 'shared_openai_key');

    if (error) {
      toast({
        title: "Error",
        description: "Failed to save shared API key",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Shared OpenAI API key saved successfully",
      });
    }
  };

  const clearSharedApiKey = async () => {
    const { error } = await supabase
      .from('shared_settings')
      .update({ setting_value: null })
      .eq('setting_key', 'shared_openai_key');

    if (error) {
      toast({
        title: "Error",
        description: "Failed to clear shared API key",
        variant: "destructive",
      });
    } else {
      setSharedApiKey('');
      toast({
        title: "Success",
        description: "Shared OpenAI API key cleared",
      });
    }
  };

  const saveStripeApiKey = async () => {
    const { error } = await supabase
      .from('shared_settings')
      .upsert({ 
        setting_key: 'stripe_secret_key',
        setting_value: stripeApiKey 
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to save Stripe API key",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Stripe API key saved successfully",
      });
    }
  };

  const clearStripeApiKey = async () => {
    const { error } = await supabase
      .from('shared_settings')
      .update({ setting_value: null })
      .eq('setting_key', 'stripe_secret_key');

    if (error) {
      toast({
        title: "Error",
        description: "Failed to clear Stripe API key",
        variant: "destructive",
      });
    } else {
      setStripeApiKey('');
      toast({
        title: "Success",
        description: "Stripe API key cleared",
      });
    }
  };

  const savePwaSettings = async () => {
    try {
      const updates = Object.entries(pwaSettings).map(([key, value]) => ({
        setting_key: `pwa_${key}`,
        setting_value: value
      }));

      for (const update of updates) {
        await supabase
          .from('shared_settings')
          .update({ setting_value: update.setting_value })
          .eq('setting_key', update.setting_key);
      }

      toast({
        title: "Success",
        description: "PWA settings saved successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save PWA settings",
        variant: "destructive",
      });
    }
  };

  const saveBrandColors = async () => {
    try {
      const updates = [
        { setting_key: 'brand_primary_color', setting_value: brandColors.primary },
        { setting_key: 'brand_primary_hover', setting_value: brandColors.primary_hover },
        { setting_key: 'brand_accent_color', setting_value: brandColors.accent }
      ];

      for (const update of updates) {
        await supabase
          .from('shared_settings')
          .upsert(update, { onConflict: 'setting_key' });
      }

      // Update CSS variables in real-time
      const root = document.documentElement;
      root.style.setProperty('--primary', brandColors.primary);
      root.style.setProperty('--accent', brandColors.accent);

      toast({
        title: "Success",
        description: "Brand colors updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save brand colors",
        variant: "destructive",
      });
    }
  };

  const saveAiSettings = async () => {
    try {
      const updates = [
        { key: 'ai_system_prompt', value: aiSettings.system_prompt },
        { key: 'ai_model_name', value: aiSettings.model_name },
        { key: 'ai_temperature', value: aiSettings.temperature.toString() },
        { key: 'ai_max_tokens', value: aiSettings.max_tokens.toString() },
        { key: 'ai_include_user_context', value: aiSettings.include_user_context.toString() },
        { key: 'ai_response_style', value: aiSettings.response_style },
        { key: 'ai_prompt_templates', value: JSON.stringify(aiSettings.prompt_templates) }
      ];

      for (const update of updates) {
        await supabase
          .from('shared_settings')
          .update({ setting_value: update.value })
          .eq('setting_key', update.key);
      }

      toast({
        title: "Success",
        description: "AI settings saved successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save AI settings",
        variant: "destructive",
      });
    }
  };

  const saveAiBehaviorSettings = async () => {
    try {
      const updates = [
        { key: 'ai_weak_moment_keywords', value: JSON.stringify(aiBehaviorSettings.weak_moment_keywords) },
        { key: 'ai_motivator_suggestion_frequency', value: aiBehaviorSettings.motivator_suggestion_frequency.toString() },
        { key: 'ai_coaching_encouragement_level', value: aiBehaviorSettings.coaching_encouragement_level.toString() },
        { key: 'ai_auto_motivator_triggers', value: aiBehaviorSettings.auto_motivator_triggers.toString() },
        { key: 'ai_slideshow_transition_time', value: aiBehaviorSettings.slideshow_transition_time.toString() },
        { key: 'ai_crisis_style', value: aiBehaviorSettings.crisis_style || 'psychological' },
        { key: 'ai_admin_motivator_templates', value: JSON.stringify(aiBehaviorSettings.admin_motivator_templates) }
      ];

      for (const update of updates) {
        await supabase
          .from('shared_settings')
          .update({ setting_value: update.value })
          .eq('setting_key', update.key);
      }

      toast({
        title: "Success",
        description: "AI behavior settings saved successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save AI behavior settings",
        variant: "destructive",
      });
    }
  };

  const loadTemplate = (templateName: string) => {
    const template = aiSettings.prompt_templates.find(t => t.name === templateName);
    if (template) {
      setAiSettings(prev => ({
        ...prev,
        system_prompt: template.prompt
      }));
      toast({
        title: "Template Loaded",
        description: `Applied "${templateName}" template to system prompt`,
      });
    }
  };

  const updateRequestLimits = async () => {
    setUpdateLimitsLoading(true);
    try {
      await supabase
        .from('shared_settings')
        .update({ setting_value: monthlyRequestLimit })
        .eq('setting_key', 'monthly_request_limit');

      await supabase
        .from('shared_settings')
        .update({ setting_value: freeRequestLimit })
        .eq('setting_key', 'free_request_limit');

      toast({
        title: "Success",
        description: "Request limits updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update request limits",
        variant: "destructive",
      });
    } finally {
      setUpdateLimitsLoading(false);
    }
  };

  const clearStorageStats = async () => {
    try {
      const { data: files, error } = await supabase.storage
        .from('motivator-images')
        .list();

      const fileCount = files?.length || 0;
      const totalSize = files?.reduce((acc, file) => acc + (file.metadata?.size || 0), 0) || 0;

      toast({
        title: "Storage Info",
        description: `${fileCount} files, ${(totalSize / 1024 / 1024).toFixed(2)} MB used`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to get storage stats",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-ceramic-base px-4 pt-8 pb-32 safe-bottom flex items-center justify-center">
        <div className="text-warm-text">Loading admin dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ceramic-base px-4 pt-8 pb-32 safe-bottom">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-warm-text">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage users and system settings</p>
        </div>

        {/* Usage Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4 bg-ceramic-plate border-ceramic-rim">
            <div className="flex items-center space-x-3">
              <Users className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold text-warm-text">{usageStats.total_users}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4 bg-ceramic-plate border-ceramic-rim">
            <div className="flex items-center space-x-3">
              <DollarSign className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Paid Users</p>
                <p className="text-2xl font-bold text-warm-text">{usageStats.paid_users}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4 bg-ceramic-plate border-ceramic-rim">
            <div className="flex items-center space-x-3">
              <BarChart3 className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">AI Requests</p>
                <p className="text-2xl font-bold text-warm-text">{usageStats.monthly_ai_requests}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4 bg-ceramic-plate border-ceramic-rim">
            <div className="flex items-center space-x-3">
              <Key className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Shared API</p>
                <p className="text-sm font-medium text-warm-text">
                  {sharedApiKey ? 'Configured' : 'Not Set'}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Enhanced Analytics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4 bg-ceramic-plate border-ceramic-rim">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Users at Free Limit</p>
                <p className="text-2xl font-bold text-warm-text">{usageStats.free_users_exhausted}</p>
                <p className="text-xs text-orange-600">Ready for upgrade prompts</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4 bg-ceramic-plate border-ceramic-rim">
            <div className="flex items-center space-x-3">
              <BarChart3 className="w-5 h-5 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">Premium Users Near Limit</p>
                <p className="text-2xl font-bold text-warm-text">{usageStats.premium_users_over_80_percent}</p>
                <p className="text-xs text-yellow-600">Over 80% of {monthlyRequestLimit} requests</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4 bg-ceramic-plate border-ceramic-rim">
            <div className="flex items-center space-x-3">
              <DollarSign className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Conversion Ready</p>
                <p className="text-2xl font-bold text-warm-text">{usageStats.conversion_opportunities}</p>
                <p className="text-xs text-green-600">Free users near {freeRequestLimit} limit</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Limit Recommendations */}
        {(usageStats.free_users_exhausted / Math.max(usageStats.total_users - usageStats.paid_users, 1) > 0.2) && (
          <Card className="p-4 bg-yellow-50 border-yellow-200">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="font-medium text-yellow-800">Recommendation: Consider Increasing Free Limit</p>
                <p className="text-sm text-yellow-700">
                  Over 20% of free users have hit their limit. Consider increasing from {freeRequestLimit} to {parseInt(freeRequestLimit) + 5} requests.
                </p>
              </div>
            </div>
          </Card>
        )}

        {(usageStats.premium_users_over_80_percent / Math.max(usageStats.paid_users, 1) > 0.1) && (
          <Card className="p-4 bg-orange-50 border-orange-200">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              <div>
                <p className="font-medium text-orange-800">Alert: Premium Users Approaching Limit</p>
                <p className="text-sm text-orange-700">
                  {usageStats.premium_users_over_80_percent} premium users are using over 80% of their {monthlyRequestLimit} monthly requests.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Subscription Settings */}
        <Card className="p-6 bg-ceramic-plate border-ceramic-rim">
          <h3 className="text-lg font-semibold text-warm-text mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Subscription Settings
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label className="text-warm-text">Monthly Request Limit (Premium Users)</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    type="number"
                    value={monthlyRequestLimit}
                    onChange={(e) => setMonthlyRequestLimit(e.target.value)}
                    className="bg-ceramic-base border-ceramic-rim"
                    min="100"
                    max="10000"
                    step="100"
                  />
                  <Button
                    onClick={updateRequestLimits}
                    disabled={updateLimitsLoading}
                    size="sm"
                    className="bg-primary hover:bg-primary/90"
                  >
                    {updateLimitsLoading ? 'Saving...' : 'Save'}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Current: {monthlyRequestLimit} requests per month
                </p>
              </div>

              <div>
                <Label className="text-warm-text">Free Request Limit (New Users)</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    type="number"
                    value={freeRequestLimit}
                    onChange={(e) => setFreeRequestLimit(e.target.value)}
                    className="bg-ceramic-base border-ceramic-rim"
                    min="5"
                    max="100"
                    step="5"
                  />
                  <Button
                    onClick={updateRequestLimits}
                    disabled={updateLimitsLoading}
                    size="sm"
                    className="bg-primary hover:bg-primary/90"
                  >
                    {updateLimitsLoading ? 'Saving...' : 'Save'}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Current: {freeRequestLimit} free requests per account
                </p>
              </div>
            </div>

            <div className="bg-accent/20 p-4 rounded-lg">
              <h4 className="font-medium text-warm-text mb-2">Usage Guidelines</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Set generous limits to prevent user frustration</li>
                <li>• Monitor usage analytics to adjust accordingly</li>
                <li>• Free limits encourage upgrades without being restrictive</li>
                <li>• Premium limits should feel unlimited for normal usage</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Shared OpenAI Key Management */}
        <Card className="p-6 bg-ceramic-plate border-ceramic-rim">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Key className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-warm-text">Shared OpenAI API Key</h3>
            </div>
            
            <div className="space-y-3">
              <Label htmlFor="shared-api-key" className="text-warm-text">
                OpenAI API Key (Shared by all paid users)
              </Label>
              <div className="space-y-2">
                <Input
                  id="shared-api-key"
                  type={isKeyVisible ? 'text' : 'password'}
                  placeholder="sk-..."
                  value={sharedApiKey}
                  onChange={(e) => setSharedApiKey(e.target.value)}
                  className="bg-ceramic-base border-ceramic-rim"
                />
                <div className="flex items-center space-x-2">
                  <Switch
                    id="show-shared-key"
                    checked={isKeyVisible}
                    onCheckedChange={setIsKeyVisible}
                  />
                  <Label htmlFor="show-shared-key" className="text-sm text-muted-foreground">
                    Show API key
                  </Label>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <Button
                  onClick={saveSharedApiKey}
                  disabled={!sharedApiKey.trim()}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  Save Shared Key
                </Button>
                <Button
                  onClick={clearSharedApiKey}
                  variant="outline"
                  className="bg-ceramic-base border-ceramic-rim"
                >
                  Clear
                </Button>
              </div>
              
              <div className="bg-accent/20 p-3 rounded-lg">
                <p className="text-xs text-muted-foreground">
                  This API key will be used for all paid users. Usage: Free users (0 requests), 
                  Paid users (150 requests/month), Admin (unlimited).
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Stripe Configuration */}
        <Card className="p-6 bg-ceramic-plate border-ceramic-rim">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <DollarSign className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-warm-text">Stripe Configuration</h3>
            </div>
            
            <div className="space-y-3">
              <Label htmlFor="stripe-api-key" className="text-warm-text">
                Stripe Secret Key (Test or Live)
              </Label>
              <div className="space-y-2">
                <Input
                  id="stripe-api-key"
                  type={isStripeKeyVisible ? 'text' : 'password'}
                  placeholder="sk_test_... or sk_live_..."
                  value={stripeApiKey}
                  onChange={(e) => setStripeApiKey(e.target.value)}
                  className="bg-ceramic-base border-ceramic-rim"
                />
                <div className="flex items-center space-x-2">
                  <Switch
                    id="show-stripe-key"
                    checked={isStripeKeyVisible}
                    onCheckedChange={setIsStripeKeyVisible}
                  />
                  <Label htmlFor="show-stripe-key" className="text-sm text-muted-foreground">
                    Show API key
                  </Label>
                </div>
              </div>
              
              <div className="flex space-x-3">
                <Button
                  onClick={saveStripeApiKey}
                  disabled={!stripeApiKey.trim()}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  Save Stripe Key
                </Button>
                <Button
                  onClick={clearStripeApiKey}
                  variant="outline"
                  className="bg-ceramic-base border-ceramic-rim"
                >
                  Clear
                </Button>
              </div>
              
              <div className="bg-accent/20 p-3 rounded-lg">
                <p className="text-xs text-muted-foreground">
                  {stripeApiKey.startsWith('sk_test_') ? (
                    <span className="text-yellow-600">⚠️ Test mode: Use this for testing. No real payments will be processed.</span>
                  ) : stripeApiKey.startsWith('sk_live_') ? (
                    <span className="text-green-600">✅ Live mode: Real payments will be processed.</span>
                  ) : stripeApiKey ? (
                    <span className="text-red-600">❌ Invalid key format. Must start with sk_test_ or sk_live_</span>
                  ) : (
                    "Configure your Stripe secret key to enable subscription payments. Test keys start with sk_test_, live keys with sk_live_."
                  )}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* AI Behavior Controls */}
        <Card className="p-6 bg-ceramic-plate border-ceramic-rim">
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <Sliders className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-warm-text">AI Behavior Controls</h3>
            </div>

            {/* Weak Moment Detection */}
            <div className="space-y-3">
              <Label className="text-warm-text">Weak Moment Keywords</Label>
              <Textarea
                placeholder="Enter keywords separated by commas (e.g., hungry, craving, struggling)"
                value={aiBehaviorSettings.weak_moment_keywords.join(', ')}
                onChange={(e) => setAiBehaviorSettings(prev => ({ 
                  ...prev, 
                  weak_moment_keywords: e.target.value.split(',').map(k => k.trim()).filter(k => k)
                }))}
                className="bg-ceramic-base border-ceramic-rim"
              />
              <div className="text-xs text-muted-foreground">
                AI will detect these words in conversations to trigger motivational support
              </div>
            </div>

            {/* Motivator Suggestion Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <Label className="text-warm-text">
                  Motivator Suggestion Frequency: {aiBehaviorSettings.motivator_suggestion_frequency}
                </Label>
                <Slider
                  value={[aiBehaviorSettings.motivator_suggestion_frequency]}
                  onValueChange={([value]) => setAiBehaviorSettings(prev => ({ ...prev, motivator_suggestion_frequency: value }))}
                  max={10}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <div className="text-xs text-muted-foreground">
                  How often AI suggests new motivators (1=rarely, 10=frequently)
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-warm-text">
                  Coaching Encouragement Level: {aiBehaviorSettings.coaching_encouragement_level}
                </Label>
                <Slider
                  value={[aiBehaviorSettings.coaching_encouragement_level]}
                  onValueChange={([value]) => setAiBehaviorSettings(prev => ({ ...prev, coaching_encouragement_level: value }))}
                  max={10}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <div className="text-xs text-muted-foreground">
                  Balance between encouragement and education (1=educational, 10=encouraging)
                </div>
              </div>
            </div>

            {/* Timer & Motivator Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <Switch
                  id="auto-triggers"
                  checked={aiBehaviorSettings.auto_motivator_triggers}
                  onCheckedChange={(checked) => setAiBehaviorSettings(prev => ({ ...prev, auto_motivator_triggers: checked }))}
                />
                <Label htmlFor="auto-triggers" className="text-warm-text">
                  Auto-trigger motivators during fasting
                </Label>
              </div>

              <div className="space-y-2">
                <Label className="text-warm-text">Slideshow Transition (seconds)</Label>
                <Input
                  type="number"
                  min="5"
                  max="60"
                  value={aiBehaviorSettings.slideshow_transition_time}
                  onChange={(e) => setAiBehaviorSettings(prev => ({ ...prev, slideshow_transition_time: parseInt(e.target.value) || 15 }))}
                  className="bg-ceramic-base border-ceramic-rim"
                />
              </div>
            </div>

            <Button
              onClick={saveAiBehaviorSettings}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Sliders className="w-4 h-4 mr-2" />
              Save Behavior Settings
            </Button>

            <div className="bg-accent/20 p-3 rounded-lg">
              <p className="text-xs text-muted-foreground">
                These controls let you fine-tune how the AI detects user needs and provides motivational support.
                All changes take effect immediately for new conversations.
              </p>
            </div>
          </div>
        </Card>

        {/* AI Chat Configuration */}
        <Card className="p-6 bg-ceramic-plate border-ceramic-rim">
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <Brain className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-warm-text">AI Chat Configuration</h3>
            </div>

            {/* Template Selection */}
            <div className="space-y-3">
              <Label className="text-warm-text">Quick Templates</Label>
              <div className="flex flex-wrap gap-2">
                {aiSettings.prompt_templates.map((template) => (
                  <Button
                    key={template.name}
                    variant="outline"
                    size="sm"
                    onClick={() => loadTemplate(template.name)}
                    className="bg-ceramic-base border-ceramic-rim hover:bg-ceramic-base/80"
                  >
                    {template.name}
                  </Button>
                ))}
              </div>
            </div>

            {/* System Prompt */}
            <div className="space-y-3">
              <Label htmlFor="system-prompt" className="text-warm-text">
                System Prompt
              </Label>
              <Textarea
                id="system-prompt"
                placeholder="Define the AI's personality and behavior..."
                value={aiSettings.system_prompt}
                onChange={(e) => setAiSettings(prev => ({ ...prev, system_prompt: e.target.value }))}
                className="bg-ceramic-base border-ceramic-rim min-h-[120px]"
              />
              <div className="text-xs text-muted-foreground">
                Characters: {aiSettings.system_prompt.length}/2000
              </div>
            </div>

            {/* Model Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-warm-text">AI Model</Label>
                <Select
                  value={aiSettings.model_name}
                  onValueChange={(value) => setAiSettings(prev => ({ ...prev, model_name: value }))}
                >
                  <SelectTrigger className="bg-ceramic-base border-ceramic-rim">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gpt-4.1-2025-04-14">GPT-4.1 (Latest)</SelectItem>
                    <SelectItem value="gpt-4o-mini">GPT-4o Mini (Fast)</SelectItem>
                    <SelectItem value="gpt-4o">GPT-4o (Powerful)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-warm-text">Response Style</Label>
                <Select
                  value={aiSettings.response_style}
                  onValueChange={(value) => setAiSettings(prev => ({ ...prev, response_style: value }))}
                >
                  <SelectTrigger className="bg-ceramic-base border-ceramic-rim">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="encouraging">Encouraging</SelectItem>
                    <SelectItem value="scientific">Scientific</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Temperature & Max Tokens */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <Label className="text-warm-text">
                  Creativity (Temperature): {aiSettings.temperature}
                </Label>
                <Slider
                  value={[aiSettings.temperature]}
                  onValueChange={([value]) => setAiSettings(prev => ({ ...prev, temperature: value }))}
                  max={2}
                  min={0.1}
                  step={0.1}
                  className="w-full"
                />
                <div className="text-xs text-muted-foreground">
                  Lower = More focused, Higher = More creative
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="max-tokens" className="text-warm-text">Max Response Length</Label>
                <Input
                  id="max-tokens"
                  type="number"
                  min="100"
                  max="4000"
                  value={aiSettings.max_tokens}
                  onChange={(e) => setAiSettings(prev => ({ ...prev, max_tokens: parseInt(e.target.value) || 500 }))}
                  className="bg-ceramic-base border-ceramic-rim"
                />
                <div className="text-xs text-muted-foreground">
                  100-4000 tokens (shorter = faster responses)
                </div>
              </div>
            </div>

            {/* User Context Toggle */}
            <div className="flex items-center space-x-3">
              <Switch
                id="include-context"
                checked={aiSettings.include_user_context}
                onCheckedChange={(checked) => setAiSettings(prev => ({ ...prev, include_user_context: checked }))}
              />
              <Label htmlFor="include-context" className="text-warm-text">
                Include user fasting context in responses
              </Label>
            </div>

            <div className="flex space-x-3">
              <Button
                onClick={saveAiSettings}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Settings className="w-4 h-4 mr-2" />
                Save AI Settings
              </Button>
            </div>

            <div className="bg-accent/20 p-3 rounded-lg">
              <p className="text-xs text-muted-foreground">
                These settings control how the AI companion behaves and responds to users. 
                Changes take effect immediately for new conversations.
              </p>
            </div>
          </div>
        </Card>

        {/* PWA Settings */}
        <Card className="p-6 bg-ceramic-plate border-ceramic-rim">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Smartphone className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-warm-text">PWA Settings</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="app-name" className="text-warm-text">App Name</Label>
                <Input
                  id="app-name"
                  value={pwaSettings.app_name}
                  onChange={(e) => setPwaSettings(prev => ({ ...prev, app_name: e.target.value }))}
                  className="bg-ceramic-base border-ceramic-rim"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="short-name" className="text-warm-text">Short Name</Label>
                <Input
                  id="short-name"
                  value={pwaSettings.short_name}
                  onChange={(e) => setPwaSettings(prev => ({ ...prev, short_name: e.target.value }))}
                  className="bg-ceramic-base border-ceramic-rim"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="theme-color" className="text-warm-text">Theme Color</Label>
                <Input
                  id="theme-color"
                  value={pwaSettings.theme_color}
                  onChange={(e) => setPwaSettings(prev => ({ ...prev, theme_color: e.target.value }))}
                  className="bg-ceramic-base border-ceramic-rim"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bg-color" className="text-warm-text">Background Color</Label>
                <Input
                  id="bg-color"
                  value={pwaSettings.background_color}
                  onChange={(e) => setPwaSettings(prev => ({ ...prev, background_color: e.target.value }))}
                  className="bg-ceramic-base border-ceramic-rim"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description" className="text-warm-text">Description</Label>
              <Input
                id="description"
                value={pwaSettings.description}
                onChange={(e) => setPwaSettings(prev => ({ ...prev, description: e.target.value }))}
                className="bg-ceramic-base border-ceramic-rim"
              />
            </div>
            
            <Button
              onClick={savePwaSettings}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Save PWA Settings
            </Button>
          </div>
        </Card>

        {/* Brand Colors */}
        <Card className="p-6 bg-ceramic-plate border-ceramic-rim">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Settings className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-warm-text">Brand Colors</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Customize the primary action button colors to match your brand across all pages.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="primary-color" className="text-warm-text">Primary Color (HSL)</Label>
                <Input
                  id="primary-color"
                  value={brandColors.primary}
                  onChange={(e) => setBrandColors(prev => ({ ...prev, primary: e.target.value }))}
                  placeholder="140 35% 45%"
                  className="bg-ceramic-base border-ceramic-rim"
                />
                <div 
                  className="w-full h-8 rounded border-2 border-ceramic-rim"
                  style={{ backgroundColor: `hsl(${brandColors.primary})` }}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="primary-hover" className="text-warm-text">Primary Hover (HSL)</Label>
                <Input
                  id="primary-hover"
                  value={brandColors.primary_hover}
                  onChange={(e) => setBrandColors(prev => ({ ...prev, primary_hover: e.target.value }))}
                  placeholder="140 35% 40%"
                  className="bg-ceramic-base border-ceramic-rim"
                />
                <div 
                  className="w-full h-8 rounded border-2 border-ceramic-rim"
                  style={{ backgroundColor: `hsl(${brandColors.primary_hover})` }}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="accent-color" className="text-warm-text">Accent Color (HSL)</Label>
                <Input
                  id="accent-color"
                  value={brandColors.accent}
                  onChange={(e) => setBrandColors(prev => ({ ...prev, accent: e.target.value }))}
                  placeholder="140 25% 85%"
                  className="bg-ceramic-base border-ceramic-rim"
                />
                <div 
                  className="w-full h-8 rounded border-2 border-ceramic-rim"
                  style={{ backgroundColor: `hsl(${brandColors.accent})` }}
                />
              </div>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-lg">
              <p className="text-xs text-blue-600 dark:text-blue-400">
                💡 Use HSL format (e.g., "140 35% 45%") for better control. Changes apply immediately to buttons and action elements.
              </p>
            </div>
            
            <Button
              onClick={saveBrandColors}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Save Brand Colors
            </Button>
          </div>
        </Card>

        {/* Crisis Intervention Controls */}
        <Card className="p-6 bg-ceramic-plate border-ceramic-rim">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <h3 className="text-lg font-semibold text-warm-text">Crisis Intervention Controls</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-warm-text">Crisis Intervention Style</Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    How the AI responds to panic button presses
                  </p>
                  <Select
                    value={aiBehaviorSettings.crisis_style || 'psychological'}
                    onValueChange={(value) => setAiBehaviorSettings(prev => ({
                      ...prev,
                      crisis_style: value as any
                    }))}
                  >
                    <SelectTrigger className="bg-ceramic-base border-ceramic-rim">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="direct">Direct - Straightforward and assertive</SelectItem>
                      <SelectItem value="motivational">Motivational - Uplifting and encouraging</SelectItem>
                      <SelectItem value="tough_love">Tough Love - Firm but caring</SelectItem>
                      <SelectItem value="psychological">Psychological - Uses persuasive pressure</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label className="text-warm-text">Crisis Response Preview</Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Test what users will see during crisis intervention
                  </p>
                  <div className="bg-red-950/20 border border-red-800/30 p-3 rounded-lg">
                    <p className="text-sm text-red-800">
                      {aiBehaviorSettings.crisis_style === 'psychological' ? 
                        "You've given up before, haven't you? This feeling will pass, but giving up lasts forever..." :
                        aiBehaviorSettings.crisis_style === 'tough_love' ?
                        "Stop right there! You're stronger than this craving. Don't throw away your progress now." :
                        aiBehaviorSettings.crisis_style === 'motivational' ?
                        "You've got this! This difficult moment is proof that your fast is working." :
                        "This is temporary. Your goals are permanent. Push through this moment."
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <Button 
              onClick={saveAiBehaviorSettings}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Save Crisis Settings
            </Button>
          </div>
        </Card>

        {/* Admin Motivator Creation */}
        <Card className="p-6 bg-ceramic-plate border-ceramic-rim">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Plus className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-warm-text">Admin Motivator Creation</h3>
            </div>
            
            <AdminMotivatorCreation
              onTemplateCreated={(template) => {
                setAiBehaviorSettings(prev => ({
                  ...prev,
                  admin_motivator_templates: [...prev.admin_motivator_templates, template]
                }));
              }}
              existingTemplates={aiBehaviorSettings.admin_motivator_templates}
            />
            
            <div className="bg-accent/20 p-3 rounded-lg">
              <p className="text-xs text-muted-foreground">
                Create motivator templates using voice input. These templates become available to all users as suggested motivators.
              </p>
            </div>
          </div>
        </Card>

        {/* Storage Management */}
        <Card className="p-6 bg-ceramic-plate border-ceramic-rim">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Image className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-warm-text">Storage Management</h3>
            </div>
            
            <div className="flex space-x-3">
              <Button
                onClick={clearStorageStats}
                variant="outline"
                className="bg-ceramic-base border-ceramic-rim"
              >
                Check Storage Usage
              </Button>
            </div>
            
            <div className="bg-accent/20 p-3 rounded-lg">
              <p className="text-xs text-muted-foreground">
                Motivator images are stored in Supabase Storage. Users can upload images up to 5MB each.
              </p>
            </div>
          </div>
        </Card>

        {/* User Management */}
        <Card className="p-6 bg-ceramic-plate border-ceramic-rim">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Users className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-warm-text">User Management</h3>
            </div>
            
            <div className="space-y-3">
              {users.map((userData) => (
                <div key={userData.id} className="flex items-center justify-between p-4 bg-ceramic-base border border-ceramic-rim rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div>
                        <p className="font-medium text-warm-text">
                          {userData.display_name || 'Anonymous User'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          AI Usage: {userData.monthly_ai_requests || 0}/{userData.is_paid_user ? monthlyRequestLimit : freeRequestLimit} requests
                        </p>
                      </div>
                      <Badge variant={userData.is_paid_user ? "default" : "secondary"}>
                        {userData.is_paid_user ? 'Paid' : 'Free'}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => resetUserUsage(userData.user_id)}
                      className="bg-ceramic-base border-ceramic-rim"
                    >
                      Reset Usage
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => togglePaidStatus(userData.user_id, userData.is_paid_user)}
                      variant={userData.is_paid_user ? "destructive" : "default"}
                    >
                      {userData.is_paid_user ? 'Downgrade' : 'Upgrade'}
                    </Button>
                  </div>
                </div>
              ))}
              
              {users.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No users found</p>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AdminOverview;