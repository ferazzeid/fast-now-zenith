import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Smartphone } from "lucide-react";
import { useStandardizedLoading } from '@/hooks/useStandardizedLoading';
import { SmartLoadingButton, SmartInlineLoading } from '@/components/SimpleLoadingComponents';

export const PWASettings: React.FC = () => {
  const [appName, setAppName] = useState('');
  const [shortName, setShortName] = useState('');
  const [description, setDescription] = useState('');
  const { toast } = useToast();
  
  const { isLoading: loadingSettings, execute: loadSettings } = useStandardizedLoading();
  const { isLoading: savingSettings, execute: saveSettings } = useStandardizedLoading();

  useEffect(() => {
    loadCurrentSettings();
  }, []);

  const loadCurrentSettings = () => {
    loadSettings(async () => {
      const { data, error } = await supabase
        .from('shared_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['pwa_app_name', 'pwa_short_name', 'pwa_description']);

      if (error) {
        console.error('Error loading PWA settings:', error);
        setDefaults();
        return;
      }

      // Set defaults first
      setDefaults();

      // Then override with database values if they exist
      data?.forEach(setting => {
        if (setting.setting_key === 'pwa_app_name') {
          setAppName(setting.setting_value || 'FastNow - Mindful App');
        } else if (setting.setting_key === 'pwa_short_name') {
          setShortName(setting.setting_value || 'FastNow');
        } else if (setting.setting_key === 'pwa_description') {
          setDescription(setting.setting_value || 'Your mindful app with AI-powered motivation');
        }
      });
    }, {
      onError: (error) => {
        console.error('Error loading PWA settings:', error);
        setDefaults();
      }
    });
  };

  const setDefaults = () => {
    setAppName('FastNow - Mindful App');
    setShortName('FastNow');
    setDescription('Your mindful app with AI-powered motivation');
  };

  const saveSettingsPWA = () => {
    saveSettings(async () => {
      const updates = [
        {
          setting_key: 'pwa_app_name',
          setting_value: appName
        },
        {
          setting_key: 'pwa_short_name',
          setting_value: shortName
        },
        {
          setting_key: 'pwa_description',
          setting_value: description
        }
      ];

      for (const update of updates) {
        const { error } = await supabase
          .from('shared_settings')
          .upsert(update, { onConflict: 'setting_key' });

        if (error) {
          console.error('Error saving PWA setting:', error);
          throw error;
        }
      }

      // Update the dynamic manifest
      await supabase.functions.invoke('dynamic-manifest');
    }, {
      onSuccess: () => {
        toast({
          title: "Success",
          description: "PWA settings saved successfully. The app icon and details will update on next install.",
        });
      },
      onError: (error) => {
        console.error('Error saving PWA settings:', error);
        toast({
          title: "Error",
          description: `Failed to save PWA settings: ${error.message}`,
          variant: "destructive",
        });
      }
    });
  };

  if (loadingSettings) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            App Icon & Slogan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SmartInlineLoading text="Loading PWA settings" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Smartphone className="w-5 h-5" />
          App Icon & Slogan
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="appName">App Name</Label>
          <Input
            id="appName"
            value={appName}
            onChange={(e) => setAppName(e.target.value)}
            placeholder="FastNow - Mindful App"
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="shortName">Short Name</Label>
          <Input
            id="shortName"
            value={shortName}
            onChange={(e) => setShortName(e.target.value)}
            placeholder="FastNow"
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Slogan / Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Your mindful app with AI-powered motivation"
            className="w-full"
            rows={3}
          />
        </div>

        <div className="pt-2">
          <SmartLoadingButton 
            onClick={saveSettingsPWA} 
            isLoading={savingSettings}
            loadingText="Saving..."
            className="h-9 px-4"
          >
            Save
          </SmartLoadingButton>
        </div>
      </CardContent>
    </Card>
  );
};