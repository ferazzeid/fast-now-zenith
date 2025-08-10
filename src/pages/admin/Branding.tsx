import { AdminSubnav } from "@/components/AdminSubnav";
import { usePageSEO } from "@/hooks/usePageSEO";
import BrandAssetsManager from "@/components/BrandAssetsManager";
import { ColorManagement } from "@/components/ColorManagement";
import { AdminSEOSettings } from "@/components/AdminSEOSettings";
import { AppIdentitySettings } from "@/components/AppIdentitySettings";
import { PWAManagementCard } from "@/components/PWAManagementCard";
import { PWATestPanel } from "@/components/PWATestPanel";

export default function AdminBranding() {
  usePageSEO({
    title: "Admin Branding – Logos, Colors & SEO",
    description: "Manage brand assets, color themes, and SEO settings.",
    canonicalPath: "/admin/branding",
  });

  return (
    <main className="container mx-auto p-6 space-y-8 overflow-x-hidden bg-background min-h-[calc(100vh-80px)]" role="main">
      <h1 className="sr-only">Admin Branding</h1>
      <AdminSubnav />

      <section aria-label="App identity and branding settings">
        <AppIdentitySettings />
      </section>

      <section aria-label="Brand assets">
        <BrandAssetsManager />
      </section>

      {/* PWA Icon Uploader removed - using individual uploads in BrandAssetsManager instead */}

      <section aria-label="PWA management">
        <PWAManagementCard />
      </section>

      <section aria-label="PWA testing">
      <PWATestPanel />
      </section>

      <section aria-label="Color management">
        <ColorManagement />
      </section>

      <section aria-label="SEO settings" className="pb-24">
        <AdminSEOSettings />
        <div className="h-8" />
      </section>
    </main>
  );
}
