import React, { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Brain } from "lucide-react";
import { useStandardizedLoading } from '@/hooks/useStandardizedLoading';
import { SmartLoadingButton } from '@/components/SimpleLoadingComponents';

export const AdminDailyAnalysisSettings = () => {
  const { data: analysisPrompt, setData: setAnalysisPrompt, execute, isLoading } = useStandardizedLoading<string>('');
  const { toast } = useToast();

  useEffect(() => {
    fetchAnalysisSettings();
  }, []);

  const fetchAnalysisSettings = async () => {
    await execute(async () => {
      const { data, error } = await supabase
        .from('shared_settings')
        .select('setting_value')
        .eq('setting_key', 'daily_analysis_prompt')
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      return data?.setting_value || '';
    });
  };

  const saveAnalysisSettings = async () => {
    await execute(async () => {
      const { error } = await supabase
        .from('shared_settings')
        .upsert({
          setting_key: 'daily_analysis_prompt',
          setting_value: analysisPrompt,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Daily analysis settings saved successfully",
      });
      
      return analysisPrompt;
    }, {
      onError: (error) => {
        console.error('Error saving analysis settings:', error);
        toast({
          title: "Error",
          description: "Failed to save analysis settings",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" />
          Daily Progress Analysis
        </CardTitle>
        <CardDescription>
          Configure the AI prompt used for daily progress analysis
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="analysisPrompt">Analysis Prompt</Label>
          <Textarea
            id="analysisPrompt"
            value={analysisPrompt}
            onChange={(e) => setAnalysisPrompt(e.target.value)}
            placeholder="Enter the prompt for daily analysis..."
            rows={6}
            className="font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">
            This prompt will be used to generate personalized daily progress insights
          </p>
        </div>
      </CardContent>
      <CardFooter className="justify-end">
        <SmartLoadingButton 
          onClick={saveAnalysisSettings}
          isLoading={isLoading}
          loadingText="Saving..."
          className="w-full sm:w-auto"
        >
          Save Settings
        </SmartLoadingButton>
      </CardFooter>
    </Card>
  );
};