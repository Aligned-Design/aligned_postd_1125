import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageShell } from "@/components/postd/ui/layout/PageShell";
import { PageHeader } from "@/components/postd/ui/layout/PageHeader";
import { FileQuestion, TrendingUp } from "lucide-react";

export default function InsightsROI() {
  return (
    <PageShell>
      <PageHeader
        title="Insights & ROI"
        subtitle="Track your brand's value and evolution over time"
      />
      <div className="space-y-6">
        <Tabs defaultValue="roi" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:inline-grid">
            <TabsTrigger value="roi">ROI & Value</TabsTrigger>
            <TabsTrigger value="evolution">Brand Evolution</TabsTrigger>
          </TabsList>

          <TabsContent value="roi">
            {/* ✅ REMOVED: mockROIData - showing "coming soon" instead of fake data */}
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <TrendingUp className="w-16 h-16 text-indigo-300 mb-4" />
              <h3 className="text-xl font-bold text-slate-900 mb-2">ROI Insights Coming Soon</h3>
              <p className="text-slate-600 text-center max-w-md mb-6">
                This dashboard will show your real ROI metrics, time saved, and value generated once tracking is enabled.
              </p>
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 max-w-md">
                <p className="text-sm text-indigo-900">
                  <strong>What you'll see:</strong> Monthly time saved, ROI comparison, engagement growth, and cost savings vs. hiring a social media manager.
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="evolution">
            {/* ✅ REMOVED: mockBrandEvolutionData - showing "coming soon" instead of fake data */}
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <FileQuestion className="w-16 h-16 text-indigo-300 mb-4" />
              <h3 className="text-xl font-bold text-slate-900 mb-2">Brand Evolution Tracking Coming Soon</h3>
              <p className="text-slate-600 text-center max-w-md mb-6">
                This visualization will show how your brand voice, visual identity, and content performance evolve over time.
              </p>
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 max-w-md">
                <p className="text-sm text-indigo-900">
                  <strong>What you'll see:</strong> Voice profile changes, color evolution, content performance trends, and AI-driven insights about your brand's growth.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </PageShell>
  );
}
