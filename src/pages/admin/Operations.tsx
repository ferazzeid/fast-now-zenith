import React from "react";
import { AdminSubnav } from "@/components/AdminSubnav";
import { usePageSEO } from "@/hooks/usePageSEO";
import { AdminRoleTester } from "@/components/AdminRoleTester";
import { SimpleAnalyticsWidget } from "@/components/SimpleAnalyticsWidget";
import { CancellationTracker } from "@/components/CancellationTracker";
import { AdminTierStats } from "@/components/AdminTierStats";
import { UserRequestLimits } from "@/components/UserRequestLimits";
import { GoogleAnalyticsSettings } from "@/components/GoogleAnalyticsSettings";
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

        <section aria-label="Google Analytics settings" className="pb-24">
          <GoogleAnalyticsSettings />
        </section>
      </main>
    </AdminHealthCheck>
  );
}
