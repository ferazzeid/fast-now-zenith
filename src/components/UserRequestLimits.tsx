import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { SmartInlineLoading } from './enhanced/SmartLoadingStates';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import { useAccess } from '@/hooks/useAccess';

export const UserRequestLimits: React.FC = () => {
  const [trialUserLimit, setTrialUserLimit] = useState('');
  const [premiumUserLimit, setPremiumUserLimit] = useState('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { isAdmin } = useAccess();

  // Only show to admin users
  if (!isAdmin) {
    return null;
  }

  useEffect(() => {
    loadCurrentLimits();
  }, []);

  const loadCurrentLimits = async () => {
    try {
      const { data: settings, error } = await supabase
        .from('shared_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['trial_request_limit', 'monthly_request_limit']);

      if (error) {
        console.error('Error loading request limits:', error);
        setTrialUserLimit('50');
        setPremiumUserLimit('1000');
        return;
      }

      const trialLimit = settings?.find(s => s.setting_key === 'trial_request_limit')?.setting_value || '50';
      const premiumLimit = settings?.find(s => s.setting_key === 'monthly_request_limit')?.setting_value || '1000';
      
      setTrialUserLimit(trialLimit);
      setPremiumUserLimit(premiumLimit);
    } catch (error) {
      console.error('Error loading request limits:', error);
      setTrialUserLimit('50');
      setPremiumUserLimit('1000');
    } finally {
      setLoading(false);
    }
  };

  const saveRequestLimits = async () => {
    try {
      const updates = [
        {
          setting_key: 'trial_request_limit',
          setting_value: trialUserLimit
        },
        {
          setting_key: 'monthly_request_limit',
          setting_value: premiumUserLimit
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
        description: "Request limits saved successfully",
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
          <SmartInlineLoading text="Loading usage data" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">AI Request Limits</CardTitle>
      </CardHeader>
      <CardContent>
        <TooltipProvider>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <Label htmlFor="trialUserLimit" className="text-xs">Trial User Limit</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-3 h-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      AI requests available during free trial period
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  id="trialUserLimit"
                  type="number"
                  value={trialUserLimit}
                  onChange={(e) => setTrialUserLimit(e.target.value)}
                  placeholder="50"
                  className="h-8 w-24 text-sm"
                  aria-label="AI requests for trial users"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <Label htmlFor="premiumUserLimit" className="text-xs">Premium User Limit</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-3 h-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      Monthly AI requests for premium subscribers
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  id="premiumUserLimit"
                  type="number"
                  value={premiumUserLimit}
                  onChange={(e) => setPremiumUserLimit(e.target.value)}
                  placeholder="1000"
                  className="h-8 w-24 text-sm"
                  aria-label="Monthly AI requests for premium users"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={saveRequestLimits} size="sm" className="h-9 px-4">
                Save Limits
              </Button>
            </div>
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
};