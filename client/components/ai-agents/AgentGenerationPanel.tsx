import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import React, { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sparkles,
  Lightbulb,
  PenSquare,
  Palette,
  Shield,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
} from "lucide-react";
import { cn } from "@/lib/design-system";
import { useToast } from "@/hooks/use-toast";
import { useBrand } from "@/contexts/BrandContext";
import { AgentGenerateRequest, AgentGenerateResponse } from "@shared/api";
import {
  DocOutput,
  DesignOutput,
  AdvisorOutput,
  BrandFidelityScore,
  LinterResult,
} from "@/types/agent-config";

interface AgentGenerationPanelProps {
  onContentGenerated: (content: {
    title?: string;
    caption: string;
    hashtags: string[];
    cta_text?: string;
  }) => void;
  platform: string;
  contentType: string;
}

export function AgentGenerationPanel({
  onContentGenerated,
  platform,
  contentType,
}: AgentGenerationPanelProps) {
  const { currentBrand } = useBrand();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeAgent, setActiveAgent] = useState<
    "advisor" | "doc" | "design" | null
  >(null);
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState("");
  const [advisorInsights, setAdvisorInsights] = useState<AdvisorOutput | null>(
    null,
  );
  const [generatedContent, setGeneratedContent] = useState<DocOutput | null>(
    null,
  );
  const [designOutput, setDesignOutput] = useState<DesignOutput | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const generateAdvisorInsights = async () => {
    if (!currentBrand?.id) return;

    setIsGenerating(true);
    setActiveAgent("advisor");

    try {
      const response = await fetch("/api/agents/generate/advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand_id: currentBrand.id,
        } as AgentGenerateRequest),
      });

      const result: AgentGenerateResponse = await response.json();

      if (result.success && result.output) {
        setAdvisorInsights(result.output as AdvisorOutput);
        toast({
          title: "Insights Generated",
          description:
            "AI Advisor has analyzed your brand performance and provided recommendations.",
        });
      } else {
        throw new Error(result.error || "Failed to generate insights");
      }
    } catch (error) {
      console.error("Advisor generation failed:", error);
      toast({
        title: "Generation Failed",
        description:
          error instanceof Error
            ? error.message
            : "Failed to generate insights",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
      setActiveAgent(null);
    }
  };

  const generateContent = async () => {
    if (!currentBrand?.id) return;

    setIsGenerating(true);
    setActiveAgent("doc");

    try {
      const response = await fetch("/api/agents/generate/doc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand_id: currentBrand.id,
          input: {
            topic:
              topic || advisorInsights?.topics[0]?.title || "Share an update",
            tone: tone || "professional",
            platform,
            format:
              contentType === "story"
                ? "story"
                : contentType === "reel"
                  ? "reel"
                  : contentType === "carousel"
                    ? "carousel"
                    : "post",
            max_length: 2200,
            include_cta: true,
            cta_type: "link",
            advisor_context: advisorInsights,
          },
        } as AgentGenerateRequest),
      });

      const result: AgentGenerateResponse = await response.json();

      if (result.success && result.output) {
        const docOutput = result.output as DocOutput;
        setGeneratedContent(docOutput);

        // Automatically generate design if content was successful
        if (docOutput.bfs?.passed && docOutput.linter?.passed) {
          await generateDesign(docOutput);
        }

        setShowPreview(true);
        toast({
          title: "Content Generated",
          description: `Brand Fidelity Score: ${(docOutput.bfs?.overall * 100).toFixed(0)}%`,
        });
      } else {
        throw new Error(result.error || "Failed to generate content");
      }
    } catch (error) {
      console.error("Content generation failed:", error);
      toast({
        title: "Generation Failed",
        description:
          error instanceof Error ? error.message : "Failed to generate content",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
      setActiveAgent(null);
    }
  };

  const generateDesign = async (docContent?: DocOutput) => {
    if (!currentBrand?.id || (!generatedContent && !docContent)) return;

    const content = docContent || generatedContent!;
    setActiveAgent("design");

    try {
      const response = await fetch("/api/agents/generate/design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brand_id: currentBrand.id,
          input: {
            aspect_ratio:
              contentType === "story" || contentType === "reel"
                ? "1080x1920"
                : "1080x1080",
            theme: content.post_theme,
            brand_colors: [currentBrand.primary_color].filter(Boolean),
            tone: content.tone_used,
            headline: content.headline,
            doc_context: content,
          },
        } as AgentGenerateRequest),
      });

      const result: AgentGenerateResponse = await response.json();

      if (result.success && result.output) {
        setDesignOutput(result.output as DesignOutput);
        toast({
          title: "Design Generated",
          description: "Visual template and guidelines created successfully.",
        });
      } else {
        throw new Error(result.error || "Failed to generate design");
      }
    } catch (error) {
      console.error("Design generation failed:", error);
      toast({
        title: "Design Generation Failed",
        description:
          error instanceof Error ? error.message : "Failed to generate design",
        variant: "destructive",
      });
    } finally {
      setActiveAgent(null);
    }
  };

  const acceptContent = () => {
    if (!generatedContent) return;

    onContentGenerated({
      title: generatedContent.headline,
      caption: generatedContent.body,
      hashtags: generatedContent.hashtags,
      cta_text: generatedContent.cta,
    });

    toast({
      title: "Content Applied",
      description: "AI-generated content has been added to your post.",
    });

    setShowPreview(false);
  };

  return (
    <Card className="border-violet/20 bg-gradient-to-br from-violet/5 to-transparent">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-violet" />
          AI Content Generation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="quick" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="quick">Quick Generate</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <TabsContent value="quick" className="space-y-4">
            <div className="space-y-3">
              <Button
                onClick={generateContent}
                disabled={isGenerating}
                className="w-full bg-violet hover:bg-violet/90"
              >
                {isGenerating && activeAgent === "doc" ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Generating Content...
                  </>
                ) : (
                  <>
                    <PenSquare className="mr-2 h-4 w-4" />
                    Generate Content with AI
                  </>
                )}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                AI will analyze your brand and create optimized content for{" "}
                {platform}
              </p>
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="topic">Topic (Optional)</Label>
                <Input
                  id="topic"
                  placeholder="e.g., Product launch, Behind the scenes..."
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tone">Tone (Optional)</Label>
                <Input
                  id="tone"
                  placeholder="e.g., Professional, Casual, Exciting..."
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Button
                onClick={generateAdvisorInsights}
                variant="outline"
                disabled={isGenerating}
                className="w-full"
              >
                {isGenerating && activeAgent === "advisor" ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing Performance...
                  </>
                ) : (
                  <>
                    <Lightbulb className="mr-2 h-4 w-4" />
                    Get AI Insights First
                  </>
                )}
              </Button>

              <Button
                onClick={generateContent}
                disabled={isGenerating}
                className="w-full bg-violet hover:bg-violet/90"
              >
                {isGenerating && activeAgent === "doc" ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Generating Content...
                  </>
                ) : (
                  <>
                    <PenSquare className="mr-2 h-4 w-4" />
                    Generate Content
                  </>
                )}
              </Button>

              {generatedContent && (
                <Button
                  onClick={() => generateDesign()}
                  variant="outline"
                  disabled={isGenerating}
                  className="w-full"
                >
                  {isGenerating && activeAgent === "design" ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Creating Design...
                    </>
                  ) : (
                    <>
                      <Palette className="mr-2 h-4 w-4" />
                      Generate Design
                    </>
                  )}
                </Button>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Advisor Insights Display */}
        {advisorInsights && (
          <Card className="border-azure/20 bg-azure/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-azure" />
                AI Advisor Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {advisorInsights.topics.slice(0, 2).map((topic, index) => (
                <div key={index} className="text-sm">
                  <p className="font-medium">{topic.title}</p>
                  <p className="text-muted-foreground text-xs">
                    {topic.rationale}
                  </p>
                </div>
              ))}
              {advisorInsights.best_times.length > 0 && (
                <div className="text-sm">
                  <p className="font-medium">Best Time to Post:</p>
                  <p className="text-muted-foreground text-xs">
                    {advisorInsights.best_times[0].day} at{" "}
                    {advisorInsights.best_times[0].slot}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Content Preview Dialog */}
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-violet" />
                Generated Content Preview
              </DialogTitle>
              <DialogDescription>
                Review the AI-generated content and quality scores before
                applying to your post.
              </DialogDescription>
            </DialogHeader>

            {generatedContent && (
              <div className="space-y-6">
                {/* Quality Scores */}
                <div className="grid gap-4 md:grid-cols-2">
                  <BrandFidelityScoreCard score={generatedContent.bfs} />
                  <LinterResultCard result={generatedContent.linter} />
                </div>

                {/* Generated Content */}
                <div className="space-y-4">
                  {generatedContent.headline && (
                    <div>
                      <Label className="text-sm font-medium">Headline</Label>
                      <p className="mt-1 p-3 bg-muted rounded-lg">
                        {generatedContent.headline}
                      </p>
                    </div>
                  )}

                  <div>
                    <Label className="text-sm font-medium">Caption</Label>
                    <Textarea
                      value={generatedContent.body}
                      readOnly
                      className="mt-1 min-h-[120px]"
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium">
                      Call to Action
                    </Label>
                    <p className="mt-1 p-3 bg-muted rounded-lg">
                      {generatedContent.cta}
                    </p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Hashtags</Label>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {generatedContent.hashtags.map((tag, index) => (
                        <Badge key={index} variant="secondary">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Design Output */}
                {designOutput && (
                  <Card className="border-coral/20 bg-coral/5">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Palette className="h-4 w-4 text-coral" />
                        Design Recommendations
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <p>
                        <span className="font-medium">Template:</span>{" "}
                        {designOutput.template_ref}
                      </p>
                      <p>
                        <span className="font-medium">Cover Title:</span>{" "}
                        {designOutput.cover_title}
                      </p>
                      <div>
                        <span className="font-medium">Visual Elements:</span>
                        <ul className="list-disc list-inside ml-4 text-xs text-muted-foreground">
                          {designOutput.visual_elements.map(
                            (element, index) => (
                              <li key={index}>{element}</li>
                            ),
                          )}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                  <Button onClick={acceptContent} className="flex-1">
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Apply to Post
                  </Button>
                  <Button
                    variant="outline"
                    onClick={generateContent}
                    disabled={isGenerating}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Regenerate
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

function BrandFidelityScoreCard({ score }: { score: BrandFidelityScore }) {
  const getScoreColor = (value: number) => {
    if (value >= 0.8) return "text-green-600";
    if (value >= 0.6) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreIcon = (passed: boolean) => {
    return passed ? (
      <CheckCircle2 className="h-4 w-4 text-green-600" />
    ) : (
      <XCircle className="h-4 w-4 text-red-600" />
    );
  };

  return (
    <Card
      className={cn(
        "border-2",
        score.passed
          ? "border-green-200 bg-green-50/50"
          : "border-red-200 bg-red-50/50",
      )}
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Brand Fidelity Score
          {getScoreIcon(score.passed)}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="text-2xl font-bold">
          <span className={getScoreColor(score.overall)}>
            {(score.overall * 100).toFixed(0)}%
          </span>
        </div>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span>Tone Alignment:</span>
            <span className={getScoreColor(score.tone_alignment)}>
              {(score.tone_alignment * 100).toFixed(0)}%
            </span>
          </div>
          <div className="flex justify-between">
            <span>Terminology:</span>
            <span className={getScoreColor(score.terminology_match)}>
              {(score.terminology_match * 100).toFixed(0)}%
            </span>
          </div>
          <div className="flex justify-between">
            <span>Compliance:</span>
            <span className={getScoreColor(score.compliance)}>
              {(score.compliance * 100).toFixed(0)}%
            </span>
          </div>
        </div>
        {score.issues.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Issues:</p>
            {score.issues.map((issue, index) => (
              <p key={index} className="text-xs text-red-600">
                • {issue}
              </p>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function LinterResultCard({ result }: { result: LinterResult }) {
  const getStatusIcon = () => {
    if (result.blocked) return <XCircle className="h-4 w-4 text-red-600" />;
    if (result.needs_human_review)
      return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    if (result.passed)
      return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    return <Info className="h-4 w-4 text-blue-600" />;
  };

  const getStatusColor = () => {
    if (result.blocked) return "border-red-200 bg-red-50/50";
    if (result.needs_human_review) return "border-yellow-200 bg-yellow-50/50";
    if (result.passed) return "border-green-200 bg-green-50/50";
    return "border-blue-200 bg-blue-50/50";
  };

  return (
    <Card className={cn("border-2", getStatusColor())}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Content Safety Check
          {getStatusIcon()}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="text-sm font-medium">
          {result.blocked && "Blocked"}
          {result.needs_human_review && "Needs Review"}
          {result.passed && "Passed"}
        </div>

        {result.fixes_applied.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">
              Auto-fixes Applied:
            </p>
            {result.fixes_applied.map((fix, index) => (
              <p key={index} className="text-xs text-green-600">
                • {fix}
              </p>
            ))}
          </div>
        )}

        {(result.banned_phrases_found.length > 0 ||
          result.missing_disclaimers.length > 0) && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Issues:</p>
            {result.banned_phrases_found.map((phrase, index) => (
              <p key={index} className="text-xs text-red-600">
                • Banned phrase: {phrase}
              </p>
            ))}
            {result.missing_disclaimers.map((disclaimer, index) => (
              <p key={index} className="text-xs text-yellow-600">
                • Missing: {disclaimer}
              </p>
            ))}
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          Toxicity Score: {(result.toxicity_score * 100).toFixed(0)}%
        </div>
      </CardContent>
    </Card>
  );
}
