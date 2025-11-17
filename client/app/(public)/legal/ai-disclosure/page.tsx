/**
 * AI Model Disclosure Page
 */

import { PageShell } from "@/components/postd/ui/layout/PageShell";
import { PageHeader } from "@/components/postd/ui/layout/PageHeader";
import { SectionCard } from "@/components/postd/ui/cards/SectionCard";
import { Brain, Sparkles, AlertCircle, Shield } from "lucide-react";

export default function AiDisclosure() {
  return (
    <PageShell>
      <PageHeader
        title="AI Model Disclosure"
        subtitle="Transparency about our AI technology"
      />

      <div className="max-w-4xl mx-auto space-y-8">
        <SectionCard>
          <div className="flex items-center gap-3 mb-4">
            <Brain className="w-6 h-6 text-indigo-600" />
            <h2 className="text-2xl font-black text-slate-900">AI Model Use Disclosure</h2>
          </div>
          <p className="text-slate-700 leading-relaxed mb-4">
            Postd uses AI models to assist with generating marketing content.
          </p>
        </SectionCard>

        <SectionCard>
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="w-6 h-6 text-indigo-600" />
            <h2 className="text-2xl font-black text-slate-900">Models May Include</h2>
          </div>
          <ul className="list-disc list-inside space-y-2 text-slate-700 ml-4">
            <li>OpenAI GPT models</li>
            <li>Anthropic Claude models</li>
            <li>Postd proprietary prompt layers</li>
          </ul>
        </SectionCard>

        <SectionCard>
          <h2 className="text-2xl font-black text-slate-900 mb-4">What AI Generates</h2>
          <ul className="list-disc list-inside space-y-2 text-slate-700 ml-4">
            <li>Captions</li>
            <li>Blogs</li>
            <li>Visual concepts</li>
            <li>Insights</li>
            <li>Voice & tone suggestions</li>
            <li>Brand analysis summaries</li>
          </ul>
        </SectionCard>

        <SectionCard>
          <div className="flex items-center gap-3 mb-4">
            <AlertCircle className="w-6 h-6 text-indigo-600" />
            <h2 className="text-2xl font-black text-slate-900">What Users Should Know</h2>
          </div>
          <ul className="list-disc list-inside space-y-2 text-slate-700 ml-4">
            <li>AI outputs may contain errors</li>
            <li>Human review is recommended before publishing</li>
            <li>Users own their generated content</li>
            <li>No AI training uses customer data</li>
          </ul>
        </SectionCard>

        <SectionCard>
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-6 h-6 text-indigo-600" />
            <h2 className="text-2xl font-black text-slate-900">Data Privacy</h2>
          </div>
          <p className="text-slate-700 leading-relaxed">
            We do not use your content or data to train AI models. Your brand data remains private and is only used to generate content for your account.
          </p>
        </SectionCard>
      </div>
    </PageShell>
  );
}

