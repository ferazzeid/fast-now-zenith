import { AdminSubnav } from "@/components/AdminSubnav";
import { usePageSEO } from "@/hooks/usePageSEO";
import AdminProtectedRoute from "@/components/AdminProtectedRoute";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminRoleTester } from "@/components/AdminRoleTester";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

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

        <section aria-label="Role Testing" className="space-y-4">
          <h2 className="text-xl font-semibold">Role Testing</h2>
          
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Test how the app behaves for different user roles. Admin dashboard access remains available regardless of test role.
            </AlertDescription>
          </Alert>

          <AdminRoleTester />
        </section>

      </main>
    </AdminProtectedRoute>
  );
}
