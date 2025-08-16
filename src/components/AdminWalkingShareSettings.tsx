import React, { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Share2 } from "lucide-react";

export const AdminWalkingShareSettings = () => {
  const [motivationalText, setMotivationalText] = useState('Staying active and feeling great! 💪');
  const [hashtags, setHashtags] = useState('#FastNowApp');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('shared_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['walking_share_motivational_text', 'walking_share_hashtags']);

      if (error) throw error;

      if (data) {
        data.forEach(setting => {
          if (setting.setting_key === 'walking_share_motivational_text') {
            setMotivationalText(setting.setting_value || 'Staying active and feeling great! 💪');
          } else if (setting.setting_key === 'walking_share_hashtags') {
            setHashtags(setting.setting_value || '#FastNowApp');
          }
        });
      }
    } catch (error) {
      console.error('Error loading walking share settings:', error);
      toast({
        title: "Error",
        description: "Failed to load walking share settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveMotivationalText = async () => {
    try {
      const { error } = await supabase
        .from('shared_settings')
        .upsert({
          setting_key: 'walking_share_motivational_text',
          setting_value: motivationalText,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Motivational text saved successfully",
      });
    } catch (error) {
      console.error('Error saving motivational text:', error);
      toast({
        title: "Error",
        description: "Failed to save motivational text",
        variant: "destructive",
      });
    }
  };

  const saveHashtags = async () => {
    try {
      const { error } = await supabase
        .from('shared_settings')
        .upsert({
          setting_key: 'walking_share_hashtags',
          setting_value: hashtags,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Hashtags saved successfully",
      });
    } catch (error) {
      console.error('Error saving hashtags:', error);
      toast({
        title: "Error",
        description: "Failed to save hashtags",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Share2 className="w-5 h-5 text-blue-500" />
          Walking Share Messages
        </CardTitle>
        <CardDescription>
          Customize the motivational text and hashtags used when users share their walking sessions on Facebook
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="motivationalText" className="text-sm font-medium">
              Motivational Text
            </Label>
            <Textarea
              id="motivationalText"
              value={motivationalText}
              onChange={(e) => setMotivationalText(e.target.value)}
              placeholder="Staying active and feeling great! 💪"
              className="min-h-[80px]"
            />
            <p className="text-xs text-muted-foreground">
              This text will appear after the walking stats in the shared post
            </p>
          </div>
          <Button onClick={saveMotivationalText} className="w-full sm:w-auto">
            Save Motivational Text
          </Button>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="hashtags" className="text-sm font-medium">
              Hashtags
            </Label>
            <Input
              id="hashtags"
              value={hashtags}
              onChange={(e) => setHashtags(e.target.value)}
              placeholder="#FastNowApp #walking #fitness"
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Hashtags to include in the shared post (separate with spaces)
            </p>
          </div>
          <Button onClick={saveHashtags} className="w-full sm:w-auto">
            Save Hashtags
          </Button>
        </div>

        <div className="p-4 bg-muted/50 rounded-lg border">
          <h4 className="font-medium mb-2">Preview</h4>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>🚶‍♂️ Walking Update!</p>
            <p>⏱️ 25 minutes</p>
            <p>🔥 142 calories burned</p>
            <p>📍 1.2 miles covered</p>
            <p>⚡ Fast pace</p>
            <p className="mt-2">{motivationalText}</p>
            <p className="text-blue-600">{hashtags}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};