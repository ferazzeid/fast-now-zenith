import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Settings } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { 
  AdminTierStats,
  ColorManagement,
  OpenAIApiStats,
  UserRequestLimits,
  SimpleAnalyticsWidget,
  AdminSEOSettings,
  CancellationTracker,
  BrandAssetsManager,
  PromptManagement,
  PaymentProviderSettings,
  AdminTimelineSettings
} from "@/components/LazyAdminComponents";
import { AdminRoleTester } from '@/components/AdminRoleTester';
import { AdminFoodChatSettings } from '@/components/AdminFoodChatSettings';

import { AdminQuoteSettings } from '@/components/AdminQuoteSettings';


interface User {
  user_id: string;
  display_name: string;
  is_paid_user: boolean;
  monthly_ai_requests: number;
  created_at: string;
  subscription_status: string;
  user_tier: string;
}

interface UsageStats {
  total_users: number;
  active_users: number;
  paid_users: number;
  total_requests: number;
}

const AdminOverview = () => {
  const [loading, setLoading] = useState(true);
  const [usageStats, setUsageStats] = useState<UsageStats>({
    total_users: 0,
    active_users: 0,
    paid_users: 0,
    total_requests: 0
  });
  const [sharedApiKey, setSharedApiKey] = useState('');
  const [stripeApiKey, setStripeApiKey] = useState('');
  const [gaTrackingId, setGaTrackingId] = useState('');
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [imageAnalysisEnabled, setImageAnalysisEnabled] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      
      // Fetch users from profiles table for stats only
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('user_id, is_paid_user, monthly_ai_requests, created_at')
        .order('created_at', { ascending: false });

      if (usersError) {
        console.error('Error fetching users:', usersError);
      }

      // Fetch shared settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('shared_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['shared_api_key', 'stripe_api_key', 'ga_tracking_id', 'ai_image_analysis_enabled']);

      if (settingsError) {
        console.error('Error fetching settings:', settingsError);
      } else if (settingsData) {
        settingsData.forEach(setting => {
          if (setting.setting_key === 'shared_api_key') {
            setSharedApiKey(setting.setting_value || '');
          } else if (setting.setting_key === 'stripe_api_key') {
            setStripeApiKey(setting.setting_value || '');
          } else if (setting.setting_key === 'ga_tracking_id') {
            setGaTrackingId(setting.setting_value || '');
          } else if (setting.setting_key === 'ai_image_analysis_enabled') {
            setImageAnalysisEnabled(String(setting.setting_value).toLowerCase() === 'true');
          }
        });
      }

      // Calculate usage stats
      if (usersData) {
        const stats = {
          total_users: usersData.length,
          active_users: usersData.filter(user => {
            const lastWeek = new Date();
            lastWeek.setDate(lastWeek.getDate() - 7);
            return new Date(user.created_at) > lastWeek;
          }).length,
          paid_users: usersData.filter(user => user.is_paid_user).length,
          total_requests: usersData.reduce((sum, user) => sum + (user.monthly_ai_requests || 0), 0)
        };
        setUsageStats(stats);
      }

    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch admin data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveApiKey = async () => {
    try {
      const { error } = await supabase
        .from('shared_settings')
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
        .from('shared_settings')
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

  const saveGaTrackingId = async () => {
    try {
      const { error } = await supabase
        .from('shared_settings')
        .upsert({
          setting_key: 'ga_tracking_id',
          setting_value: gaTrackingId,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Google Analytics tracking ID saved successfully",
      });
    } catch (error) {
      console.error('Error saving GA tracking ID:', error);
      toast({
        title: "Error",
        description: "Failed to save Google Analytics tracking ID",
        variant: "destructive",
      });
    }
  };

  const saveImageAnalysisFlag = async (enabled: boolean) => {
    try {
      const { error } = await supabase
        .from('shared_settings')
        .upsert({
          setting_key: 'ai_image_analysis_enabled',
          setting_value: enabled ? 'true' : 'false',
        });
      if (error) throw error;
      toast({ title: 'Saved', description: 'Image analysis testing flag updated.' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save setting', variant: 'destructive' });
    }
  };

  if (loading) {
    return null; // Let ProtectedRoute handle loading
  }

  return (
    <main className="container mx-auto p-6 space-y-8 overflow-x-hidden bg-background min-h-[calc(100vh-80px)]" role="main">
      <div className="flex items-center justify-center pt-6 pb-4">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent text-center">
          Admin Dashboard
        </h1>
      </div>
      
      {/* Role Testing Section */}
      <section aria-label="Role testing">
        <AdminRoleTester />
      </section>
      
      {/* Real-Time Analytics Dashboard */}
      <section aria-label="Real-time analytics">
        <SimpleAnalyticsWidget />
      </section>
      
      {/* SEO Settings */}
      <section aria-label="SEO settings">
        <AdminSEOSettings />
      </section>
      
      {/* Cancellation Tracking */}
      <section aria-label="Cancellation tracking">
        <CancellationTracker />
      </section>
      
      {/* Most Important Metric - User Tiers Overview */}
      <section aria-label="User tiers overview">
        <AdminTierStats />
      </section>
      
      {/* User Request Limits */}
      <section aria-label="User request limits">
        <UserRequestLimits />
      </section>
      
      {/* API Configuration - Full Width Cards */}
      <section className="space-y-6" aria-labelledby="api-config">
        <h2 id="api-config" className="text-2xl font-semibold text-foreground">API Configuration</h2>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              OpenAI API Key
            </CardTitle>
            <CardDescription>
              Configure the shared OpenAI API key used for AI-powered features across the platform
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="apiKey" className="text-sm font-medium">API Key</Label>
              <Input
                id="apiKey"
                type="password"
                value={sharedApiKey}
                onChange={(e) => setSharedApiKey(e.target.value)}
                placeholder="sk-..."
                className="font-mono text-sm"
              />
            </div>
            <Button onClick={saveApiKey} variant="action-secondary" size="action-secondary" className="w-full sm:w-auto">
              Save
            </Button>
          </CardContent>
        </Card>

        {/* OpenAI API Statistics */}
        <OpenAIApiStats />
      </section>

      {/* Payment & Analytics Configuration */}
      <section className="space-y-6" aria-labelledby="payment-analytics">
        <h2 id="payment-analytics" className="text-2xl font-semibold text-foreground">Payment & Analytics</h2>
        
        {/* Payment Provider Configuration */}
        <PaymentProviderSettings />

        {/* Google Analytics - moved here */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Google Analytics</CardTitle>
            <CardDescription>
              Configure Google Analytics tracking ID for real-time analytics data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="gaTrackingId" className="text-sm font-medium">Measurement ID</Label>
              <Input
                id="gaTrackingId"
                type="text"
                value={gaTrackingId}
                onChange={(e) => setGaTrackingId(e.target.value)}
                placeholder="G-XXXXXXXXXX"
                className="font-mono text-sm"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={saveGaTrackingId} variant="action-secondary" size="action-secondary" className="flex-1 sm:flex-none">
                Save
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Advanced Settings */}
      <section className="space-y-6" aria-label="Advanced settings">
        <Collapsible open={showAdvancedSettings} onOpenChange={setShowAdvancedSettings}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between text-foreground hover:bg-muted">
              <span className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Advanced Settings
              </span>
              {showAdvancedSettings ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-6 mt-6">
            {/* AI Prompt Configuration */}
            <PromptManagement />

            {/* Food Chat Settings */}
            <AdminFoodChatSettings />

            {/* Image Analysis Testing (Admin-only) */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-semibold">Image Analysis (Admin Testing)</CardTitle>
                <CardDescription>
                  Enable the camera/upload button in AI Chat for admins only. Users will not see this.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="text-sm font-medium">Enable admin-only image analysis</div>
                  <div className="text-xs text-muted-foreground">Toggles `ai_image_analysis_enabled` in shared settings</div>
                </div>
                <Switch
                  checked={imageAnalysisEnabled}
                  onCheckedChange={(val) => {
                    setImageAnalysisEnabled(val);
                    saveImageAnalysisFlag(val);
                  }}
                  aria-label="Toggle admin-only image analysis"
                />
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>
      </section>

      {/* Quote Management */}
      <section aria-label="Quote management">
        <AdminQuoteSettings />
      </section>

      {/* Timeline Management */}
      <section aria-label="Timeline management">
        <AdminTimelineSettings />
      </section>

      {/* Brand Customization */}
      <section className="space-y-6 pb-24" aria-labelledby="brand-customization">
        <h2 id="brand-customization" className="text-2xl font-semibold text-foreground">Brand Customization</h2>
        
        {/* Brand Assets - Favicon and Logo */}
        <BrandAssetsManager />
        
        {/* Color Management */}
        <ColorManagement />
        
        {/* Extra spacer to ensure nav doesn't cover content */}
        <div className="h-8"></div>
      </section>
    </main>
  );
};

export default AdminOverview;