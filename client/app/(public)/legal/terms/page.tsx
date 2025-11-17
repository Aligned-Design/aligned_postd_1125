/**
 * Terms of Service Page
 */

import { PageShell } from "@/components/postd/ui/layout/PageShell";
import { PageHeader } from "@/components/postd/ui/layout/PageHeader";
import { SectionCard } from "@/components/postd/ui/cards/SectionCard";
import { FileText, Shield, CreditCard, X, AlertTriangle, Mail } from "lucide-react";

export default function TermsOfService() {
  return (
    <PageShell>
      <PageHeader
        title="Terms of Service"
        subtitle="Terms governing your use of Postd"
      />

      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-sm text-slate-600 mb-8">
          <strong>Last Updated:</strong> January 2025
        </div>

        <SectionCard>
          <p className="text-slate-700 leading-relaxed mb-4">
            Welcome to Postd ("we", "our", "the Service"). These Terms govern your access and use of the Postd platform, located at postd.app and all related subdomains.
          </p>
          <p className="text-slate-700 leading-relaxed font-semibold">
            By creating an account, you agree to these Terms.
          </p>
        </SectionCard>

        <SectionCard>
          <div className="flex items-center gap-3 mb-4">
            <FileText className="w-6 h-6 text-indigo-600" />
            <h2 className="text-2xl font-black text-slate-900">1. The Service</h2>
          </div>
          <p className="text-slate-700 leading-relaxed mb-4">
            Postd is a marketing automation and content generation platform. Features include:
          </p>
          <ul className="list-disc list-inside space-y-2 text-slate-700 ml-4">
            <li>Content generation (copy, visuals, insights)</li>
            <li>Scheduling & auto-publishing</li>
            <li>Analytics & reporting</li>
            <li>Brand guide creation</li>
            <li>Multi-brand and agency management</li>
            <li>Team management and client collaboration</li>
          </ul>
          <p className="text-slate-700 leading-relaxed mt-4">
            We may update or improve features over time.
          </p>
        </SectionCard>

        <SectionCard>
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-6 h-6 text-indigo-600" />
            <h2 className="text-2xl font-black text-slate-900">2. Eligibility</h2>
          </div>
          <p className="text-slate-700 leading-relaxed mb-2">You must:</p>
          <ul className="list-disc list-inside space-y-1 text-slate-700 ml-4">
            <li>Be at least 18 years old</li>
            <li>Have the right to represent your business or clients</li>
            <li>Not be prohibited by local laws from using our Service</li>
          </ul>
        </SectionCard>

        <SectionCard>
          <h2 className="text-2xl font-black text-slate-900 mb-4">3. User Accounts</h2>
          <p className="text-slate-700 leading-relaxed mb-2">You are responsible for:</p>
          <ul className="list-disc list-inside space-y-1 text-slate-700 ml-4">
            <li>Maintaining account security</li>
            <li>Ensuring your team uses the Service compliantly</li>
            <li>Keeping login credentials confidential</li>
          </ul>
          <p className="text-slate-700 leading-relaxed mt-4">
            We reserve the right to suspend accounts for policy violations or abuse.
          </p>
        </SectionCard>

        <SectionCard>
          <h2 className="text-2xl font-black text-slate-900 mb-4">4. Content Ownership</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Your Content</h3>
              <p className="text-slate-700 leading-relaxed mb-2">You retain ownership of:</p>
              <ul className="list-disc list-inside space-y-1 text-slate-700 ml-4">
                <li>Your brand assets</li>
                <li>Any content you upload</li>
                <li>AI-generated content produced for your brand</li>
              </ul>
              <p className="text-slate-700 leading-relaxed mt-2">
                You grant us a license to store, process, and display content strictly for operating the Service.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">AI-Generated Content</h3>
              <p className="text-slate-700 leading-relaxed">
                We make no claim of ownership over the generated text or imagery. You may use all AI content commercially.
              </p>
            </div>
          </div>
        </SectionCard>

        <SectionCard>
          <h2 className="text-2xl font-black text-slate-900 mb-4">5. Integrations & API Use</h2>
          <p className="text-slate-700 leading-relaxed mb-2">
            You may connect accounts including Meta, Google, LinkedIn, TikTok, and email platforms.
          </p>
          <p className="text-slate-700 leading-relaxed mb-2 font-semibold">You agree to:</p>
          <ul className="list-disc list-inside space-y-1 text-slate-700 ml-4">
            <li>Only connect accounts you have permission to manage</li>
            <li>Follow all third-party API terms</li>
            <li>Not misuse or extract data beyond intended use</li>
          </ul>
          <p className="text-slate-700 leading-relaxed mt-4">
            We reserve the right to revoke access for suspicious or abusive API activity.
          </p>
        </SectionCard>

        <SectionCard>
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-indigo-600" />
            <h2 className="text-2xl font-black text-slate-900">6. Prohibited Activities</h2>
          </div>
          <p className="text-slate-700 leading-relaxed mb-2">You may not use Postd to:</p>
          <ul className="list-disc list-inside space-y-1 text-slate-700 ml-4">
            <li>Publish harmful, abusive, or illegal content</li>
            <li>Attempt to reverse-engineer the platform</li>
            <li>Abuse API limits</li>
            <li>Misrepresent your identity or your clients</li>
            <li>Train your own AI models using our output or systems</li>
          </ul>
          <p className="text-slate-700 leading-relaxed mt-4">
            See <a href="/legal/acceptable-use" className="text-indigo-600 hover:text-indigo-700 underline font-semibold">Acceptable Use Policy</a> for more details.
          </p>
        </SectionCard>

        <SectionCard>
          <div className="flex items-center gap-3 mb-4">
            <CreditCard className="w-6 h-6 text-indigo-600" />
            <h2 className="text-2xl font-black text-slate-900">7. Payments & Billing</h2>
          </div>
          <p className="text-slate-700 leading-relaxed mb-2">
            Postd bills per brand, per workspace.
          </p>
          <ul className="list-disc list-inside space-y-1 text-slate-700 ml-4">
            <li>Subscription fees are billed monthly or annually</li>
            <li>Fees are non-refundable</li>
            <li>Cancel anytime — access continues until period end</li>
            <li>Failed payments may cause service interruption</li>
          </ul>
          <p className="text-slate-700 leading-relaxed mt-4">
            Billing is processed securely through Stripe.
          </p>
          <p className="text-slate-700 leading-relaxed mt-2">
            See <a href="/legal/refunds" className="text-indigo-600 hover:text-indigo-700 underline font-semibold">Refund Policy</a> for details.
          </p>
        </SectionCard>

        <SectionCard>
          <div className="flex items-center gap-3 mb-4">
            <X className="w-6 h-6 text-indigo-600" />
            <h2 className="text-2xl font-black text-slate-900">8. Cancellation & Termination</h2>
          </div>
          <p className="text-slate-700 leading-relaxed mb-2">
            You may cancel at any time from your account settings.
          </p>
          <p className="text-slate-700 leading-relaxed mb-2 font-semibold">We may terminate accounts for:</p>
          <ul className="list-disc list-inside space-y-1 text-slate-700 ml-4">
            <li>Repeated policy violations</li>
            <li>Abuse, fraud, or illegal activity</li>
            <li>API misuse</li>
            <li>Non-payment</li>
          </ul>
          <p className="text-slate-700 leading-relaxed mt-4">
            Upon termination, we may delete your content after a grace period.
          </p>
        </SectionCard>

        <SectionCard>
          <h2 className="text-2xl font-black text-slate-900 mb-4">9. Limitation of Liability</h2>
          <p className="text-slate-700 leading-relaxed mb-2">We are not liable for:</p>
          <ul className="list-disc list-inside space-y-1 text-slate-700 ml-4">
            <li>Loss of revenue</li>
            <li>Business interruption</li>
            <li>Platform downtime</li>
            <li>Third-party API outages</li>
            <li>Incorrect AI-generated content</li>
          </ul>
          <p className="text-slate-700 leading-relaxed mt-4">
            Your sole remedy for dissatisfaction is to discontinue use.
          </p>
        </SectionCard>

        <SectionCard>
          <h2 className="text-2xl font-black text-slate-900 mb-4">10. Modifications</h2>
          <p className="text-slate-700 leading-relaxed">
            We may update these Terms as the platform evolves. We will notify you of material changes.
          </p>
        </SectionCard>

        <SectionCard>
          <div className="flex items-center gap-3 mb-4">
            <Mail className="w-6 h-6 text-indigo-600" />
            <h2 className="text-2xl font-black text-slate-900">11. Contact</h2>
          </div>
          <div className="space-y-2">
            <p className="text-slate-700 leading-relaxed">
              <a href="mailto:legal@postd.app" className="text-indigo-600 hover:text-indigo-700 underline font-semibold">
                legal@postd.app
              </a>
            </p>
            <p className="text-slate-700 leading-relaxed">
              <a href="mailto:support@postd.app" className="text-indigo-600 hover:text-indigo-700 underline font-semibold">
                support@postd.app
              </a>
            </p>
          </div>
        </SectionCard>
      </div>
    </PageShell>
  );
}

