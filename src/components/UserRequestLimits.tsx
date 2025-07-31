import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const UserRequestLimits: React.FC = () => {
  const [paidUserLimit, setPaidUserLimit] = useState('');
  const [grantedUserLimit, setGrantedUserLimit] = useState('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadCurrentLimits();
  }, []);

  const loadCurrentLimits = async () => {
    try {
      const { data, error } = await supabase
        .from('shared_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['paid_user_request_limit', 'granted_user_request_limit']);

      if (error) {
        console.error('Error loading request limits:', error);
        return;
      }

      data?.forEach(setting => {
        if (setting.setting_key === 'paid_user_request_limit') {
          setPaidUserLimit(setting.setting_value || '');
        } else if (setting.setting_key === 'granted_user_request_limit') {
          setGrantedUserLimit(setting.setting_value || '');
        }
      });
    } catch (error) {
      console.error('Error loading request limits:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveRequestLimits = async () => {
    try {
      const updates = [
        {
          setting_key: 'paid_user_request_limit',
          setting_value: paidUserLimit
        },
        {
          setting_key: 'granted_user_request_limit',
          setting_value: grantedUserLimit
        }
      ];

      for (const update of updates) {
        const { error } = await supabase
          .from('shared_settings')
          .upsert(update, { onConflict: 'setting_key' });

        if (error) {
          console.error('Error saving request limit:', error);
          throw error;
        }
      }

      toast({
        title: "Success",
        description: "User request limits saved successfully",
      });
    } catch (error) {
      console.error('Error saving request limits:', error);
      toast({
        title: "Error",
        description: `Failed to save request limits: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">User Request Limits</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-sm text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">User Request Limits</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Paid User Limit */}
          <div className="space-y-2">
            <Label htmlFor="paidUserLimit" className="text-sm font-medium">
              Paid User Monthly Requests
            </Label>
            <Input
              id="paidUserLimit"
              type="number"
              value={paidUserLimit}
              onChange={(e) => setPaidUserLimit(e.target.value)}
              placeholder="e.g. 1000"
              className="text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Number of API requests per month for paid users
            </p>
          </div>

          {/* Granted User Limit */}
          <div className="space-y-2">
            <Label htmlFor="grantedUserLimit" className="text-sm font-medium">
              Granted User Monthly Requests
            </Label>
            <Input
              id="grantedUserLimit"
              type="number"
              value={grantedUserLimit}
              onChange={(e) => setGrantedUserLimit(e.target.value)}
              placeholder="e.g. 100"
              className="text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Number of gifted API requests per month for granted users
            </p>
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-6">
          <Button onClick={saveRequestLimits} className="w-full sm:w-auto">
            Save Request Limits
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};