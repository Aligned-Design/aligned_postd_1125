import { AppShell } from "@postd/layout/AppShell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ROIDashboard,
  mockROIData,
  BrandEvolutionVisualization,
  mockBrandEvolutionData,
} from "@/components/retention";

export default function InsightsROI() {
  return (
    <AppShell>
      <div className="min-h-screen bg-gradient-to-b from-indigo-50/30 via-white to-blue-50/20">
        <div className="p-4 sm:p-6 md:p-8">
          <Tabs defaultValue="roi" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 lg:w-auto lg:inline-grid">
              <TabsTrigger value="roi">ROI & Value</TabsTrigger>
              <TabsTrigger value="evolution">Brand Evolution</TabsTrigger>
            </TabsList>

            <TabsContent value="roi">
              <ROIDashboard data={mockROIData} />
            </TabsContent>

            <TabsContent value="evolution">
              <BrandEvolutionVisualization data={mockBrandEvolutionData} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppShell>
  );
}
