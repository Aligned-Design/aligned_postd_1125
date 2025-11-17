/**
 * API & Developer Policy Page
 */

import { PageShell } from "@/components/postd/ui/layout/PageShell";
import { PageHeader } from "@/components/postd/ui/layout/PageHeader";
import { SectionCard } from "@/components/postd/ui/cards/SectionCard";
import { Code, Shield, AlertTriangle } from "lucide-react";

export default function ApiPolicy() {
  return (
    <PageShell>
      <PageHeader
        title="API & Developer Policy"
        subtitle="Guidelines for API and integration usage"
      />

      <div className="max-w-4xl mx-auto space-y-8">
        <SectionCard>
          <div className="flex items-center gap-3 mb-4">
            <Code className="w-6 h-6 text-indigo-600" />
            <h2 className="text-2xl font-black text-slate-900">API & Developer Policy — Postd</h2>
          </div>
          <p className="text-slate-700 leading-relaxed mb-6">
            If your workspace uses custom integrations or API endpoints:
          </p>
        </SectionCard>

        <SectionCard>
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-6 h-6 text-indigo-600" />
            <h2 className="text-2xl font-black text-slate-900">Requirements</h2>
          </div>
          <ul className="list-disc list-inside space-y-2 text-slate-700 ml-4">
            <li>All requests must be authenticated</li>
            <li>Rate limits apply</li>
            <li>Do not store plaintext tokens</li>
            <li>Only access brand-scoped data</li>
            <li>No automated scraping or aggressive polling</li>
            <li>Do not resell Postd data</li>
          </ul>
        </SectionCard>

        <SectionCard>
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-indigo-600" />
            <h2 className="text-2xl font-black text-slate-900">Enforcement</h2>
          </div>
          <p className="text-slate-700 leading-relaxed">
            Tokens and API access can be revoked for abuse.
          </p>
        </SectionCard>
      </div>
    </PageShell>
  );
}

