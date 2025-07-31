import React, { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { AdminTierStats } from "@/components/AdminTierStats";

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
  const [users, setUsers] = useState<User[]>([]);
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
      
      // Fetch users from profiles table
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('user_id, display_name, is_paid_user, monthly_ai_requests, created_at, subscription_status, user_tier')
        .order('created_at', { ascending: false });

      if (usersError) {
        console.error('Error fetching users:', usersError);
      } else {
        setUsers(usersData || []);
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
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Admin Overview</h1>
      
      {/* Usage Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usageStats.total_users}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users (7d)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usageStats.active_users}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usageStats.paid_users}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usageStats.total_requests}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tier Statistics */}
      <AdminTierStats />

      {/* API Keys */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>OpenAI API Key</CardTitle>
            <CardDescription>Configure the shared OpenAI API key</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                id="apiKey"
                type="password"
                value={sharedApiKey}
                onChange={(e) => setSharedApiKey(e.target.value)}
                placeholder="Enter OpenAI API key"
              />
            </div>
            <Button onClick={saveApiKey}>Save API Key</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Stripe API Key</CardTitle>
            <CardDescription>Configure the Stripe API key</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="stripeKey">Stripe Key</Label>
              <Input
                id="stripeKey"
                type="password"
                value={stripeApiKey}
                onChange={(e) => setStripeApiKey(e.target.value)}
                placeholder="Enter Stripe API key"
              />
            </div>
            <Button onClick={saveStripeApiKey}>Save Stripe Key</Button>
          </CardContent>
        </Card>
      </div>

      {/* User Management */}
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
          <CardDescription>Overview of all users</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-border">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-2 border-r border-border">Display Name</th>
                  <th className="text-left p-2 border-r border-border">User Tier</th>
                  <th className="text-left p-2 border-r border-border">Subscription</th>
                  <th className="text-left p-2 border-r border-border">Monthly Requests</th>
                  <th className="text-left p-2">Created At</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.user_id} className="border-b border-border">
                    <td className="p-2 border-r border-border">{user.display_name || 'N/A'}</td>
                    <td className="p-2 border-r border-border">{user.user_tier || 'N/A'}</td>
                    <td className="p-2 border-r border-border">{user.subscription_status || 'free'}</td>
                    <td className="p-2 border-r border-border">{user.monthly_ai_requests || 0}</td>
                    <td className="p-2">{new Date(user.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminOverview;