import React, { useEffect, useState } from "react";
import { AdminSubnav } from "@/components/AdminSubnav";
import { usePageSEO } from "@/hooks/usePageSEO";
import { OpenAIApiStats } from "@/components/OpenAIApiStats";
import { UserRequestLimits } from "@/components/UserRequestLimits";
import { useStandardizedLoading } from "@/hooks/useStandardizedLoading";
import { AdminHealthCheck } from "@/components/AdminHealthCheck";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

function SharedKeySettings() {
  const [sharedKey, setSharedKey] = useState("");
  const { toast } = useToast();
  const { isLoading, execute } = useStandardizedLoading();

  useEffect(() => {
    execute(async () => {
      const { data, error } = await supabase
        .from('shared_settings')
        .select('setting_value')
        .eq('setting_key', 'shared_api_key')
        .maybeSingle();
      if (!error && data?.setting_value) setSharedKey(data.setting_value);
      return data;
    });
  }, [execute]);

  const save = async () => {
    await execute(async () => {
      const { error } = await supabase
        .from('shared_settings')
        .upsert({ setting_key: 'shared_api_key', setting_value: sharedKey });
      if (error) throw error;
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

        <section aria-label="AI request limits">
          <UserRequestLimits />
        </section>

        <section aria-label="OpenAI API statistics">
          <OpenAIApiStats />
        </section>


      </main>
    </AdminHealthCheck>
  );
}