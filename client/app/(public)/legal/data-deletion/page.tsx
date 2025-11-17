/**
 * Data Deletion Policy Page
 * Required by Google OAuth compliance
 */

import { PageShell } from "@/components/postd/ui/layout/PageShell";
import { PageHeader } from "@/components/postd/ui/layout/PageHeader";
import { SectionCard } from "@/components/postd/ui/cards/SectionCard";
import { Trash2, Settings, Mail, CheckCircle2 } from "lucide-react";

export default function DataDeletion() {
  return (
    <PageShell>
      <PageHeader
        title="Data Deletion Instructions"
        subtitle="How to request account or data deletion"
      />

      <div className="max-w-4xl mx-auto space-y-8">
        <SectionCard>
          <div className="flex items-center gap-3 mb-4">
            <Trash2 className="w-6 h-6 text-indigo-600" />
            <h2 className="text-2xl font-black text-slate-900">Data Deletion Instructions — Postd</h2>
          </div>
          <p className="text-slate-700 leading-relaxed mb-6">
            To request account or data deletion:
          </p>
        </SectionCard>

        <SectionCard>
          <div className="flex items-center gap-3 mb-4">
            <Settings className="w-6 h-6 text-indigo-600" />
            <h2 className="text-2xl font-black text-slate-900">1. In-app via Settings</h2>
          </div>
          <p className="text-slate-700 leading-relaxed mb-2">
            Navigate to: <strong>Settings → Security → Delete Account</strong>
          </p>
          <p className="text-slate-700 leading-relaxed mb-2">This will:</p>
          <ul className="list-disc list-inside space-y-1 text-slate-700 ml-4">
            <li>Permanently delete your Postd account</li>
            <li>Delete all connected-platform tokens</li>
            <li>Remove all media, posts, analytics, and AI history</li>
            <li>Revoke all OAuth permissions</li>
          </ul>
        </SectionCard>

        <SectionCard>
          <div className="flex items-center gap-3 mb-4">
            <Mail className="w-6 h-6 text-indigo-600" />
            <h2 className="text-2xl font-black text-slate-900">2. Email Request</h2>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-slate-700 leading-relaxed mb-2">
                Email: <a href="mailto:privacy@postd.app" className="text-indigo-600 hover:text-indigo-700 underline font-semibold">privacy@postd.app</a>
              </p>
              <p className="text-slate-700 leading-relaxed mb-2">
                Subject: <strong>Data Deletion Request</strong>
              </p>
            </div>
            <div>
              <p className="text-slate-700 leading-relaxed mb-2 font-semibold">Include:</p>
              <ul className="list-disc list-inside space-y-1 text-slate-700 ml-4">
                <li>Account email</li>
                <li>Workspace name</li>
              </ul>
            </div>
            <div className="flex items-start gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-slate-700 leading-relaxed">
                <strong>We will confirm deletion within 72 hours.</strong>
              </p>
            </div>
          </div>
        </SectionCard>
      </div>
    </PageShell>
  );
}

