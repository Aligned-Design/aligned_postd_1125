/**
 * Acceptable Use Policy Page
 */

import { PageShell } from "@/components/postd/ui/layout/PageShell";
import { PageHeader } from "@/components/postd/ui/layout/PageHeader";
import { SectionCard } from "@/components/postd/ui/cards/SectionCard";
import { AlertTriangle, FileX, Code, Brain } from "lucide-react";

export default function AcceptableUse() {
  return (
    <PageShell>
      <PageHeader
        title="Acceptable Use Policy"
        subtitle="Guidelines for using Postd responsibly"
      />

      <div className="max-w-4xl mx-auto space-y-8">
        <SectionCard>
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-indigo-600" />
            <h2 className="text-2xl font-black text-slate-900">Acceptable Use Policy — Postd</h2>
          </div>
          <p className="text-slate-700 leading-relaxed mb-6">
            Users may not use the Service to:
          </p>
        </SectionCard>

        <SectionCard>
          <div className="flex items-center gap-3 mb-4">
            <FileX className="w-6 h-6 text-indigo-600" />
            <h2 className="text-2xl font-black text-slate-900">Content Prohibited</h2>
          </div>
          <ul className="list-disc list-inside space-y-2 text-slate-700 ml-4">
            <li>Hate speech, harassment, or threats</li>
            <li>Illegal products or services</li>
            <li>Adult content or explicit sexual material</li>
            <li>Misinformation or deceptive practices</li>
            <li>Deepfakes or impersonation</li>
            <li>Political manipulation campaigns</li>
          </ul>
        </SectionCard>

        <SectionCard>
          <div className="flex items-center gap-3 mb-4">
            <Code className="w-6 h-6 text-indigo-600" />
            <h2 className="text-2xl font-black text-slate-900">Technical Misuse</h2>
          </div>
          <ul className="list-disc list-inside space-y-2 text-slate-700 ml-4">
            <li>Overloading or stress-testing the system</li>
            <li>Circumventing API limits</li>
            <li>Attempting to access other tenants</li>
            <li>Scraping internal APIs</li>
            <li>Reverse-engineering our software</li>
          </ul>
        </SectionCard>

        <SectionCard>
          <div className="flex items-center gap-3 mb-4">
            <Brain className="w-6 h-6 text-indigo-600" />
            <h2 className="text-2xl font-black text-slate-900">AI Misuse</h2>
          </div>
          <ul className="list-disc list-inside space-y-2 text-slate-700 ml-4">
            <li>Using our AI to replicate competitor platforms</li>
            <li>Using outputs for harmful or abusive content</li>
            <li>Attempting to jailbreak or manipulate system prompts</li>
          </ul>
        </SectionCard>

        <SectionCard>
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-slate-900 font-bold">
              Violation may result in immediate suspension.
            </p>
          </div>
        </SectionCard>
      </div>
    </PageShell>
  );
}

