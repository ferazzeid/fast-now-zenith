import { AdminSubnav } from "@/components/AdminSubnav";
import { usePageSEO } from "@/hooks/usePageSEO";
import AdminProtectedRoute from "@/components/AdminProtectedRoute";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

export default function AdminDev() {
  usePageSEO({
    title: "Admin Dev",
    description: "Developer tools and role testing.",
    canonicalPath: "/admin/dev",
  });

  return (
    <AdminProtectedRoute>
      <main className="container mx-auto p-6 space-y-8 overflow-x-hidden bg-background min-h-[calc(100vh-80px)]" role="main">
        <h1 className="sr-only">Admin Dev</h1>
        <AdminSubnav />

        <section aria-label="Development tools" className="space-y-4">
          <h2 className="text-xl font-semibold">Development Tools</h2>
          <Card>
            <CardContent className="p-6">
              <p className="text-muted-foreground">No experimental features are currently available.</p>
            </CardContent>
          </Card>
        </section>

      </main>
    </AdminProtectedRoute>
  );
}
