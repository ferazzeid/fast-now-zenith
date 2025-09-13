import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Settings, Smartphone, Globe, Code, Palette } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImageUpload } from "@/components/ImageUpload";
import { getEnvironmentConfig, isDevelopment } from "@/config/environment";

interface AppSettings {
  // App Identity
  appName: string;
  shortName: string;
  description: string;
  appId: string;
  internalName: string;
  
  // Visual Assets
  appIcon: string;
  favicon: string;
  logo: string;
  
  // PWA Settings
  themeColor: string;
  backgroundColor: string;
  
  // Capacitor Settings
  webUrl: string;
}

export const AppIdentitySettings: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings>({
    appName: '',
    shortName: '',
    description: '',
    appId: '',
    internalName: '',
    appIcon: '',
    favicon: '',
    logo: '',
    themeColor: '',
    backgroundColor: '',
    webUrl: ''
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadCurrentSettings();
  }, []);

  const loadCurrentSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('shared_settings')
        .select('setting_key, setting_value')
        .in('setting_key', [
          'pwa_app_name',
          'pwa_short_name', 
          'pwa_description',
          'app_id',
          'app_internal_name',
          'app_icon_url',
          'app_favicon',
          'app_logo',
          'pwa_theme_color',
          'pwa_background_color',
          'app_web_url'
        ]);

      if (error) {
        console.error('Error loading app settings:', error);
        setDefaults();
        return;
      }

      // Set defaults first
      setDefaults();

      // Then override with database values if they exist
      const newSettings = { ...settings };
      data?.forEach(setting => {
        switch (setting.setting_key) {
          case 'pwa_app_name':
            newSettings.appName = setting.setting_value || 'FastNow - Mindful App';
            break;
          case 'pwa_short_name':
            newSettings.shortName = setting.setting_value || 'FastNow';
            break;
          case 'pwa_description':
            newSettings.description = setting.setting_value || 'Your mindful app with AI-powered motivation';
            break;
          case 'app_id':
            newSettings.appId = setting.setting_value || getEnvironmentConfig().appId;
            break;
          case 'app_internal_name':
            newSettings.internalName = setting.setting_value || getEnvironmentConfig().appName;
            break;
          case 'app_icon_url':
            newSettings.appIcon = setting.setting_value || '';
            break;
          case 'app_favicon':
            newSettings.favicon = setting.setting_value || '';
            break;
          case 'app_logo':
            newSettings.logo = setting.setting_value || '';
            break;
          case 'pwa_theme_color':
            newSettings.themeColor = setting.setting_value || getEnvironmentConfig().android.colorPrimary;
            break;
          case 'pwa_background_color':
            newSettings.backgroundColor = setting.setting_value || getEnvironmentConfig().android.backgroundLight;
            break;
          case 'app_web_url':
            newSettings.webUrl = setting.setting_value || (getEnvironmentConfig().serverUrl || '');
            break;
        }
      });
      
      setSettings(newSettings);
    } catch (error) {
      console.error('Error loading app settings:', error);
      setDefaults();
    } finally {
      setLoading(false);
    }
  };

  const setDefaults = () => {
    const envConfig = getEnvironmentConfig();
    setSettings({
      appName: envConfig.displayName,
      shortName: 'FastNow',
      description: 'Your mindful app with AI-powered motivation',
      appId: envConfig.appId,
      internalName: envConfig.appName,
      appIcon: '',
      favicon: '',
      logo: '',
      themeColor: envConfig.android.colorPrimary,
      backgroundColor: envConfig.android.backgroundLight,
      webUrl: envConfig.serverUrl || ''
    });
  };

  const updateSetting = (key: keyof AppSettings, value: string) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const saveAllSettings = async () => {
    setSaving(true);
    try {
      const updates = [
        { setting_key: 'pwa_app_name', setting_value: settings.appName },
        { setting_key: 'pwa_short_name', setting_value: settings.shortName },
        { setting_key: 'pwa_description', setting_value: settings.description },
        { setting_key: 'app_id', setting_value: settings.appId },
        { setting_key: 'app_internal_name', setting_value: settings.internalName },
        { setting_key: 'app_icon_url', setting_value: settings.appIcon },
        { setting_key: 'app_favicon', setting_value: settings.favicon },
        { setting_key: 'app_logo', setting_value: settings.logo },
        { setting_key: 'pwa_theme_color', setting_value: settings.themeColor },
        { setting_key: 'pwa_background_color', setting_value: settings.backgroundColor },
        { setting_key: 'app_web_url', setting_value: settings.webUrl }
      ];

      for (const update of updates) {
        const { error } = await supabase
          .from('shared_settings')
          .upsert(update, { onConflict: 'setting_key' });

        if (error) {
          console.error('Error saving app setting:', error);
          throw error;
        }
      }

      // Force PWA cache refresh and manifest update
      const { forcePWARefresh } = await import('@/utils/pwaCache');
      const refreshSuccess = await forcePWARefresh();
      
      if (refreshSuccess) {
        console.log('PWA cache refreshed successfully');
      } else {
        console.warn('PWA cache refresh had issues, but settings were saved');
      }

      toast({
        title: "✅ Settings Saved!",
        description: "App identity settings updated successfully. PWA manifest refreshed - try 'Add to Home Screen' again!",
      });
    } catch (error) {
      console.error('Error saving app settings:', error);
      toast({
        title: "Error",
        description: `Failed to save settings: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateCapacitorConfig = async () => {
    try {
      // This would generate a new capacitor.config.ts file with the updated settings
      const configContent = `import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: '${settings.appId}',
  appName: '${settings.internalName}',
  webDir: 'dist',
  server: {
    url: '${settings.webUrl}',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0
    },
    StatusBar: {
      style: 'default'
    }
  }
};

export default config;`;

      // Save to settings for reference
      await supabase
        .from('shared_settings')
        .upsert({ 
          setting_key: 'capacitor_config_content', 
          setting_value: configContent 
        }, { onConflict: 'setting_key' });

      toast({
        title: "🚀 Capacitor Config Generated!",
        description: "The capacitor.config.ts file content has been generated. Copy it to your local project after exporting to GitHub.",
      });
    } catch (error) {
      console.error('Error generating capacitor config:', error);
      toast({
        title: "Error",
        description: "Failed to generate Capacitor config",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings className="w-5 h-5" />
            App Identity & Branding
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <span className="text-muted-foreground">Loading...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Settings className="w-5 h-5" />
          App Identity & Branding
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Configure your app's name, icons, and branding across all platforms
        </p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="identity" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="identity" className="flex items-center gap-1">
              <Smartphone className="w-4 h-4" />
              Identity
            </TabsTrigger>
            <TabsTrigger value="pwa" className="flex items-center gap-1">
              <Globe className="w-4 h-4" />
              PWA
            </TabsTrigger>
            <TabsTrigger value="native" className="flex items-center gap-1">
              <Code className="w-4 h-4" />
              Native
            </TabsTrigger>
          </TabsList>

          <TabsContent value="identity" className="space-y-4 mt-6">
            <div className="space-y-2">
              <Label htmlFor="appName">App Name (Full)</Label>
              <Input
                id="appName"
                value={settings.appName}
                onChange={(e) => updateSetting('appName', e.target.value)}
                placeholder="FastNow - Mindful App"
              />
              <p className="text-xs text-muted-foreground">
                The full name shown in app stores and browser tabs
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="shortName">Short Name</Label>
              <Input
                id="shortName"
                value={settings.shortName}
                onChange={(e) => updateSetting('shortName', e.target.value)}
                placeholder="FastNow"
              />
              <p className="text-xs text-muted-foreground">
                Short name for home screen icons (12 characters max)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={settings.description}
                onChange={(e) => updateSetting('description', e.target.value)}
                placeholder="Your mindful app with AI-powered motivation"
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                App description for app stores and PWA install prompts
              </p>
            </div>
          </TabsContent>


          <TabsContent value="pwa" className="space-y-4 mt-6">
            <div className="space-y-2">
              <Label htmlFor="themeColor">Theme Color</Label>
              <div className="flex gap-2">
                <Input
                  id="themeColor"
                  value={settings.themeColor}
                  onChange={(e) => updateSetting('themeColor', e.target.value)}
                  placeholder="#8B7355"
                />
                <input
                  type="color"
                  value={settings.themeColor}
                  onChange={(e) => updateSetting('themeColor', e.target.value)}
                  className="w-12 h-10 rounded border border-input"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Browser and status bar theme color
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="backgroundColor">Background Color</Label>
              <div className="flex gap-2">
                <Input
                  id="backgroundColor"
                  value={settings.backgroundColor}
                  onChange={(e) => updateSetting('backgroundColor', e.target.value)}
                  placeholder="#F5F2EA"
                />
                <input
                  type="color"
                  value={settings.backgroundColor}
                  onChange={(e) => updateSetting('backgroundColor', e.target.value)}
                  className="w-12 h-10 rounded border border-input"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Splash screen background color
              </p>
            </div>
          </TabsContent>

          <TabsContent value="native" className="space-y-4 mt-6">
            <div className="space-y-2">
              <Label htmlFor="appId">App ID (Bundle Identifier)</Label>
              <Input
                id="appId"
                value={settings.appId}
                onChange={(e) => updateSetting('appId', e.target.value)}
                placeholder="com.fastnow.zenith"
              />
              <p className="text-xs text-muted-foreground">
                Unique identifier for app stores (reverse domain format)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="internalName">Internal Name</Label>
              <Input
                id="internalName"
                value={settings.internalName}
                onChange={(e) => updateSetting('internalName', e.target.value)}
                placeholder="fast-now-zenith"
              />
              <p className="text-xs text-muted-foreground">
                Internal project name (kebab-case, no spaces)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="webUrl">Development URL</Label>
              <Input
                id="webUrl"
                value={settings.webUrl}
                onChange={(e) => updateSetting('webUrl', e.target.value)}
                placeholder="https://..."
              />
              <p className="text-xs text-muted-foreground">
                Live reload URL for development
              </p>
            </div>

            <div className="pt-4">
              <Button 
                onClick={updateCapacitorConfig} 
                variant="outline"
                className="w-full"
              >
                Generate Capacitor Config
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                Generate capacitor.config.ts content for your local project
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex gap-3 pt-6 mt-6 border-t">
          <Button 
            onClick={saveAllSettings} 
            disabled={saving}
            className="flex-1"
          >
            {saving ? 'Saving...' : 'Save All Settings'}
          </Button>
          <Button 
            onClick={loadCurrentSettings} 
            variant="outline"
            disabled={saving}
          >
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};