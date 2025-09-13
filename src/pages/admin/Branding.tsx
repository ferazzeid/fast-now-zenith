import { AdminSubnav } from "@/components/AdminSubnav";
import { usePageSEO } from "@/hooks/usePageSEO";
import BrandAssetsManager from "@/components/BrandAssetsManager";
import { ColorManagement } from "@/components/ColorManagement";

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

        <section aria-label="Brand assets">
          <BrandAssetsManager />
        </section>

        <section aria-label="PWA management">
          <PWAManagementCard />
        </section>

        <section aria-label="Color management" className="pb-24">
          <ColorManagement />
        </section>
      </main>
    </AdminHealthCheck>
  );
}
