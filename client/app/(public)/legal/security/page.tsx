/**
 * Security Statement Page
 */

import { PageShell } from "@/components/postd/ui/layout/PageShell";
import { PageHeader } from "@/components/postd/ui/layout/PageHeader";
import { SectionCard } from "@/components/postd/ui/cards/SectionCard";
import { Shield, Lock, Database, CheckCircle2 } from "lucide-react";

export default function SecurityStatement() {
  return (
    <PageShell>
      <PageHeader
        title="Security Practices"
        subtitle="How we protect your data and platform"
      />

      <div className="max-w-4xl mx-auto space-y-8">
        <SectionCard>
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-6 h-6 text-indigo-600" />
            <h2 className="text-2xl font-black text-slate-900">Security Practices — Postd</h2>
          </div>
          <p className="text-slate-700 leading-relaxed mb-6">
            We follow industry-standard security practices:
          </p>
        </SectionCard>

        <SectionCard>
          <div className="flex items-center gap-3 mb-4">
            <Database className="w-6 h-6 text-indigo-600" />
            <h2 className="text-2xl font-black text-slate-900">Infrastructure</h2>
          </div>
          <ul className="list-disc list-inside space-y-2 text-slate-700 ml-4">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span>Supabase with RLS</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span>Encrypted databases</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span>Access logging</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span>Least-privilege permissions</span>
            </li>
          </ul>
        </SectionCard>

        <SectionCard>
          <div className="flex items-center gap-3 mb-4">
            <Lock className="w-6 h-6 text-indigo-600" />
            <h2 className="text-2xl font-black text-slate-900">Token Management</h2>
          </div>
          <ul className="list-disc list-inside space-y-2 text-slate-700 ml-4">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span>AES-256 at rest</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span>Automatic rotation</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span>Secure token vault</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span>Audit logs</span>
            </li>
          </ul>
        </SectionCard>

        <SectionCard>
          <h2 className="text-2xl font-black text-slate-900 mb-4">Platform</h2>
          <ul className="list-disc list-inside space-y-2 text-slate-700 ml-4">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span>TLS 1.3</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span>MFA for admins</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span>Automated backups</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span>Disaster recovery plan</span>
            </li>
          </ul>
        </SectionCard>

        <SectionCard>
          <h2 className="text-2xl font-black text-slate-900 mb-4">Compliance</h2>
          <ul className="list-disc list-inside space-y-2 text-slate-700 ml-4">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span>GDPR-friendly</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span>Google API Limited Use Compliant</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <span>Meta Platform Compliant</span>
            </li>
          </ul>
        </SectionCard>
      </div>
    </PageShell>
  );
}

