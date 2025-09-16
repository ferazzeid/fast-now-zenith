import { AdminSubnav } from "@/components/AdminSubnav";
import { usePageSEO } from "@/hooks/usePageSEO";
import { StaticBrandAssetsManager } from "@/components/StaticBrandAssetsManager";
import { StaticAppIdentitySettings } from "@/components/StaticAppIdentitySettings";
import EnhancedColorManagement from "@/components/EnhancedColorManagement";
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

        <section aria-label="App identity settings">
          <StaticAppIdentitySettings />
        </section>

        <section aria-label="Brand assets manager">
          <StaticBrandAssetsManager />
        </section>

        <section aria-label="Enhanced color management" className="pb-24">
          <EnhancedColorManagement />
        </section>
      </main>
    </AdminHealthCheck>
  );
}
