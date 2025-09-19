import React, { useEffect, useState } from "react";
import { AdminSubnav } from "@/components/AdminSubnav";
import { usePageSEO } from "@/hooks/usePageSEO";
import { EnhancedOpenAIStats } from "@/components/EnhancedOpenAIStats";
import { UserRequestLimits } from "@/components/UserRequestLimits";
import { useStandardizedLoading } from "@/hooks/useStandardizedLoading";
import { AdminHealthCheck } from "@/components/AdminHealthCheck";
import { AdminCurrentModels } from "@/components/AdminCurrentModels";
import { AdminModelSelector } from "@/components/AdminModelSelector";
import { AdminModelTester } from "@/components/AdminModelTester";
import { AdminCostCalculator } from "@/components/AdminCostCalculator";
import { AdminMultiImageSettings } from "@/components/AdminMultiImageSettings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

function SharedKeySettings() {
  const [sharedKey, setSharedKey] = useState("");
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const { toast } = useToast();
  const { isLoading, execute } = useStandardizedLoading();

  useEffect(() => {
    execute(async () => {
      const { data, error } = await supabase
        .from('shared_settings')
        .select('setting_value, updated_at')
        .eq('setting_key', 'shared_api_key')
        .maybeSingle();
      
      if (!error && data) {
        if (data.setting_value) setSharedKey(data.setting_value);
        if (data.updated_at) {
          setLastUpdated(new Date(data.updated_at).toLocaleString());
        }
      }
      return data;
    });
  }, [execute]);

  const save = async () => {
    await execute(async () => {
      const { error } = await supabase
        .from('shared_settings')
        .upsert({ setting_key: 'shared_api_key', setting_value: sharedKey });
      if (error) throw error;
      
      // Update the timestamp after successful save
      setLastUpdated(new Date().toLocaleString());
      return true;
    }, {
      onSuccess: () => {
        toast({ title: 'Saved', description: 'Shared OpenAI API key updated.' });
      },
      onError: (error) => {
        toast({ title: 'Error', description: error.message || 'Failed to save key', variant: 'destructive' });
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">OpenAI API Configuration</CardTitle>
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
            disabled={isLoading}
            className="font-mono"
          />
        </div>
        <Button onClick={save} className="w-full sm:w-auto" disabled={isLoading}>
          {isLoading ? "Saving..." : "Save"}
        </Button>
        {lastUpdated && (
          <div className="text-xs text-muted-foreground mt-2">
            Last saved: {lastUpdated}
          </div>
        )}
      </CardContent>
    </Card>
  );
}


export default function AdminAI() {
  usePageSEO({
    title: "Admin AI – Configuration & API",
    description: "Configure AI settings and API keys.",
    canonicalPath: "/admin/ai",
  });

  return (
    <AdminHealthCheck>
      <main className="container mx-auto p-6 space-y-8 overflow-x-hidden bg-background min-h-[calc(100vh-80px)] pb-32" role="main">
        <h1 className="sr-only">Admin AI Configuration</h1>
        <AdminSubnav />

        <section aria-label="OpenAI API configuration">
          <SharedKeySettings />
        </section>

        <section aria-label="AI model selection">
          <AdminModelSelector />
        </section>

        <section aria-label="Multi-image food analysis settings">
          <AdminMultiImageSettings />
        </section>

        <section aria-label="Cost calculator">
          <AdminCostCalculator />
        </section>

        <section aria-label="Model testing">
          <AdminModelTester />
        </section>

        <section aria-label="Current OpenAI models">
          <AdminCurrentModels />
        </section>

        <section aria-label="AI request limits">
          <UserRequestLimits />
        </section>

        <section aria-label="OpenAI API statistics">
          <EnhancedOpenAIStats />
        </section>


      </main>
    </AdminHealthCheck>
  );
}