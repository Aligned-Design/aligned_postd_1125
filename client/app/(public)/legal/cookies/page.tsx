/**
 * Cookie Policy Page
 */

import { PageShell } from "@/components/postd/ui/layout/PageShell";
import { PageHeader } from "@/components/postd/ui/layout/PageHeader";
import { SectionCard } from "@/components/postd/ui/cards/SectionCard";
import { Cookie, Lock, BarChart3, Settings } from "lucide-react";

export default function CookiePolicy() {
  return (
    <PageShell>
      <PageHeader
        title="Cookie Policy"
        subtitle="How we use cookies to improve your experience"
      />

      <div className="max-w-4xl mx-auto space-y-8">
        <SectionCard>
          <div className="flex items-center gap-3 mb-4">
            <Cookie className="w-6 h-6 text-indigo-600" />
            <h2 className="text-2xl font-black text-slate-900">Cookie Policy — Postd</h2>
          </div>
          <p className="text-slate-700 leading-relaxed mb-4">
            We use cookies to:
          </p>
          <ul className="list-disc list-inside space-y-2 text-slate-700 ml-4">
            <li className="flex items-start gap-2">
              <Lock className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
              <span>Provide secure login</span>
            </li>
            <li className="flex items-start gap-2">
              <Settings className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
              <span>Remember preferences</span>
            </li>
            <li className="flex items-start gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
              <span>Measure product usage</span>
            </li>
            <li className="flex items-start gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
              <span>Improve product performance</span>
            </li>
            <li className="flex items-start gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
              <span>Enable analytics</span>
            </li>
          </ul>
        </SectionCard>

        <SectionCard>
          <h2 className="text-2xl font-black text-slate-900 mb-4">Our Commitment</h2>
          <p className="text-slate-700 leading-relaxed font-semibold mb-2">
            We do not use cookies for third-party advertising.
          </p>
        </SectionCard>

        <SectionCard>
          <h2 className="text-2xl font-black text-slate-900 mb-4">Your Control</h2>
          <p className="text-slate-700 leading-relaxed mb-2">You can:</p>
          <ul className="list-disc list-inside space-y-1 text-slate-700 ml-4">
            <li>Disable cookies in your browser</li>
            <li>Clear stored cookies anytime</li>
          </ul>
          <p className="text-slate-700 leading-relaxed mt-4 font-semibold">
            Essential cookies are required for login and cannot be disabled.
          </p>
        </SectionCard>
      </div>
    </PageShell>
  );
}

