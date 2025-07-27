import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Search, Filter, Download, Mail, Calendar, CreditCard, Activity, ArrowLeft, Eye, Settings2, TrendingUp, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface ExtendedUser {
  id: string;
  user_id: string;
  display_name: string | null;
  is_paid_user: boolean;
  monthly_ai_requests: number;
  ai_requests_reset_date: string;
  created_at: string;
  subscription_status: string;
  subscription_tier: string;
  last_active?: string;
  total_sessions?: number;
  avg_session_duration?: number;
}

export const UserManagement = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<ExtendedUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<ExtendedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [tierFilter, setTierFilter] = useState('all');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, statusFilter, tierFilter]);

  const fetchUsers = async () => {
    try {
      const { data: profilesData, error } = await supabase
        .from('profiles')
        .select(`
          *,
          user_roles!inner(role)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Enhance user data with additional analytics
      const enhancedUsers = profilesData?.map(user => ({
        ...user,
        last_active: user.updated_at,
        total_sessions: Math.floor(Math.random() * 50) + 1, // Mock data
        avg_session_duration: Math.floor(Math.random() * 30) + 5, // Mock data
      })) || [];

      setUsers(enhancedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.user_id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => 
        statusFilter === 'paid' ? user.is_paid_user : !user.is_paid_user
      );
    }

    if (tierFilter !== 'all') {
      filtered = filtered.filter(user => user.subscription_tier === tierFilter);
    }

    setFilteredUsers(filtered);
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_paid_user: !currentStatus })
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `User ${!currentStatus ? 'upgraded to' : 'downgraded from'} paid status`,
      });
      
      fetchUsers();
    } catch (error) {
      console.error('Error updating user status:', error);
      toast({
        title: "Error",
        description: "Failed to update user status",
        variant: "destructive",
      });
    }
  };

  const resetUserUsage = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          monthly_ai_requests: 0,
          ai_requests_reset_date: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "User AI usage reset successfully",
      });
      
      fetchUsers();
    } catch (error) {
      console.error('Error resetting user usage:', error);
      toast({
        title: "Error",
        description: "Failed to reset user usage",
        variant: "destructive",
      });
    }
  };

  const exportUserData = () => {
    const csvContent = [
      ['User ID', 'Display Name', 'Status', 'Tier', 'AI Requests', 'Created At'],
      ...filteredUsers.map(user => [
        user.user_id,
        user.display_name || 'N/A',
        user.is_paid_user ? 'Paid' : 'Free',
        user.subscription_tier || 'free',
        user.monthly_ai_requests,
        format(new Date(user.created_at), 'yyyy-MM-dd')
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-export-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusBadge = (user: ExtendedUser) => {
    if (user.is_paid_user) {
      return <Badge variant="default" className="bg-green-600">Paid</Badge>;
    }
    return <Badge variant="secondary">Free</Badge>;
  };

  const getUsageBadge = (requests: number, isPaid: boolean) => {
    const limit = isPaid ? 1000 : 15;
    const percentage = (requests / limit) * 100;
    
    if (percentage >= 100) {
      return <Badge variant="destructive">Exhausted</Badge>;
    } else if (percentage >= 80) {
      return <Badge className="bg-orange-600">High Usage</Badge>;
    } else if (percentage >= 50) {
      return <Badge className="bg-yellow-600">Medium Usage</Badge>;
    }
    return <Badge variant="outline">Low Usage</Badge>;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p>Loading users...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/admin')}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Admin</span>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">User Management</h1>
            <p className="text-muted-foreground">Comprehensive user administration and analytics</p>
          </div>
        </div>
        <Button onClick={exportUserData} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export Data
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-blue-600" />
            <div>
              <p className="text-sm text-muted-foreground">Total Users</p>
              <p className="text-2xl font-bold">{users.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <CreditCard className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-sm text-muted-foreground">Paid Users</p>
              <p className="text-2xl font-bold">{users.filter(u => u.is_paid_user).length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            <div>
              <p className="text-sm text-muted-foreground">Conversion Rate</p>
              <p className="text-2xl font-bold">
                {users.length > 0 ? Math.round((users.filter(u => u.is_paid_user).length / users.length) * 100) : 0}%
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-orange-600" />
            <div>
              <p className="text-sm text-muted-foreground">High Usage</p>
              <p className="text-2xl font-bold">
                {users.filter(u => {
                  const limit = u.is_paid_user ? 1000 : 15;
                  return (u.monthly_ai_requests / limit) >= 0.8;
                }).length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search users by name or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              <SelectItem value="paid">Paid Users</SelectItem>
              <SelectItem value="free">Free Users</SelectItem>
            </SelectContent>
          </Select>
          <Select value={tierFilter} onValueChange={setTierFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by tier" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tiers</SelectItem>
              <SelectItem value="free">Free Tier</SelectItem>
              <SelectItem value="premium">Premium Tier</SelectItem>
              <SelectItem value="enterprise">Enterprise Tier</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Users Table */}
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>AI Usage</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Last Active</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.user_id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{user.display_name || 'Unnamed User'}</p>
                      <p className="text-sm text-muted-foreground">{user.user_id}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {getStatusBadge(user)}
                      <p className="text-sm text-muted-foreground">{user.subscription_tier || 'free'}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {getUsageBadge(user.monthly_ai_requests, user.is_paid_user)}
                      <p className="text-sm text-muted-foreground">
                        {user.monthly_ai_requests}/{user.is_paid_user ? 1000 : 15}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {format(new Date(user.created_at), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell>
                    {user.last_active ? format(new Date(user.last_active), 'MMM dd, yyyy') : 'Never'}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant={user.is_paid_user ? "destructive" : "default"}
                        onClick={() => toggleUserStatus(user.user_id, user.is_paid_user)}
                      >
                        {user.is_paid_user ? 'Downgrade' : 'Upgrade'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => resetUserUsage(user.user_id)}
                      >
                        Reset Usage
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {filteredUsers.length === 0 && (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No users found matching your criteria</p>
          </div>
        )}
      </Card>
    </div>
  );
};