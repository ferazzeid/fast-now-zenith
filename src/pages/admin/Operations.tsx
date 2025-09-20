import React from "react";
import { AdminSubnav } from "@/components/AdminSubnav";
import { usePageSEO } from "@/hooks/usePageSEO";
import { AdminHealthCheck } from "@/components/AdminHealthCheck";
import { AdminAppModeSwitcher } from "@/components/AdminAppModeSwitcher";
import { AdminTrialSettings } from "@/components/AdminTrialSettings";
import { StaticSEOManager } from "@/components/StaticSEOManager";
import { AdminGoogleLoginSettings } from "@/components/AdminGoogleLoginSettings";
import { AdminPhotoWorkflowSettings } from "@/components/AdminPhotoWorkflowSettings";
import { AdminImageCaptureSettings } from "@/components/AdminImageCaptureSettings";
import { AdminIntermittentFastingSettings } from "@/components/AdminIntermittentFastingSettings";
import { AdminDailyReconciliationSettings } from "@/components/AdminDailyReconciliationSettings";
import { AdminProgressiveBurnSettings } from "@/components/AdminProgressiveBurnSettings";
import { AdminToastSettings } from "@/components/AdminToastSettings";
import { Admin90DayProgramSettings } from "@/components/Admin90DayProgramSettings";

export default function AdminOperations() {
  usePageSEO({
    title: "Admin Operations – SEO & Monitoring",
    description: "Manage SEO indexing and operational thresholds.",
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

        <section aria-label="Trial length settings">
          <AdminTrialSettings />
        </section>

        <section aria-label="Static SEO code generator">
          <StaticSEOManager />
        </section>

        <section aria-label="Image capture mode settings">
          <AdminImageCaptureSettings />
        </section>

        <section aria-label="Photo analysis workflow settings">
          <AdminPhotoWorkflowSettings />
        </section>

        <section aria-label="Intermittent fasting settings">
          <AdminIntermittentFastingSettings />
        </section>

        <section aria-label="Daily reconciliation settings">
          <AdminDailyReconciliationSettings />
        </section>

        <section aria-label="Progressive daily burn settings">
          <AdminProgressiveBurnSettings />
        </section>

        <section aria-label="Toast message settings">
          <AdminToastSettings />
        </section>

        <section aria-label="90-day program timeline settings">
          <Admin90DayProgramSettings />
        </section>

        <section aria-label="Google authentication settings" className="pb-24">
          <AdminGoogleLoginSettings />
        </section>
      </main>
    </AdminHealthCheck>
  );
}
