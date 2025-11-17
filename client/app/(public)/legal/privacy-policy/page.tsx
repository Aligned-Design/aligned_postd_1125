/**
 * Privacy Policy Page
 * 
 * API-compliant privacy policy covering Google, Meta, LinkedIn, TikTok,
 * email providers, and SaaS platform data handling.
 */

import { PageShell } from "@/components/postd/ui/layout/PageShell";
import { PageHeader } from "@/components/postd/ui/layout/PageHeader";
import { SectionCard } from "@/components/postd/ui/cards/SectionCard";
import { Shield, Lock, Eye, FileText, Mail } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <PageShell>
      <PageHeader
        title="Privacy Policy"
        subtitle="How we collect, use, and protect your data"
      />

      <div className="max-w-4xl mx-auto space-y-8">
        {/* Last Updated */}
        <div className="text-sm text-slate-600 mb-8">
          <strong>Last Updated:</strong> January 2025
        </div>

        {/* Introduction */}
        <SectionCard>
          <div className="space-y-4">
            <p className="text-slate-700 leading-relaxed">
              Postd ("we", "our", "the platform") is a multi-tenant marketing automation and content generation platform. 
              We respect your privacy and comply with all required platform policies including:
            </p>
            <ul className="list-disc list-inside space-y-2 text-slate-700 ml-4">
              <li>Google API Services User Data Policy</li>
              <li>Facebook/Meta Platform Terms & Developer Policies</li>
              <li>LinkedIn Marketing API Rules</li>
              <li>TikTok Developer Policy</li>
              <li>Email provider policies (Mailchimp, Gmail, etc.)</li>
              <li>GDPR / CCPA / CPRA data rights</li>
            </ul>
          </div>
        </SectionCard>

        {/* Section 1: Information We Collect */}
        <SectionCard>
          <div className="flex items-center gap-3 mb-4">
            <FileText className="w-6 h-6 text-indigo-600" />
            <h2 className="text-2xl font-black text-slate-900">1. Information We Collect</h2>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">1.1 Account Information</h3>
              <p className="text-slate-700 leading-relaxed mb-2">We collect:</p>
              <ul className="list-disc list-inside space-y-1 text-slate-700 ml-4">
                <li>Name</li>
                <li>Email</li>
                <li>Business name</li>
                <li>Password (hashed & salted)</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">1.2 Connected Platforms</h3>
              <p className="text-slate-700 leading-relaxed mb-2">
                If you choose to connect accounts (Google, Facebook, Instagram, LinkedIn, TikTok, Mailchimp), we collect:
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-700 ml-4">
                <li>Access tokens (encrypted in our database using AES-256)</li>
                <li>Channel IDs</li>
                <li>Page IDs</li>
                <li>Permissions granted</li>
              </ul>
              <p className="text-slate-700 leading-relaxed mt-2">
                <strong>We do not collect passwords for any connected platform.</strong>
              </p>
            </div>
          </div>
        </SectionCard>

        {/* Section 2: How We Use Your Data */}
        <SectionCard>
          <div className="flex items-center gap-3 mb-4">
            <Eye className="w-6 h-6 text-indigo-600" />
            <h2 className="text-2xl font-black text-slate-900">2. How We Use Your Data</h2>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-slate-700 leading-relaxed mb-2 font-semibold">We use your data ONLY to:</p>
              <ul className="list-disc list-inside space-y-1 text-slate-700 ml-4">
                <li>Generate brand-aligned content</li>
                <li>Schedule and publish posts</li>
                <li>Retrieve analytics</li>
                <li>Improve insights and recommendations</li>
                <li>Provide support</li>
                <li>Maintain platform security</li>
              </ul>
            </div>

            <div>
              <p className="text-slate-700 leading-relaxed mb-2 font-semibold">We NEVER:</p>
              <ul className="list-disc list-inside space-y-1 text-slate-700 ml-4">
                <li>Sell user data</li>
                <li>Share data with advertisers</li>
                <li>Use connected-platform data to build user profiles outside your account</li>
              </ul>
            </div>
          </div>
        </SectionCard>

        {/* Section 3: Google API Compliance */}
        <SectionCard>
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-6 h-6 text-indigo-600" />
            <h2 className="text-2xl font-black text-slate-900">3. Google API Compliance Statement</h2>
          </div>

          <div className="space-y-4">
            <p className="text-slate-700 leading-relaxed">
              Postd's use of Google user data is limited to:
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-700 ml-4">
              <li>Scheduling Google Business Profile posts</li>
              <li>Reading basic GBP analytics</li>
              <li>Managing media uploads</li>
            </ul>

            <p className="text-slate-700 leading-relaxed font-semibold mt-4">We never:</p>
            <ul className="list-disc list-inside space-y-1 text-slate-700 ml-4">
              <li>Sell Google user data</li>
              <li>Transfer Google user data except to necessary service providers</li>
              <li>Use Google user data for advertising</li>
              <li>Store Google data outside encrypted storage</li>
            </ul>

            <p className="text-slate-700 leading-relaxed mt-4">
              We comply fully with the <strong>Google API Services User Data Policy</strong>, including the Limited Use Requirements.
            </p>
          </div>
        </SectionCard>

        {/* Section 4: Meta/Facebook/Instagram API Compliance */}
        <SectionCard>
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-6 h-6 text-indigo-600" />
            <h2 className="text-2xl font-black text-slate-900">4. Meta/Facebook/Instagram API Compliance</h2>
          </div>

          <div className="space-y-4">
            <p className="text-slate-700 leading-relaxed">
              We follow all <strong>Meta Platform Developer Policies</strong>. We only access:
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-700 ml-4">
              <li>Page content</li>
              <li>Page insights</li>
              <li>Media</li>
              <li>Publishing endpoints</li>
            </ul>

            <p className="text-slate-700 leading-relaxed font-semibold mt-4">We do not access:</p>
            <ul className="list-disc list-inside space-y-1 text-slate-700 ml-4">
              <li>Private messages</li>
              <li>Friends lists</li>
              <li>Personal profile data</li>
            </ul>
          </div>
        </SectionCard>

        {/* Section 5: Data Security */}
        <SectionCard>
          <div className="flex items-center gap-3 mb-4">
            <Lock className="w-6 h-6 text-indigo-600" />
            <h2 className="text-2xl font-black text-slate-900">5. Data Security</h2>
          </div>

          <div className="space-y-4">
            <p className="text-slate-700 leading-relaxed">
              All sensitive data is encrypted:
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-700 ml-4">
              <li><strong>In transit:</strong> TLS 1.3</li>
              <li><strong>At rest:</strong> AES-256</li>
            </ul>

            <p className="text-slate-700 leading-relaxed mt-4">
              Access tokens are stored in a token vault with:
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-700 ml-4">
              <li>Key rotation</li>
              <li>Audit logs</li>
              <li>Strict access control</li>
            </ul>

            <p className="text-slate-700 leading-relaxed mt-4">
              Only the minimum employees required to support the system have access.
            </p>
          </div>
        </SectionCard>

        {/* Section 6: Your Rights */}
        <SectionCard>
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-6 h-6 text-indigo-600" />
            <h2 className="text-2xl font-black text-slate-900">6. Your Rights</h2>
          </div>

          <div className="space-y-4">
            <p className="text-slate-700 leading-relaxed">
              You may request:
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-700 ml-4">
              <li>Data deletion</li>
              <li>Data export</li>
              <li>Account closure</li>
              <li>Permission revocation (OAuth disconnect)</li>
            </ul>

            <p className="text-slate-700 leading-relaxed mt-4">
              Supported via in-app tools or by emailing support.
            </p>
          </div>
        </SectionCard>

        {/* Section 7: Contact Info */}
        <SectionCard>
          <div className="flex items-center gap-3 mb-4">
            <Mail className="w-6 h-6 text-indigo-600" />
            <h2 className="text-2xl font-black text-slate-900">7. Contact Info</h2>
          </div>

          <div className="space-y-2">
            <p className="text-slate-700 leading-relaxed">
              For privacy-related questions or requests, please contact us at:
            </p>
            <p className="text-indigo-600 font-semibold text-lg">
              <a href="mailto:info@postd.app" className="hover:text-indigo-700 underline">
                info@postd.app
              </a>
            </p>
          </div>
        </SectionCard>
      </div>
    </PageShell>
  );
}

