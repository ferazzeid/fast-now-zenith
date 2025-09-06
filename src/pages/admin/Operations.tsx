import React, { useEffect, useState } from "react";
import { AdminSubnav } from "@/components/AdminSubnav";
import { usePageSEO } from "@/hooks/usePageSEO";
import { AdminRoleTester } from "@/components/AdminRoleTester";
import { SimpleAnalyticsWidget } from "@/components/SimpleAnalyticsWidget";
import { CancellationTracker } from "@/components/CancellationTracker";
import { AdminTierStats } from "@/components/AdminTierStats";
import { UserRequestLimits } from "@/components/UserRequestLimits";
import { GoogleAnalyticsSettings } from "@/components/GoogleAnalyticsSettings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ClearSubscriptionCacheButton } from "@/components/ClearSubscriptionCacheButton";
import { AdminHealthCheck } from "@/components/AdminHealthCheck";
import { AdminAppModeSwitcher } from "@/components/AdminAppModeSwitcher";

export default function AdminOperations() {
  usePageSEO({
    title: "Admin Operations – Engagement & Monitoring",
    description: "Monitor engagement, usage, and manage operational thresholds.",
    canonicalPath: "/admin/operations",
  });

  return (
    <AdminHealthCheck>
      <main className="container mx-auto p-6 space-y-8 overflow-x-hidden bg-background min-h-[calc(100vh-80px)]" role="main">
        <h1 className="sr-only">Admin Operations</h1>
        <AdminSubnav />

        <section aria-label="App mode settings">
          <AdminAppModeSwitcher />
        </section>

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

        <section aria-label="Google Analytics settings">
          <GoogleAnalyticsSettings />
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
    </AdminHealthCheck>
  );
}
