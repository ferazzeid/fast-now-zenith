import { useState } from 'react';
import { LogOut, AlertTriangle, Trash2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { CouponCodeInput } from '@/components/CouponCodeInput';
import { SubscriptionStatus } from '@/components/SubscriptionStatus';

const Account = () => {
  const { toast } = useToast();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleResetAccount = async () => {
    if (!user) return;

    try {
      // Delete all user data but keep the account
      const deleteOperations = [
        supabase.from('chat_conversations').delete().eq('user_id', user.id),
        supabase.from('motivators').delete().eq('user_id', user.id),
        supabase.from('food_entries').delete().eq('user_id', user.id),
        supabase.from('user_foods').delete().eq('user_id', user.id),
        supabase.from('fasting_sessions').delete().eq('user_id', user.id),
        supabase.from('walking_sessions').delete().eq('user_id', user.id),
        supabase.from('manual_calorie_burns').delete().eq('user_id', user.id),
        supabase.from('daily_activity_overrides').delete().eq('user_id', user.id),
        supabase.from('daily_food_templates').delete().eq('user_id', user.id),
        supabase.from('default_food_favorites').delete().eq('user_id', user.id)
      ];

      await Promise.all(deleteOperations);

      // Reset profile data but keep account settings
      await supabase
        .from('profiles')
        .update({
          weight: null,
          height: null,
          age: null,
          daily_calorie_goal: null,
          daily_carb_goal: null,
          goal_weight: null,
          onboarding_completed: false
        })
        .eq('user_id', user.id);

      toast({
        title: "Account Reset Complete",
        description: "All your data has been cleared. You can start fresh!",
      });

      // Navigate to home to start fresh
      navigate('/');
    } catch (error) {
      console.error('Error resetting account:', error);
      toast({
        title: "Error",
        description: "Failed to reset account. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;

    try {
      // Call the delete account edge function
      const { data, error } = await supabase.functions.invoke('delete-account', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) throw error;

      if (data.scheduled) {
        toast({
          title: "Account Deletion Scheduled",
          description: data.message,
        });
      } else {
        toast({
          title: "Account Deleted",
          description: data.message,
        });
        // Sign out and redirect
        await signOut();
        navigate('/auth');
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      toast({
        title: "Error",
        description: "Failed to delete account. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/auth');
    } catch (error) {
      console.error('Error signing out:', error);
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
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
                <h1 className="text-2xl font-bold text-foreground mb-1">
                  Account Management
                </h1>
              </div>
              <p className="text-sm text-muted-foreground text-left">Manage your account and subscription</p>
            </div>
          </div>

          {/* Account Info */}
          <Card className="p-6 bg-card border-ceramic-rim">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <User className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold text-warm-text">Account Information</h3>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="text-warm-text font-medium">{user?.email || 'Not available'}</p>
              </div>
            </div>
          </Card>

          {/* Subscription Status */}
          <SubscriptionStatus />

          {/* Coupon Codes */}
          <CouponCodeInput />

          {/* Account Actions */}
          <Card className="p-6 bg-card border-ceramic-rim">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-warm-text">Account Actions</h3>
              
              <div className="space-y-3">
                {/* Sign Out Button */}
                <Button 
                  onClick={handleSignOut}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>

                {/* Reset Account Button */}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="w-full border-orange-200 text-orange-600 hover:bg-orange-50 dark:border-orange-800 dark:text-orange-400 dark:hover:bg-orange-900/20">
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Reset All Data
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Reset All Account Data?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete all your data including:
                        <br />• All fasting and walking sessions
                        <br />• Food entries and custom foods
                        <br />• Motivators and chat conversations
                        <br />• Profile information (weight, height, etc.)
                        <br /><br />
                        Your account will remain active but all data will be lost. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleResetAccount} className="bg-orange-600 hover:bg-orange-700">
                        Reset All Data
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                {/* Delete Account Button */}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="w-full border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Account
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Account Permanently?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete your account and all associated data. 
                        If you have an active subscription, it will be canceled first and deletion will be scheduled.
                        <br /><br />
                        This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteAccount} className="bg-red-600 hover:bg-red-700">
                        Delete Account
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Account;
