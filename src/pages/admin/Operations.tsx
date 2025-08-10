import React, { useEffect, useState } from "react";
import { AdminSubnav } from "@/components/AdminSubnav";
import { usePageSEO } from "@/hooks/usePageSEO";
import { AdminRoleTester } from "@/components/AdminRoleTester";
import { SimpleAnalyticsWidget } from "@/components/SimpleAnalyticsWidget";
import { CancellationTracker } from "@/components/CancellationTracker";
import { AdminTierStats } from "@/components/AdminTierStats";
import { UserRequestLimits } from "@/components/UserRequestLimits";
import { OpenAIApiStats } from "@/components/OpenAIApiStats";
import { GoogleAnalyticsSettings } from "@/components/GoogleAnalyticsSettings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ClearSubscriptionCacheButton } from "@/components/ClearSubscriptionCacheButton";

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
        <CardTitle className="text-base">Shared OpenAI API Key</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1">
          <Label htmlFor="sharedKey" className="text-sm">Shared Key (used for Paid users in trial or subscribed)</Label>
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

export default function AdminOperations() {
  usePageSEO({
    title: "Admin Operations – Engagement & Monitoring",
    description: "Monitor engagement, usage, and manage operational thresholds.",
    canonicalPath: "/admin/operations",
  });

  return (
    <main className="container mx-auto p-6 space-y-8 overflow-x-hidden bg-background min-h-[calc(100vh-80px)]" role="main">
      <h1 className="sr-only">Admin Operations</h1>
      <AdminSubnav />


      <section aria-label="Real-time analytics">
        <SimpleAnalyticsWidget />
      </section>

      <section aria-label="Cancellation tracking">
        <CancellationTracker />
      </section>

      <section aria-label="User request limits">
        <UserRequestLimits />
      </section>

      <section aria-label="User tiers overview">
        <AdminTierStats />
      </section>

      <section aria-label="OpenAI API statistics">
        <OpenAIApiStats />
      </section>

      <section aria-label="Google Analytics settings">
        <GoogleAnalyticsSettings />
      </section>

      <section aria-label="Shared OpenAI key">
        <SharedKeySettings />
      </section>
      
      <section aria-label="Cache management" className="pb-24">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cache Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Clear subscription cache if users are experiencing incorrect premium access on mobile devices.
              </p>
              <ClearSubscriptionCacheButton />
            </div>
          </CardContent>
        </Card>
        <div className="h-8" />
      </section>
    </main>
  );
}
