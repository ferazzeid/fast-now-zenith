import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface ChatSettings {
  strictMode: boolean;
  redirectMessage: string;
  allowedTopics: string;
}

export function AdminFoodChatSettings() {
  const [settings, setSettings] = useState<ChatSettings>({
    strictMode: true,
    redirectMessage: "I'm your food tracking assistant. I can help you log meals, analyze nutrition, and manage your food library. Let's keep our conversation focused on food and nutrition topics!",
    allowedTopics: "food,nutrition,meals,calories,carbs,diet,health,cooking,ingredients,recipes"
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('shared_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['food_chat_strict_mode', 'food_chat_redirect_message', 'food_chat_allowed_topics']);

      if (error) throw error;

      const settingsMap = data?.reduce((acc, item) => {
        acc[item.setting_key] = item.setting_value;
        return acc;
      }, {} as Record<string, string>) || {};

      setSettings({
        strictMode: settingsMap.food_chat_strict_mode === 'true',
        redirectMessage: settingsMap.food_chat_redirect_message || settings.redirectMessage,
        allowedTopics: settingsMap.food_chat_allowed_topics || settings.allowedTopics
      });
    } catch (error) {
      console.error('Error loading chat settings:', error);
      toast.error('Failed to load chat settings');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const updates = [
        { setting_key: 'food_chat_strict_mode', setting_value: settings.strictMode.toString() },
        { setting_key: 'food_chat_redirect_message', setting_value: settings.redirectMessage },
        { setting_key: 'food_chat_allowed_topics', setting_value: settings.allowedTopics }
      ];

      for (const update of updates) {
        const { error } = await supabase
          .from('shared_settings')
          .upsert(update, { onConflict: 'setting_key' });

        if (error) throw error;
      }

      toast.success('Chat settings updated successfully');
    } catch (error) {
      console.error('Error saving chat settings:', error);
      toast.error('Failed to save chat settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Food Chat Settings</CardTitle>
          <CardDescription>Configure AI chat behavior and guardrails</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Food Chat Settings</CardTitle>
        <CardDescription>
          Configure AI chat behavior and topic guardrails for the food tracking assistant
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="strict-mode">Strict Mode</Label>
            <p className="text-sm text-muted-foreground">
              When enabled, the AI will strictly enforce food-related topics and redirect off-topic conversations
            </p>
          </div>
          <Switch
            id="strict-mode"
            checked={settings.strictMode}
            onCheckedChange={(checked) => 
              setSettings(prev => ({ ...prev, strictMode: checked }))
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="redirect-message">Redirect Message</Label>
          <Textarea
            id="redirect-message"
            placeholder="Message to show when users ask about off-topic subjects..."
            value={settings.redirectMessage}
            onChange={(e) => 
              setSettings(prev => ({ ...prev, redirectMessage: e.target.value }))
            }
            rows={4}
          />
          <p className="text-sm text-muted-foreground">
            This message will be shown when users ask about non-food topics (only when strict mode is enabled)
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="allowed-topics">Allowed Topics</Label>
          <Input
            id="allowed-topics"
            placeholder="food,nutrition,meals,calories..."
            value={settings.allowedTopics}
            onChange={(e) => 
              setSettings(prev => ({ ...prev, allowedTopics: e.target.value }))
            }
          />
          <p className="text-sm text-muted-foreground">
            Comma-separated list of allowed conversation topics (used by AI to determine relevance)
          </p>
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={saveSettings} 
            disabled={saving}
            className="flex items-center gap-2"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Save Settings
          </Button>
          <Button 
            variant="outline" 
            onClick={loadSettings}
            disabled={saving}
          >
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}