import React, { useEffect, useState } from "react";
import { AdminSubnav } from "@/components/AdminSubnav";
import { usePageSEO } from "@/hooks/usePageSEO";
import { OpenAIApiStats } from "@/components/OpenAIApiStats";
import { PromptManagement } from "@/components/PromptManagement";
import { AdminHealthCheck } from "@/components/AdminHealthCheck";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

function AppPhilosophySettings() {
  const [philosophy, setPhilosophy] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadPhilosophy();
  }, []);

  const loadPhilosophy = async () => {
    try {
      const { data, error } = await supabase
        .from('shared_settings')
        .select('setting_value')
        .eq('setting_key', 'app_philosophy_foundation')
        .maybeSingle();
      
      if (!error && data?.setting_value) {
        setPhilosophy(data.setting_value);
      }
    } catch (error) {
      console.error('Failed to load app philosophy:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePhilosophy = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('shared_settings')
        .upsert({ 
          setting_key: 'app_philosophy_foundation', 
          setting_value: philosophy 
        });
      
      if (error) throw error;
      
      toast({ 
        title: 'Saved', 
        description: 'App philosophy updated successfully. This will guide all AI conversations.' 
      });
    } catch (error: any) {
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to save philosophy', 
        variant: 'destructive' 
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>App Philosophy & Foundation</CardTitle>
        <p className="text-sm text-muted-foreground">
          Define the core philosophy, mission, and values that will guide all AI conversations. 
          This becomes the "north star" for how the AI represents your app.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="philosophy">Core Philosophy & Foundation</Label>
          <Textarea
            id="philosophy"
            value={philosophy}
            onChange={(e) => setPhilosophy(e.target.value)}
            placeholder="Define your app's core philosophy, primary mission, conversation guidelines, and key values that should guide every AI interaction..."
            className="min-h-32"
            disabled={loading}
          />
          <p className="text-xs text-muted-foreground">
            Include: What your app stands for, its primary mission, how the AI should approach conversations, 
            and the key principles that should guide all interactions.
          </p>
        </div>
        <Button 
          onClick={savePhilosophy} 
          disabled={saving || loading}
          className="w-full sm:w-auto"
        >
          {saving ? 'Saving...' : 'Save Philosophy'}
        </Button>
      </CardContent>
    </Card>
  );
}

function SharedKeySettings() {
  const [sharedKey, setSharedKey] = useState("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase
          .from('shared_settings')
          .select('setting_value')
          .eq('setting_key', 'shared_api_key')
          .maybeSingle();
        if (!error && data?.setting_value) setSharedKey(data.setting_value);
      } catch (e) {
        console.warn('Failed to load shared key');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const save = async () => {
    try {
      const { error } = await supabase
        .from('shared_settings')
        .upsert({ setting_key: 'shared_api_key', setting_value: sharedKey });
      if (error) throw error;
      toast({ title: 'Saved', description: 'Shared OpenAI API key updated.' });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Failed to save key', variant: 'destructive' });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">OpenAI API Configuration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1">
          <Label htmlFor="sharedKey" className="text-sm">Shared API Key (used for paid users)</Label>
          <Input
            id="sharedKey"
            type="password"
            value={sharedKey}
            onChange={(e) => setSharedKey(e.target.value)}
            placeholder="sk-..."
            disabled={loading}
            className="font-mono"
          />
        </div>
        <Button onClick={save} className="w-full sm:w-auto">Save</Button>
      </CardContent>
    </Card>
  );
}


export default function AdminAI() {
  usePageSEO({
    title: "Admin AI – Configuration & Philosophy",
    description: "Configure AI settings, philosophy, and behavior.",
    canonicalPath: "/admin/ai",
  });

  return (
    <AdminHealthCheck>
      <main className="container mx-auto p-6 space-y-8 overflow-x-hidden bg-background min-h-[calc(100vh-80px)]" role="main">
        <h1 className="sr-only">Admin AI Configuration</h1>
        <AdminSubnav />

        <section aria-label="App philosophy and foundation">
          <AppPhilosophySettings />
        </section>

        <section aria-label="OpenAI API configuration">
          <SharedKeySettings />
        </section>

        <section aria-label="OpenAI API statistics">
          <OpenAIApiStats />
        </section>

        <section aria-label="AI prompt management">
          <PromptManagement />
        </section>


      </main>
    </AdminHealthCheck>
  );
}