import React from "react";
import { AdminSubnav } from "@/components/AdminSubnav";
import { usePageSEO } from "@/hooks/usePageSEO";
import { SimpleAnalyticsWidget } from "@/components/SimpleAnalyticsWidget";
import { AdminTierStats } from "@/components/AdminTierStats";
import { AdminHealthCheck } from "@/components/AdminHealthCheck";

export default function AdminData() {
  usePageSEO({
    title: "Admin Data – Real-Time Analytics & User Statistics",
    description: "View real-time analytics, user tier statistics, and activity metrics.",
    canonicalPath: "/admin/data",
  });

  return (
    <AdminHealthCheck>
      <main className="container mx-auto p-6 space-y-8 overflow-x-hidden bg-background min-h-[calc(100vh-80px)]" role="main">
        <h1 className="sr-only">Admin Data Dashboard</h1>
        <AdminSubnav />

        <section aria-label="Real-time analytics">
          <SimpleAnalyticsWidget />
        </section>

        <section aria-label="User tiers overview" className="pb-24">
          <AdminTierStats />
        </section>
      </main>
    </AdminHealthCheck>
  );
}