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
        .in('setting_key', ['monthly_request_limit', 'free_request_limit']);

      if (error) {
        console.error('Error loading request limits:', error);
        // Set defaults if no data exists
        setPaidUserLimit('1000');
        setGrantedUserLimit('15');
        return;
      }

      // Set defaults first
      setPaidUserLimit('1000');
      setGrantedUserLimit('15');

      // Then override with database values if they exist
      data?.forEach(setting => {
        if (setting.setting_key === 'monthly_request_limit') {
          setPaidUserLimit(setting.setting_value || '1000');
        } else if (setting.setting_key === 'free_request_limit') {
          setGrantedUserLimit(setting.setting_value || '15');
        }
      });
    } catch (error) {
      console.error('Error loading request limits:', error);
      // Set defaults on error
      setPaidUserLimit('1000');
      setGrantedUserLimit('15');
    } finally {
      setLoading(false);
    }
  };

  const saveRequestLimits = async () => {
    try {
      const updates = [
        {
          setting_key: 'monthly_request_limit',
          setting_value: paidUserLimit
        },
        {
          setting_key: 'free_request_limit',
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
          <SmartInlineLoading text="Loading usage data" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">User Request Limits</CardTitle>
      </CardHeader>
      <CardContent>
        <TooltipProvider>
          <div className="flex flex-wrap items-center gap-3">
            {/* Paid User Limit */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Label htmlFor="paidUserLimit" className="text-xs">Paid</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-3 h-3 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    Monthly requests for paid users
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
                aria-label="Paid user monthly requests"
              />
            </div>

            {/* Granted User Limit */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Label htmlFor="grantedUserLimit" className="text-xs">Granted</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-3 h-3 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    Monthly requests for granted users
                  </TooltipContent>
                </Tooltip>
              </div>
              <Input
                id="grantedUserLimit"
                type="number"
                value={grantedUserLimit}
                onChange={(e) => setGrantedUserLimit(e.target.value)}
                placeholder="15"
                className="h-8 w-24 text-sm"
                aria-label="Granted user monthly requests"
              />
            </div>

            {/* Save Button */}
            <div className="ml-auto">
              <Button onClick={saveRequestLimits} size="sm" className="h-8">
                Save
              </Button>
            </div>
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
};