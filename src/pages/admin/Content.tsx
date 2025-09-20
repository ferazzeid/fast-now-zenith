import { AdminSubnav } from "@/components/AdminSubnav";
import { usePageSEO } from "@/hooks/usePageSEO";
import { AdminTimelineSettings } from "@/components/AdminTimelineSettings";
import { AdminQuoteSettings } from "@/components/AdminQuoteSettings";
import { AdminHealthCheck } from "@/components/AdminHealthCheck";
import { AdminAuthorTooltipToggle } from "@/components/AdminAuthorTooltipToggle";
import { AdminPersonalLogToggle } from "@/components/AdminPersonalLogToggle";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Calendar } from "lucide-react";

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

        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Fasting Timeline System</h2>
              <p className="text-muted-foreground">The new timeline system automatically tracks all fasting sessions and prevents scheduling conflicts.</p>
            </div>
            <Button asChild>
              <Link to="/fasting-history">
                <Calendar className="h-4 w-4 mr-2" />
                View Fasting History
              </Link>
            </Button>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <h3 className="font-semibold text-foreground">Features Implemented:</h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Multi-day extended fast visualization</li>
                <li>• Automatic conflict detection and prevention</li>
                <li>• Timeline slots locked when fasts start</li>
                <li>• Support for both extended and intermittent fasts</li>
                <li>• 37-day view (30 past + 7 future days)</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-foreground">Database Changes:</h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Added fasting_timeline_slots table</li>
                <li>• Auto-population triggers for both fast types</li>
                <li>• Conflict checking function</li>
                <li>• RLS policies for user data security</li>
              </ul>
            </div>
          </div>
        </Card>

        <AdminAuthorTooltipToggle />

        <AdminPersonalLogToggle />

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
