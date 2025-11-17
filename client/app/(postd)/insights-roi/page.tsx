import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageShell } from "@/components/postd/ui/layout/PageShell";
import { PageHeader } from "@/components/postd/ui/layout/PageHeader";
import {
  ROIDashboard,
  mockROIData,
  BrandEvolutionVisualization,
  mockBrandEvolutionData,
} from "@/components/retention";

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
            {/* TODO: Replace mockROIData with real API data when ROI tracking is implemented */}
            <ROIDashboard data={mockROIData} />
          </TabsContent>

          <TabsContent value="evolution">
            <BrandEvolutionVisualization data={mockBrandEvolutionData} />
          </TabsContent>
        </Tabs>
      </div>
    </PageShell>
  );
}
