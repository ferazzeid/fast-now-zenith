import { AdminSubnav } from "@/components/AdminSubnav";
import { usePageSEO } from "@/hooks/usePageSEO";
import { PaymentProviderSettings } from "@/components/PaymentProviderSettings";
import { AdminHealthCheck } from "@/components/AdminHealthCheck";
import { GooglePlayConfigPanel } from "@/components/GooglePlayConfigPanel";
import { MobileBillingInterface } from "@/components/MobileBillingInterface";
import { CapacitorSetupGuide } from "@/components/CapacitorSetupGuide";

export default function AdminPayments() {
  usePageSEO({
    title: "Admin Payments – Billing & Analytics",
    description: "Configure payment providers and analytics integrations.",
    canonicalPath: "/admin/payments",
  });

  return (
    <AdminHealthCheck>
      <main className="container mx-auto p-6 space-y-8 overflow-x-hidden bg-background min-h-[calc(100vh-80px)]" role="main">
        <h1 className="sr-only">Admin Payments</h1>
        <AdminSubnav />

        <section aria-label="Payment provider settings" className="space-y-6 pb-24">
          <PaymentProviderSettings />
          
          <div className="grid gap-6 md:grid-cols-2">
            <GooglePlayConfigPanel />
            <MobileBillingInterface />
          </div>
          
          <CapacitorSetupGuide />
        </section>
      </main>
    </AdminHealthCheck>
  );
}
