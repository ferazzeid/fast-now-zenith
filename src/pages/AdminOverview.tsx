import React, { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { AdminTierStats } from "@/components/AdminTierStats";
import { ColorManagement } from "@/components/ColorManagement";
import { OpenAIApiStats } from "@/components/OpenAIApiStats";

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
        .in('setting_key', ['shared_api_key', 'stripe_api_key']);

      if (settingsError) {
        console.error('Error fetching settings:', settingsError);
      } else if (settingsData) {
        settingsData.forEach(setting => {
          if (setting.setting_key === 'shared_api_key') {
            setSharedApiKey(setting.setting_value || '');
          } else if (setting.setting_key === 'stripe_api_key') {
            setStripeApiKey(setting.setting_value || '');
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
          Admin Dashboard
        </h1>
      </div>
      
      {/* Most Important Metric - User Tiers Overview */}
      <AdminTierStats />

      {/* API Configuration - Full Width Cards */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-foreground">API Configuration</h2>
        
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
            <Button onClick={saveApiKey} className="w-full sm:w-auto">
              Save OpenAI API Key
            </Button>
          </CardContent>
        </Card>

        {/* OpenAI API Statistics */}
        <OpenAIApiStats />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              Stripe API Key
            </CardTitle>
            <CardDescription>
              Configure the Stripe API key for payment processing and subscription management
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="stripeKey" className="text-sm font-medium">Secret Key</Label>
              <Input
                id="stripeKey"
                type="password"
                value={stripeApiKey}
                onChange={(e) => setStripeApiKey(e.target.value)}
                placeholder="sk_..."
                className="font-mono text-sm"
              />
            </div>
            <Button onClick={saveStripeApiKey} className="w-full sm:w-auto">
              Save Stripe API Key
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Color Management */}
      <div className="space-y-6 mb-12">
        <h2 className="text-2xl font-semibold text-foreground">Brand Customization</h2>
        <ColorManagement />
      </div>
    </div>
  );
};

export default AdminOverview;