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

export const UserRequestLimits: React.FC = () => {
  const [paidUserLimit, setPaidUserLimit] = useState('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadCurrentLimits();
  }, []);

  const loadCurrentLimits = async () => {
    try {
      const { data, error } = await supabase
        .from('shared_settings')
        .select('setting_value')
        .eq('setting_key', 'monthly_request_limit')
        .maybeSingle();

      if (error) {
        console.error('Error loading request limits:', error);
        setPaidUserLimit('1000');
        return;
      }

      setPaidUserLimit(data?.setting_value || '1000');
    } catch (error) {
      console.error('Error loading request limits:', error);
      setPaidUserLimit('1000');
    } finally {
      setLoading(false);
    }
  };

  const saveRequestLimits = async () => {
    try {
      const { error } = await supabase
        .from('shared_settings')
        .upsert({
          setting_key: 'monthly_request_limit',
          setting_value: paidUserLimit
        }, { onConflict: 'setting_key' });

      if (error) {
        console.error('Error saving request limit:', error);
        throw error;
      }

      toast({
        title: "Success",
        description: "Monthly request limit saved successfully",
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
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Label htmlFor="paidUserLimit" className="text-xs">Monthly Limit</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-3 h-3 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    Monthly AI requests for paid users (free users get 0 requests)
                  </TooltipContent>
                </Tooltip>
              </div>
              <Input
                id="paidUserLimit"
                type="number"
                value={paidUserLimit}
                onChange={(e) => setPaidUserLimit(e.target.value)}
                placeholder="1000"
                className="h-8 w-24 text-sm"
                aria-label="Monthly AI requests for paid users"
              />
            </div>

            <div className="ml-auto">
              <Button onClick={saveRequestLimits} size="sm" className="h-9 px-4">
                Save
              </Button>
            </div>
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
};