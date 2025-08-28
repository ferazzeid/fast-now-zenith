import { useState } from 'react';
import { LogOut, Trash2, RotateCcw, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { SimpleSubscriptionStatus } from '@/components/SimpleSubscriptionStatus';
import { SimpleCouponInput } from '@/components/SimpleCouponInput';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

const Account = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate('/auth');
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleResetData = async () => {
    if (!user) return;
    
    const confirmed = window.confirm(
      "Are you sure you want to reset all your data? This will clear all your fasting sessions, food entries, walking sessions, and goals. This action cannot be undone."
    );
    
    if (!confirmed) return;

    try {
      // Clear all user data
      await Promise.all([
        supabase.from('fasting_sessions').delete().eq('user_id', user.id),
        supabase.from('food_entries').delete().eq('user_id', user.id),
        supabase.from('walking_sessions').delete().eq('user_id', user.id),
        supabase.from('motivators').delete().eq('user_id', user.id),
        supabase.from('chat_conversations').delete().eq('user_id', user.id)
      ]);

      toast({
        title: "Data Reset Complete",
        description: "All your data has been cleared successfully.",
      });
    } catch (error) {
      console.error('Error resetting data:', error);
      toast({
        title: "Error",
        description: "Failed to reset data. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    
    const confirmed = window.confirm(
      "Are you sure you want to delete your account? This will permanently delete all your data and cannot be undone. You will be logged out immediately."
    );
    
    if (!confirmed) return;

    try {
      const { error } = await supabase.functions.invoke('delete-account');
      
      if (error) throw error;

      toast({
        title: "Account Deleted",
        description: "Your account has been successfully deleted.",
      });
      
      // Sign out after deletion
      await supabase.auth.signOut();
      navigate('/auth');
    } catch (error) {
      console.error('Error deleting account:', error);
      toast({
        title: "Error",
        description: "Failed to delete account. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <div className="max-w-md mx-auto pt-10 pb-24">
        <div className="space-y-6">
          {/* Header */}
          <div className="space-y-2">
            <div className="mb-2 mt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/settings')}
                    className="p-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                  <h1 className="text-2xl font-bold text-foreground mb-1">
                    Account Management
                  </h1>
                </div>
              </div>
              <p className="text-sm text-muted-foreground text-left">Manage your subscription and account</p>
            </div>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Subscription Status</CardTitle>
            </CardHeader>
            <CardContent>
              <SimpleSubscriptionStatus />
            </CardContent>
          </Card>

          {/* Coupon Code */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Coupon Codes</CardTitle>
            </CardHeader>
            <CardContent>
              <SimpleCouponInput />
            </CardContent>
          </Card>

          {/* Account Actions */}
          <Card className="p-6 bg-card border-ceramic-rim">
            <CardHeader className="px-0 pt-0">
              <CardTitle className="text-lg font-semibold text-warm-text">Account Actions</CardTitle>
              <CardDescription>Manage your account settings</CardDescription>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <div className="space-y-3">
                <Button
                  variant="outline"
                  onClick={handleSignOut}
                  className="w-full justify-start bg-ceramic-base border-ceramic-rim hover:bg-ceramic-plate"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </Button>
                
                <Button
                  variant="outline"
                  onClick={handleResetData}
                  className="w-full justify-start border-orange-200 text-orange-600 hover:bg-orange-50 dark:border-orange-800 dark:text-orange-400 dark:hover:bg-orange-950"
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reset All Data
                </Button>
                
                <Button
                  variant="outline"
                  onClick={handleDeleteAccount}
                  className="w-full justify-start border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Account;