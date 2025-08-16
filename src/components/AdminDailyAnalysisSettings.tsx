import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Brain } from "lucide-react";

export const AdminDailyAnalysisSettings = () => {
  const [analysisPrompt, setAnalysisPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchAnalysisSettings();
  }, []);

  const fetchAnalysisSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('shared_settings')
        .select('setting_value')
        .eq('setting_key', 'daily_analysis_prompt')
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      setAnalysisPrompt(data?.setting_value || '');
    } catch (error) {
      console.error('Error fetching analysis settings:', error);
    }
  };

  const saveAnalysisSettings = async () => {
    setLoading(true);
    try {
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
    } catch (error) {
      console.error('Error saving analysis settings:', error);
      toast({
        title: "Error",
        description: "Failed to save analysis settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
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
        <Button 
          onClick={saveAnalysisSettings}
          disabled={loading}
          className="w-full sm:w-auto"
        >
          {loading ? 'Saving...' : 'Save Settings'}
        </Button>
      </CardFooter>
    </Card>
  );
};