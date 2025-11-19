import { useState, useEffect } from "react";
import { useCurrentBrand } from "@/hooks/useCurrentBrand";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { DashboardSkeleton } from "@/components/ui/skeletons";
import { PageShell } from "@/components/postd/ui/layout/PageShell";
import { PageHeader } from "@/components/postd/ui/layout/PageHeader";
import { EmptyState } from "@/components/postd/ui/feedback/EmptyState";
import { NewPostButton } from "@/components/postd/shared/NewPostButton";
import { MultiClientApprovalDashboard } from "@/components/collaboration/MultiClientApprovalDashboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  MessageSquare,
  Shield,
  PenSquare,
  Sparkles,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/design-system";
import {
  ReviewActionRequest,
  ReviewActionResponse,
} from "@shared/api";
import type {
  ReviewQueueResponse,
  ReviewQueueItem,
} from "@shared/review-queue";
import {
  BrandFidelityScore,
  LinterResult,
  DocOutput,
} from "@/types/agent-config";

interface ReviewItem {
  id: string;
  brand_id: string;
  agent: string;
  input: unknown;
  output: DocOutput | unknown;
  bfs?: BrandFidelityScore;
  linter_results?: LinterResult | Record<string, unknown>; // ✅ FIX: Allow Record for linter_results
  timestamp: string;
  error?: string;
}

export default function Approvals() {
  const { brandId, loading: brandLoading } = useCurrentBrand();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<ReviewItem | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // ✅ FIX: Add loadReviewQueue to dependencies or use useCallback
  useEffect(() => {
    if (brandId) {
      loadReviewQueue();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brandId]); // loadReviewQueue is stable, safe to omit

  const loadReviewQueue = async () => {
    if (!brandId) return;

    setLoading(true);
    try {
      const response = await fetch(
        `/api/agents/review/queue/${brandId}`,
      );

      // If API server is not available, use empty queue
      if (!response.ok) {
        console.warn("API server not available, using empty queue");
        setReviewItems([]);
        setLoading(false);
        return;
      }

      const data: ReviewQueueResponse = await response.json();
      
      // ✅ FIX: Type guard to safely transform bfs Record to BrandFidelityScore
      const transformBfs = (bfs: unknown): BrandFidelityScore | undefined => {
        if (!bfs || typeof bfs !== "object") return undefined;
        const bfsObj = bfs as Record<string, unknown>;
        return {
          overall: typeof bfsObj.overall === "number" ? bfsObj.overall : 0,
          tone_alignment: typeof bfsObj.tone_alignment === "number" ? bfsObj.tone_alignment : 0,
          terminology_match: typeof bfsObj.terminology_match === "number" ? bfsObj.terminology_match : 0,
          compliance: typeof bfsObj.compliance === "number" ? bfsObj.compliance : 0,
          cta_fit: typeof bfsObj.cta_fit === "number" ? bfsObj.cta_fit : 0,
          platform_fit: typeof bfsObj.platform_fit === "number" ? bfsObj.platform_fit : 0,
          passed: typeof bfsObj.passed === "boolean" ? bfsObj.passed : false,
          issues: Array.isArray(bfsObj.issues) ? bfsObj.issues as string[] : [],
          regeneration_count: typeof bfsObj.regeneration_count === "number" ? bfsObj.regeneration_count : 0,
        };
      };
      
      // Map API response items to local ReviewItem interface
      const mappedItems: ReviewItem[] = (data.items || []).map((item: ReviewQueueItem) => ({
        id: item.id || item.log_id || "",
        brand_id: item.brand_id || brandId,
        agent: item.agent || "doc",
        input: item.input || {},
        output: item.output || {},
        bfs: transformBfs(item.bfs),
        linter_results: item.linter_results,
        timestamp: item.timestamp || item.created_at || new Date().toISOString(),
        error: item.error,
      }));
      setReviewItems(mappedItems);
    } catch (error) {
      console.warn("Error loading review queue, using empty queue:", error);
      // Set empty queue instead of showing error
      setReviewItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (itemId: string) => {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/agents/review/approve/${itemId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewer_notes: reviewNotes,
        }),
      });

      const result: ReviewActionResponse = await response.json();

      if (result.success) {
        toast({
          title: "Content Approved",
          description:
            "The content has been approved and can now be scheduled.",
        });

        // Remove from queue
        setReviewItems((prev) => prev.filter((item) => item.id !== itemId));
        setSelectedItem(null);
        setReviewNotes("");
      } else {
        throw new Error(result.error || "Failed to approve content");
      }
    } catch (error) {
      console.error("Error approving content:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to approve content",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (itemId: string) => {
    setActionLoading(true);
    try {
      const response = await fetch(`/api/agents/review/reject/${itemId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewer_notes: reviewNotes,
        }),
      });

      const result: ReviewActionResponse = await response.json();

      if (result.success) {
        toast({
          title: "Content Rejected",
          description:
            "The content has been rejected and will need to be regenerated.",
        });

        // Remove from queue
        setReviewItems((prev) => prev.filter((item) => item.id !== itemId));
        setSelectedItem(null);
        setReviewNotes("");
      } else {
        throw new Error(result.error || "Failed to reject content");
      }
    } catch (error) {
      console.error("Error rejecting content:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to reject content",
        variant: "destructive",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const getAgentIcon = (agent: string) => {
    switch (agent) {
      case "doc":
        return <PenSquare className="h-4 w-4 text-violet" />;
      case "design":
        return <Sparkles className="h-4 w-4 text-coral" />;
      case "advisor":
        return <MessageSquare className="h-4 w-4 text-azure" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  const getAgentName = (agent: string) => {
    switch (agent) {
      case "doc":
        return "The Copywriter";
      case "design":
        return "The Creative";
      case "advisor":
        return "The Advisor";
      default:
        return "Postd";
    }
  };

  const __formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  if (brandLoading || loading) {
    return <DashboardSkeleton />;
  }

  if (!brandId) {
    return (
      <EmptyState
        icon={<Shield className="w-8 h-8 text-slate-400" />}
        title="No Brand Selected"
        description="Select a brand to view its review queue."
      />
    );
  }

  return (
    <PageShell maxWidth="full">
      <PageHeader
        title="Content Approvals"
        subtitle="Review AI-generated content that requires human approval before publishing."
        actions={<NewPostButton variant="default" size="md" label="Create Content" />}
      />

      <Tabs defaultValue="single-brand" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="single-brand">Single Brand Review</TabsTrigger>
          <TabsTrigger value="multi-client">Multi-Client Dashboard</TabsTrigger>
        </TabsList>

        <TabsContent value="single-brand" className="space-y-6">
          <div className="max-w-6xl mx-auto">
        {reviewItems.length === 0 ? (
          <EmptyState
            icon={<Clock className="w-8 h-8 text-slate-400" />}
            title="No Content to Review"
            description="All AI-generated content has been automatically approved or there's no pending content."
            action={{
              label: "Refresh Queue",
              onClick: loadReviewQueue,
            }}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {reviewItems.map((item) => (
              <ReviewItemCard
                key={item.id}
                item={item}
                onSelect={() => setSelectedItem(item)}
                onApprove={() => handleApprove(item.id)}
                onReject={() => handleReject(item.id)}
                loading={actionLoading}
              />
            ))}
          </div>
        )}

        {/* Review Dialog */}
        <Dialog
          open={!!selectedItem}
          onOpenChange={() => setSelectedItem(null)}
        >
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {selectedItem && getAgentIcon(selectedItem.agent)}
                Review {selectedItem && getAgentName(selectedItem.agent)}{" "}
                Content
              </DialogTitle>
              <DialogDescription>
                Review the generated content and quality scores before approving
                or rejecting.
              </DialogDescription>
            </DialogHeader>

            {selectedItem && (
              <div className="space-y-6">
                {/* Quality Scores */}
                {selectedItem.bfs && selectedItem.linter_results && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <BrandFidelityScoreCard score={selectedItem.bfs} />
                    {/* ✅ FIX: Type guard for linter_results */}
                    {typeof selectedItem.linter_results === "object" && 
                     selectedItem.linter_results !== null && 
                     "passed" in selectedItem.linter_results && (
                      <LinterResultCard result={selectedItem.linter_results as LinterResult} />
                    )}
                  </div>
                )}

                {/* Generated Content */}
                {selectedItem.agent === "doc" && selectedItem.output && (
                  <DocOutputCard output={selectedItem.output as DocOutput} />
                )}

                {/* Review Notes */}
                <div className="space-y-2">
                  <Label htmlFor="review-notes">Review Notes (Optional)</Label>
                  <Textarea
                    id="review-notes"
                    placeholder="Add notes about why you approved or rejected this content..."
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    rows={3}
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <Button
                    onClick={() => handleApprove(selectedItem.id)}
                    disabled={actionLoading}
                    className="flex-1 whitespace-nowrap"
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Approve & Publish
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleReject(selectedItem.id)}
                    disabled={actionLoading}
                    className="flex-1 whitespace-nowrap"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Reject
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
          </div>
        </TabsContent>

        <TabsContent value="multi-client" className="space-y-6">
          <MultiClientApprovalDashboard />
        </TabsContent>
      </Tabs>
    </PageShell>
  );
}

function ReviewItemCard({
  item,
  onSelect,
  onApprove,
  onReject,
  loading,
}: {
  item: ReviewItem;
  onSelect: () => void;
  onApprove: () => void;
  onReject: () => void;
  loading: boolean;
}) {
  const getStatusColor = () => {
    if (item.linter_results?.blocked) return "border-red-200 bg-red-50/50";
    if (item.linter_results?.needs_human_review)
      return "border-yellow-200 bg-yellow-50/50";
    if (item.bfs && item.bfs.overall < 0.8)
      return "border-orange-200 bg-orange-50/50";
    return "border-blue-200 bg-blue-50/50";
  };

  const getStatusIcon = () => {
    if (item.linter_results?.blocked)
      return <XCircle className="h-4 w-4 text-red-600" />;
    if (item.linter_results?.needs_human_review)
      return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    return <Clock className="h-4 w-4 text-blue-600" />;
  };

  const getAgentIcon = (agent: string) => {
    switch (agent) {
      case "doc":
        return <PenSquare className="h-4 w-4 text-violet" />;
      case "design":
        return <Sparkles className="h-4 w-4 text-coral" />;
      case "advisor":
        return <MessageSquare className="h-4 w-4 text-azure" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  return (
    <Card
      className={cn(
        "border-2 cursor-pointer transition-all hover:shadow-md",
        getStatusColor(),
      )}
      onClick={onSelect}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getAgentIcon(item.agent)}
            <CardTitle className="text-base sm:text-lg leading-snug break-normal break-words">
              {item.agent === "doc"
                ? "Content Generation"
                : item.agent === "design"
                  ? "Design Creation"
                  : "Advisor Analysis"}
            </CardTitle>
            {getStatusIcon()}
          </div>
          <Badge variant="outline" className="whitespace-nowrap">
            {new Date(item.timestamp).toLocaleDateString()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Preview of content */}
        {item.agent === "doc" && item.output && (
          <div className="bg-muted rounded-lg p-3">
            <p className="text-sm line-clamp-3">
              {(item.output as DocOutput)?.body || "No content available"}
            </p>
          </div>
        )}

        {/* Quality indicators */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            {item.bfs && (
              <span
                className={cn(
                  "font-medium",
                  item.bfs.overall >= 0.8
                    ? "text-green-600"
                    : "text-yellow-600",
                )}
              >
                BFS: {(item.bfs.overall * 100).toFixed(0)}%
              </span>
            )}
            {item.linter_results && (
              <span
                className={cn(
                  "font-medium",
                  item.linter_results.passed
                    ? "text-green-600"
                    : item.linter_results.blocked
                      ? "text-red-600"
                      : "text-yellow-600",
                )}
              >
                Safety:{" "}
                {item.linter_results.passed
                  ? "Passed"
                  : item.linter_results.blocked
                    ? "Blocked"
                    : "Review Needed"}
              </span>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onApprove();
              }}
              disabled={loading}
              className="whitespace-nowrap"
            >
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                onReject();
              }}
              disabled={loading}
              className="whitespace-nowrap"
            >
              <XCircle className="h-3 w-3 mr-1" />
              Reject
            </Button>
          </div>
        </div>
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
        <CardTitle className="text-sm sm:text-base leading-snug break-normal break-words flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Brand Fidelity Score
          {score.passed ? (
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          ) : (
            <XCircle className="h-4 w-4 text-red-600" />
          )}
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
      </CardContent>
    </Card>
  );
}

function LinterResultCard({ result }: { result: LinterResult }) {
  return (
    <Card
      className={cn(
        "border-2",
        result.blocked
          ? "border-red-200 bg-red-50/50"
          : result.needs_human_review
            ? "border-yellow-200 bg-yellow-50/50"
            : result.passed
              ? "border-green-200 bg-green-50/50"
              : "border-blue-200 bg-blue-50/50",
      )}
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-sm sm:text-base leading-snug break-normal break-words flex items-center gap-2">
          <Shield className="h-4 w-4" />
          Content Safety Check
          {result.blocked && <XCircle className="h-4 w-4 text-red-600" />}
          {result.needs_human_review && (
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          )}
          {result.passed && <CheckCircle2 className="h-4 w-4 text-green-600" />}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="text-sm font-medium">
          {result.blocked && "Blocked"}
          {result.needs_human_review && "Needs Review"}
          {result.passed && "Passed"}
        </div>

        <div className="text-xs text-muted-foreground">
          Toxicity Score: {(result.toxicity_score * 100).toFixed(0)}%
        </div>

        {result.fixes_applied.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">
              Auto-fixes Applied:
            </p>
            {result.fixes_applied.slice(0, 2).map((fix, index) => (
              <p key={index} className="text-xs text-green-600">
                • {fix}
              </p>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DocOutputCard({ output }: { output: DocOutput }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm sm:text-base leading-snug break-normal break-words">Generated Content</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {output.headline && (
          <div>
            <Label className="text-sm font-medium">Headline</Label>
            <p className="mt-1 p-3 bg-muted rounded-lg">{output.headline}</p>
          </div>
        )}

        <div>
          <Label className="text-sm font-medium">Caption</Label>
          <Textarea
            value={output.body}
            readOnly
            className="mt-1 min-h-[120px]"
          />
        </div>

        <div>
          <Label className="text-sm font-medium">Call to Action</Label>
          <p className="mt-1 p-3 bg-muted rounded-lg">{output.cta}</p>
        </div>

        <div>
          <Label className="text-sm font-medium">Hashtags</Label>
          <div className="mt-1 flex flex-wrap gap-1">
            {output.hashtags.map((tag, index) => (
              <Badge key={index} variant="secondary">
                #{tag}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
