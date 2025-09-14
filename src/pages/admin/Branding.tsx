import { AdminSubnav } from "@/components/AdminSubnav";
import { usePageSEO } from "@/hooks/usePageSEO";
import { StaticBrandAssetsManager } from "@/components/StaticBrandAssetsManager";
import { StaticColorManager } from "@/components/StaticColorManager";
import { AppIdentitySettings } from "@/components/AppIdentitySettings";
import { PWAManagementCard } from "@/components/PWAManagementCard";
import { AdminHealthCheck } from "@/components/AdminHealthCheck";


export default function AdminBranding() {
  usePageSEO({
    title: "Admin Branding – Logos, Colors & Design",
    description: "Manage brand assets, color themes, and visual identity.",
    canonicalPath: "/admin/branding",
  });

  return (
    <AdminHealthCheck>
      <main className="container mx-auto p-6 space-y-8 overflow-x-hidden bg-background min-h-[calc(100vh-80px)]" role="main">
        <h1 className="sr-only">Admin Branding</h1>
        <AdminSubnav />

        <section aria-label="App identity and branding settings">
          <AppIdentitySettings />
        </section>

        <section aria-label="Static brand assets development tool">
          <StaticBrandAssetsManager />
        </section>

        <section aria-label="PWA management">
          <PWAManagementCard />
        </section>

        <section aria-label="Static color management development tool" className="pb-24">
          <StaticColorManager />
        </section>
      </main>
    </AdminHealthCheck>
  );
}
