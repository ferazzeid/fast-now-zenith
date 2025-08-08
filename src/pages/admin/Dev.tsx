import { AdminSubnav } from "@/components/AdminSubnav";
import { usePageSEO } from "@/hooks/usePageSEO";
import AdminProtectedRoute from "@/components/AdminProtectedRoute";
import { BarcodeScannerExperiment } from "@/components/dev/BarcodeScannerExperiment";
import { FoodPhotoAnalyzerExperiment } from "@/components/dev/FoodPhotoAnalyzerExperiment";

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

        <section aria-label="Barcode Scanner Experiment" className="space-y-4">
          <h2 className="text-xl font-semibold">Barcode Scanner</h2>
          <BarcodeScannerExperiment />
        </section>

        <section aria-label="Food Photo Nutrition Analyzer" className="space-y-4 pb-24">
          <h2 className="text-xl font-semibold">Food Photo Nutrition Analyzer</h2>
          <FoodPhotoAnalyzerExperiment />
        </section>
      </main>
    </AdminProtectedRoute>
  );
}
