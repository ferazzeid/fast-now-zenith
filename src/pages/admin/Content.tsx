import { AdminSubnav } from "@/components/AdminSubnav";
import { usePageSEO } from "@/hooks/usePageSEO";
import { AdminTimelineSettings } from "@/components/AdminTimelineSettings";
import { AdminQuoteSettings } from "@/components/AdminQuoteSettings";
import { AdminHealthCheck } from "@/components/AdminHealthCheck";
import { AdminGoalManagementSection } from "@/components/AdminGoalManagementSection";

export default function AdminContent() {
  usePageSEO({
    title: "Admin Content – Timelines, Quotes & Goals",
    description: "Manage content: fasting timelines, prompts, quotes, and goal motivators.",
    canonicalPath: "/admin/content",
  });

  return (
    <AdminHealthCheck>
      <main className="container mx-auto p-6 space-y-8 overflow-x-hidden bg-background min-h-[calc(100vh-80px)]" role="main">
        <h1 className="sr-only">Admin Content</h1>
        <AdminSubnav />

        <section aria-label="Timeline management">
          <AdminTimelineSettings />
        </section>

        <section aria-label="Quote management">
          <AdminQuoteSettings />
        </section>

        <section aria-label="Goal management" className="pb-24">
          <AdminGoalManagementSection />
          <div className="h-8" />
        </section>
      </main>
    </AdminHealthCheck>
  );
}
