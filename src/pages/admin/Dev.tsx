import { AdminSubnav } from "@/components/AdminSubnav";
import { usePageSEO } from "@/hooks/usePageSEO";
import { AdminRoleTester } from "@/components/AdminRoleTester";

export default function AdminDev() {
  usePageSEO({
    title: "Admin Dev",
    description: "Developer tools and role testing.",
    canonicalPath: "/admin/dev",
  });

  return (
    <main className="container mx-auto p-6 space-y-8 overflow-x-hidden bg-background min-h-[calc(100vh-80px)]" role="main">
      <h1 className="sr-only">Admin Dev</h1>
      <AdminSubnav />

      <section aria-label="Role testing" className="pb-24">
        <AdminRoleTester />
        <div className="h-8" />
      </section>
    </main>
  );
}
