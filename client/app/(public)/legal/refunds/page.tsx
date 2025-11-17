/**
 * Refund & Billing Policy Page
 */

import { PageShell } from "@/components/postd/ui/layout/PageShell";
import { PageHeader } from "@/components/postd/ui/layout/PageHeader";
import { SectionCard } from "@/components/postd/ui/cards/SectionCard";
import { CreditCard, Receipt, X, Settings } from "lucide-react";

export default function RefundPolicy() {
  return (
    <PageShell>
      <PageHeader
        title="Refund & Billing Policy"
        subtitle="Information about billing and refunds"
      />

      <div className="max-w-4xl mx-auto space-y-8">
        <SectionCard>
          <div className="flex items-center gap-3 mb-4">
            <CreditCard className="w-6 h-6 text-indigo-600" />
            <h2 className="text-2xl font-black text-slate-900">Refund & Billing Policy — Postd</h2>
          </div>
        </SectionCard>

        <SectionCard>
          <div className="flex items-center gap-3 mb-4">
            <Receipt className="w-6 h-6 text-indigo-600" />
            <h2 className="text-2xl font-black text-slate-900">Billing</h2>
          </div>
          <ul className="list-disc list-inside space-y-2 text-slate-700 ml-4">
            <li>Billed per brand, monthly or annually</li>
            <li>Charges appear as "Postd"</li>
            <li>Invoices emailed automatically</li>
          </ul>
        </SectionCard>

        <SectionCard>
          <div className="flex items-center gap-3 mb-4">
            <X className="w-6 h-6 text-indigo-600" />
            <h2 className="text-2xl font-black text-slate-900">Refunds</h2>
          </div>
          <p className="text-slate-700 leading-relaxed mb-2">
            As a SaaS platform:
          </p>
          <ul className="list-disc list-inside space-y-2 text-slate-700 ml-4">
            <li>Subscription payments are non-refundable once the billing cycle begins</li>
            <li>Pro-rated refunds are not provided</li>
          </ul>
        </SectionCard>

        <SectionCard>
          <div className="flex items-center gap-3 mb-4">
            <Settings className="w-6 h-6 text-indigo-600" />
            <h2 className="text-2xl font-black text-slate-900">Cancellations</h2>
          </div>
          <p className="text-slate-700 leading-relaxed mb-2">
            You can cancel anytime: <strong>Settings → Billing → Cancel Subscription</strong>
          </p>
          <p className="text-slate-700 leading-relaxed">
            Your account remains active until the end of the period.
          </p>
        </SectionCard>
      </div>
    </PageShell>
  );
}

