import React from "react";
import { AdminSubnav } from "@/components/AdminSubnav";
import { usePageSEO } from "@/hooks/usePageSEO";
import { AdminHealthCheck } from "@/components/AdminHealthCheck";
import { AdminAppModeSwitcher } from "@/components/AdminAppModeSwitcher";
import { StaticSEOManager } from "@/components/StaticSEOManager";
import { AdminAnimationSettings } from "@/components/AdminAnimationSettings";
import { AdminGoogleLoginSettings } from "@/components/AdminGoogleLoginSettings";

export default function AdminOperations() {
  usePageSEO({
    title: "Admin Operations – Animation, SEO & Monitoring",
    description: "Manage animation settings, SEO indexing, and operational thresholds.",
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

        <section aria-label="Animation settings">
          <AdminAnimationSettings />
        </section>

        <section aria-label="Static SEO code generator">
          <StaticSEOManager />
        </section>

        <section aria-label="Google authentication settings" className="pb-24">
          <AdminGoogleLoginSettings />
        </section>
      </main>
    </AdminHealthCheck>
  );
}
