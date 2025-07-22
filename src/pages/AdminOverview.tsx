import { useState, useEffect } from 'react';
import { Users, Settings, Key, BarChart3, DollarSign, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';

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
}

const AdminOverview = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [sharedApiKey, setSharedApiKey] = useState('');
  const [isKeyVisible, setIsKeyVisible] = useState(false);
  const [usageStats, setUsageStats] = useState<UsageStats>({
    total_users: 0,
    paid_users: 0,
    total_ai_requests: 0,
    monthly_ai_requests: 0,
  });
  const [loading, setLoading] = useState(true);
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
        
        // Calculate usage stats
        const stats = {
          total_users: profilesData.length,
          paid_users: profilesData.filter(u => u.is_paid_user).length,
          total_ai_requests: profilesData.reduce((sum, u) => sum + (u.monthly_ai_requests || 0), 0),
          monthly_ai_requests: profilesData.reduce((sum, u) => sum + (u.monthly_ai_requests || 0), 0),
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

  if (loading) {
    return (
      <div className="min-h-screen bg-ceramic-base px-4 pt-8 pb-20 flex items-center justify-center">
        <div className="text-warm-text">Loading admin dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ceramic-base px-4 pt-8 pb-20">
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
                          AI Usage: {userData.monthly_ai_requests || 0}/150 requests
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