import { AdminSubnav } from "@/components/AdminSubnav";
import { usePageSEO } from "@/hooks/usePageSEO";
import { AdminTimelineSettings } from "@/components/AdminTimelineSettings";
import { AdminQuoteSettings } from "@/components/AdminQuoteSettings";
import { AdminHealthCheck } from "@/components/AdminHealthCheck";
import { AdminAuthorTooltipToggle } from "@/components/AdminAuthorTooltipToggle";
import { AdminPersonalLogToggle } from "@/components/AdminPersonalLogToggle";
import { AdminQuoteDisplayToggle } from "@/components/AdminQuoteDisplayToggle";

export default function AdminContent() {
  usePageSEO({
    title: "Admin Content – Timelines & Quotes",
    description: "Manage content: fasting timelines, prompts, and quotes.",
    canonicalPath: "/admin/content",
  });

  return (
    <AdminHealthCheck>
      <main className="container mx-auto p-6 space-y-8 overflow-x-hidden bg-background min-h-[calc(100vh-80px)]" role="main">
        <h1 className="sr-only">Admin Content</h1>
        <AdminSubnav />

        <AdminAuthorTooltipToggle />

        <AdminPersonalLogToggle />

        <AdminQuoteDisplayToggle />

        <section aria-label="Timeline management">
          <AdminTimelineSettings />
        </section>

        <section aria-label="Quote management" className="pb-24">
          <AdminQuoteSettings />
        </section>
      </main>
    </AdminHealthCheck>
  );
}
