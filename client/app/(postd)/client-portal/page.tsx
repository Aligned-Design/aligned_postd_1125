import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useBrand } from "@/contexts/BrandContext";
import { useAuth } from "@/lib/auth/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ClientAnalyticsDashboard } from "@/components/analytics";
import {
  FeedbackImpactTimeline,
  CollaborativeApprovalFlow,
  ClientQAChat,
  ApprovalSLATracker,
} from "@/components/collaboration";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Home,
  BarChart3,
  CheckCircle,
  Upload,
  Star,
  Calendar,
  MessageSquare,
  TrendingUp,
  Eye,
  Heart,
  Users,
  Clock,
  Share2,
  Download,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Play,
  ThumbsUp,
  ThumbsDown,
  Send,
  Copy,
  Shield,
  History,
  Filter,
  Search,
  Plus,
  X,
  ChevronRight,
  Sparkles,
  HelpCircle,
  Edit3,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/design-system";
import {
  ClientDashboardData,
  ContentItem,
  ApprovalAction,
} from "@shared/client-portal";
import { WorkflowTracker } from "@/components/workflow/WorkflowTracker";
import { WorkflowAction } from "@shared/workflow";
import { useToast } from "@/hooks/use-toast";

export default function ClientPortal() {
  const [dashboardData, setDashboardData] =
    useState<ClientDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("overview");
  const { role } = useAuth();
  
  // Check if user is a view-only role (cannot approve)
  // VIEWER role has no approve permissions; also check for undefined/null roles
  const isViewOnly = role === "VIEWER" || !role;

  useEffect(() => {
    loadDashboardData();
    // Apply client branding on load
    applyClientBranding();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/client-portal/dashboard");
      if (response.ok) {
        const data = await response.json() as ClientDashboardData;
        setDashboardData(data);
      } else {
        const error = await response.json().catch(() => ({ message: "Failed to load dashboard" }));
        console.error("Failed to load dashboard data:", error);
      }
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const applyClientBranding = () => {
    // Apply client brand colors and favicon
    if (dashboardData?.brandInfo?.colors?.primary) {
      document.documentElement.style.setProperty(
        "--color-primary",
        dashboardData.brandInfo.colors.primary,
      );
    }
    if (dashboardData?.brandInfo?.favicon) {
      const link = document.querySelector(
        "link[rel*='icon']",
      ) as HTMLLinkElement;
      if (link) link.href = dashboardData.brandInfo.favicon;
    }
  };

  const handleWorkflowAction = async (action: WorkflowAction) => {
    try {
      const response = await fetch("/api/client-portal/workflow/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(action),
      });

      if (response.ok) {
        await loadDashboardData();
      } else {
        const error = await response.json().catch(() => ({ message: "Failed to process workflow action" }));
        console.error("Failed to process workflow action:", error);
      }
    } catch (error) {
      console.error("Failed to process workflow action:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your portal...</p>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Unable to load dashboard</p>
          <Button onClick={loadDashboardData} className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Header with Client Branding */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-6">
              {dashboardData.brandInfo.logo && (
                <img
                  src={dashboardData.brandInfo.logo}
                  alt={dashboardData.brandInfo.name}
                  className="h-16 w-16 rounded-lg object-cover"
                />
              )}
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {dashboardData.brandInfo.name}
                </h1>
                <p className="text-gray-600 mt-1">Social Media Dashboard</p>
              </div>
            </div>

            <div className="text-right">
              <Badge variant="outline" className="mb-2">
                Last sync: {new Date().toLocaleDateString()}
              </Badge>
              <p className="text-sm text-gray-500">
                Managed by {dashboardData.agencyInfo.name}
              </p>
            </div>
          </div>

          {/* Progress Banner */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-blue-900 mb-2">
                  Your November plan is {dashboardData.metrics.campaignProgress}
                  % ready
                </h3>
                <p className="text-blue-700">
                  {dashboardData.aiInsight.description}
                </p>
              </div>
              <div className="flex gap-3">
                {!isViewOnly && (
                  <ActionChip
                    icon={<CheckCircle className="h-4 w-4" />}
                    label={`Approve items (${dashboardData.metrics.pendingApprovals})`}
                    onClick={() => setActiveSection("approvals")}
                    variant="primary"
                  />
                )}
                <ActionChip
                  icon={<Upload className="h-4 w-4" />}
                  label="Upload assets"
                  onClick={() => setActiveSection("uploads")}
                />
                <ActionChip
                  icon={<Share2 className="h-4 w-4" />}
                  label="Share analytics"
                  onClick={() => setActiveSection("analytics")}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6">
          <nav className="flex space-x-8">
            {[
              {
                id: "overview",
                label: "What's Coming Up",
                icon: <Home className="h-4 w-4" />,
              },
              {
                id: "approvals",
                label: "Content Review",
                icon: <CheckCircle className="h-4 w-4" />,
                badge: dashboardData.metrics.pendingApprovals,
              },
              {
                id: "history",
                label: "History",
                icon: <History className="h-4 w-4" />,
              },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={cn(
                  "flex items-center gap-2 px-3 py-4 border-b-2 transition-colors",
                  activeSection === item.id
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-600 hover:text-gray-900",
                )}
              >
                {item.icon}
                <span className="font-medium">{item.label}</span>
                {item.badge && item.badge > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {item.badge}
                  </Badge>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeSection === "overview" && (
          <OverviewSection data={dashboardData} />
        )}
        {activeSection === "approvals" && (
          <ApprovalsSection
            data={dashboardData}
            onUpdate={loadDashboardData}
            onWorkflowAction={handleWorkflowAction}
            isViewOnly={isViewOnly}
          />
        )}
        {activeSection === "history" && (
          <HistorySection data={dashboardData} />
        )}
      </div>

      {/* Footer */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              {dashboardData.agencyInfo.logo && (
                <img
                  src={dashboardData.agencyInfo.logo}
                  alt={dashboardData.agencyInfo.name}
                  className="h-8 w-auto"
                />
              )}
              <div>
                <p className="font-medium">{dashboardData.agencyInfo.name}</p>
                <p className="text-sm text-gray-600">
                  {dashboardData.agencyInfo.contactEmail}
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-500">Powered by Postd</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function ActionChip({
  icon,
  label,
  onClick,
  variant = "default",
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  variant?: "default" | "primary";
}) {
  return (
    <Button
      onClick={onClick}
      variant={variant === "primary" ? "default" : "outline"}
      size="sm"
      className="gap-2"
    >
      {icon}
      {label}
    </Button>
  );
}

function OverviewSection({ data }: { data: ClientDashboardData }) {
  return (
    <div className="space-y-8">
      {/* KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Reach"
          value={formatNumber(data.metrics.totalReach)}
          subtitle="Last 28 days"
          growth={data.metrics.growth.reach}
          icon={<Eye className="h-6 w-6" />}
          color="blue"
        />
        <KPICard
          title="Engagement Rate"
          value={`${data.metrics.engagementRate}%`}
          subtitle="Average"
          growth={data.metrics.growth.engagement}
          icon={<Heart className="h-6 w-6" />}
          color="red"
        />
        <KPICard
          title="Posts Published"
          value={data.metrics.postsThisMonth.toString()}
          subtitle="This month"
          icon={<FileText className="h-6 w-6" />}
          color="green"
        />
        <KPICard
          title="Followers"
          value={formatNumber(data.metrics.followers)}
          subtitle="Total across platforms"
          growth={data.metrics.growth.followers}
          icon={<Users className="h-6 w-6" />}
          color="purple"
        />
      </div>

      {/* Upcoming Posts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Next 7 Days Schedule
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.upcomingPosts.slice(0, 5).map((post) => (
              <div
                key={post.id}
                className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex-shrink-0 w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                  {post.thumbnail ? (
                    <img
                      src={post.thumbnail}
                      alt=""
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <ImageIcon className="h-6 w-6 text-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="capitalize text-xs">
                      {post.platform}
                    </Badge>
                    <span className="text-sm text-gray-500">
                      {post.scheduledFor &&
                        new Date(post.scheduledFor).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 line-clamp-2">
                    {post.content}
                  </p>
                </div>
                <Badge
                  variant={post.status === "approved" ? "default" : "secondary"}
                >
                  {post.status.replace("_", " ")}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-500" />
            AI Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">
              {data.aiInsight.title}
            </h4>
            <p className="text-blue-800">{data.aiInsight.description}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AnalyticsSection({ data }: { data: ClientDashboardData }) {
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Use new Client Analytics Dashboard */}
      <ClientAnalyticsDashboard
        brandName={data.brandInfo.name}
        agencyName={data.agencyInfo.name}
      />

      {/* Share Actions */}
      <Card className="border-2 border-indigo-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 mb-1">
                Share Your Performance
              </h3>
              <p className="text-sm text-slate-600">
                Create a shareable link or download your analytics report
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setShareDialogOpen(true)}
                className="gap-2"
              >
                <Share2 className="h-4 w-4" />
                Create Share Link
              </Button>
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Export PDF
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Share Dialog */}
      {shareDialogOpen && (
        <ShareLinkDialog
          onClose={() => setShareDialogOpen(false)}
          brandId={data.brandInfo.name}
        />
      )}
    </div>
  );
}

function ApprovalsSection({
  data,
  onUpdate,
  onWorkflowAction,
  isViewOnly,
}: {
  data: ClientDashboardData;
  onUpdate: () => void;
  onWorkflowAction: (action: WorkflowAction) => void;
  isViewOnly: boolean;
}) {
  const [selectedApprovals, setSelectedApprovals] = useState<string[]>([]);
  const [previewItem, setPreviewItem] = useState<ContentItem | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Filter content based on status
  const filteredContent = React.useMemo(() => {
    if (filterStatus === "all") {
      return data.pendingApprovals;
    }
    return data.pendingApprovals.filter((item) => {
      if (filterStatus === "pending") {
        return item.status === "in_review" || item.status === "draft";
      }
      if (filterStatus === "approved") {
        return item.status === "approved" || item.status === "scheduled";
      }
      if (filterStatus === "needs_changes") {
        return item.requestedChanges || item.status === "draft";
      }
      return true;
    });
  }, [data.pendingApprovals, filterStatus]);

  const handleApproval = async (action: ApprovalAction) => {
    try {
      setLoading(true);
      let endpoint = `/api/client-portal/content/${action.contentId}/approve`;
      const method = "POST";
      let body: { approved?: boolean; feedback?: string; rejected?: boolean };

      if (action.action === "approve") {
        body = {
          approved: true,
          feedback: action.comment,
        };
      } else if (action.action === "request_changes") {
        endpoint = `/api/client-portal/content/${action.contentId}/reject`;
        body = {
          feedback: action.comment || "Changes requested",
        };
      } else {
        // reject
        endpoint = `/api/client-portal/content/${action.contentId}/reject`;
        body = {
          feedback: action.comment || "Content rejected",
        };
      }

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        toast({
          title: action.action === "approve" ? "Content approved" : "Feedback sent",
          description:
            action.action === "approve"
              ? "Content has been approved and will be scheduled."
              : "Your feedback has been sent to the agency.",
        });
        await onUpdate();
        setSelectedApprovals([]);
        setPreviewItem(null);
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.message || "Failed to process approval",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to process approval:", error);
      toast({
        title: "Error",
        description: "Failed to process approval. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBatchApproval = async () => {
    if (selectedApprovals.length === 0) return;

    try {
      setLoading(true);
      const promises = selectedApprovals.map((contentId) =>
        fetch(`/api/client-portal/content/${contentId}/approve`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ approved: true, feedback: "Batch approved" }),
        }),
      );

      const results = await Promise.all(promises);
      const allSucceeded = results.every((r) => r.ok);

      if (allSucceeded) {
        toast({
          title: "Batch approval successful",
          description: `${selectedApprovals.length} items approved.`,
        });
        await onUpdate();
        setSelectedApprovals([]);
      } else {
        toast({
          title: "Some approvals failed",
          description: "Please try again or approve items individually.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to batch approve:", error);
      toast({
        title: "Error",
        description: "Failed to batch approve. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate eligible items for batch approval (BFS ≥ 0.9, no compliance flags)
  const eligibleForBatch = filteredContent.filter(
    (item) =>
      (item.bfsScore || 0) >= 0.9 &&
      item.complianceBadges.length === 0 &&
      (item.status === "in_review" || item.status === "draft"),
  );

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Content Review Queue</h2>
          <p className="text-sm text-gray-600 mt-1">
            {filteredContent.length} item{filteredContent.length !== 1 ? "s" : ""} to review
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Items</SelectItem>
              <SelectItem value="pending">Pending Review</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="needs_changes">Needs Changes</SelectItem>
            </SelectContent>
          </Select>
          {!isViewOnly && selectedApprovals.length > 0 && (
            <Button
              onClick={handleBatchApproval}
              disabled={loading}
              className="gap-2 bg-[var(--color-lime-400)] text-black hover:bg-[var(--color-lime-600)]"
            >
              <CheckCircle className="h-4 w-4" />
              Batch Approve ({selectedApprovals.length})
            </Button>
          )}
        </div>
      </div>

      {/* Quick Approve Section */}
      {!isViewOnly && eligibleForBatch.length > 0 && filterStatus === "all" && (
        <Card className="border-green-200 bg-green-50/50">
          <CardHeader>
            <CardTitle className="text-green-800 flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Ready for Quick Approval
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-green-700 text-sm mb-4">
              {eligibleForBatch.length} post{eligibleForBatch.length !== 1 ? "s" : ""} have high Brand Fit Scores
              (≥90%) and pass all compliance checks. You can approve them all at once.
            </p>
            <Button
              onClick={() => {
                const eligibleIds = eligibleForBatch.map((item) => item.id);
                setSelectedApprovals(eligibleIds);
                handleBatchApproval();
              }}
              disabled={loading}
              className="gap-2 bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4" />
              Approve All ({eligibleForBatch.length})
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Content Items Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content List */}
        <div className="lg:col-span-2 space-y-4">
          {filteredContent.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-600">
                  {filterStatus === "all"
                    ? "No content items to review."
                    : `No ${filterStatus.replace("_", " ")} items.`}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredContent.map((item) => (
              <ContentReviewCard
                isViewOnly={isViewOnly}
                key={item.id}
                content={item}
                selected={selectedApprovals.includes(item.id)}
                onSelect={(selected) => {
                  if (selected) {
                    setSelectedApprovals([...selectedApprovals, item.id]);
                  } else {
                    setSelectedApprovals(
                      selectedApprovals.filter((id) => id !== item.id),
                    );
                  }
                }}
                onPreview={() => setPreviewItem(item)}
                onApproval={handleApproval}
                loading={loading}
              />
            ))
          )}
        </div>

        {/* Preview Panel */}
        <div className="lg:col-span-1">
          {previewItem ? (
            <ContentPreviewPanel
              content={previewItem}
              onClose={() => setPreviewItem(null)}
              onApproval={handleApproval}
              loading={loading}
              isViewOnly={isViewOnly}
            />
          ) : (
            <Card className="h-full flex items-center justify-center text-gray-500 sticky top-6">
              <div className="text-center p-8">
                <Eye className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-sm">Select an item to preview</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// TODO: tighten type - define proper interface for upload response
interface ClientMediaUpload {
  id: string;
  filename: string;
  path: string;
  uploadedAt: string;
  thumbnail?: string;
  status?: string;
  size?: string | number;
}

function UploadsSection() {
  const [uploads, setUploads] = useState<ClientMediaUpload[]>([]);
  const [_uploading, setUploading] = useState(false);

  const handleFileUpload = async (files: FileList) => {
    setUploading(true);

    try {
      const formData = new FormData();
      Array.from(files).forEach((file) => formData.append("files", file));

      const response = await fetch("/api/client-portal/media/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const result = await response.json() as { success: boolean; uploads?: ClientMediaUpload[]; media?: ClientMediaUpload };
        // Backend returns either { uploads: [...] } or { media: {...} }
        if (result.uploads && Array.isArray(result.uploads)) {
          setUploads((prev) => [...prev, ...result.uploads]);
        } else if (result.media) {
          setUploads((prev) => [...prev, result.media]);
        }
      }
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Upload Client Assets</h2>
        <Badge variant="outline">Supported: PNG, JPG, MP4, PDF</Badge>
      </div>

      {/* Upload Zone */}
      <Card>
        <CardContent className="pt-6">
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-primary transition-colors"
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files) {
                handleFileUpload(e.dataTransfer.files);
              }
            }}
            onDragOver={(e) => e.preventDefault()}
          >
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Drag and drop files here
            </h3>
            <p className="text-gray-600 mb-4">or click to browse</p>
            <input
              type="file"
              multiple
              accept="image/*,video/*,.pdf"
              onChange={(e) =>
                e.target.files && handleFileUpload(e.target.files)
              }
              className="hidden"
              id="file-upload"
            />
            <Button asChild>
              <label htmlFor="file-upload">Choose Files</label>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Upload Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Upload Guidelines</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">Image Guidelines</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• Min: 1080x1080px</li>
                <li>• Max: 10MB</li>
                <li>• High resolution preferred</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Video Guidelines</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• Max: 100MB</li>
                <li>• 1080p or higher</li>
                <li>• MP4 format</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Tagging</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• Add campaign tags</li>
                <li>• Include usage notes</li>
                <li>• Specify platform intent</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Uploaded Files */}
      {uploads.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Uploaded Assets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {uploads.map((upload, index) => (
                <UploadedAssetCard key={index} upload={upload} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ...existing code... (other section components)

function KPICard({
  title,
  value,
  subtitle,
  growth,
  icon,
  color,
}: {
  title: string;
  value: string;
  subtitle: string;
  growth?: number;
  icon: React.ReactNode;
  color: "blue" | "red" | "green" | "purple";
}) {
  const colorClasses = {
    blue: "text-blue-600 bg-blue-100",
    red: "text-red-600 bg-red-100",
    green: "text-green-600 bg-green-100",
    purple: "text-purple-600 bg-purple-100",
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={cn("p-3 rounded-full", colorClasses[color])}>
            {icon}
          </div>
          {growth !== undefined && (
            <div className="flex items-center gap-1">
              <TrendingUp
                className={cn(
                  "h-4 w-4",
                  growth > 0 ? "text-green-500" : "text-red-500",
                )}
              />
              <span
                className={cn(
                  "text-sm font-medium",
                  growth > 0 ? "text-green-600" : "text-red-600",
                )}
              >
                {growth > 0 ? "+" : ""}
                {growth}%
              </span>
            </div>
          )}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
          <p className="text-sm text-gray-500">{subtitle}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// Calculate SLA days remaining/overdue
function calculateSLA(createdAt: string, slaDays: number = 3): { days: number; status: "on_time" | "due_soon" | "overdue" } {
  const created = new Date(createdAt);
  const now = new Date();
  const daysSince = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
  const daysRemaining = slaDays - daysSince;

  if (daysRemaining < 0) {
    return { days: Math.abs(daysRemaining), status: "overdue" };
  } else if (daysRemaining <= 1) {
    return { days: daysRemaining, status: "due_soon" };
  }
  return { days: daysRemaining, status: "on_time" };
}

function ContentReviewCard({
  content,
  selected,
  onSelect,
  onPreview,
  onApproval,
  loading,
  isViewOnly,
}: {
  content: ContentItem;
  selected: boolean;
  onSelect: (selected: boolean) => void;
  onPreview: () => void;
  onApproval: (action: ApprovalAction) => void;
  loading?: boolean;
  isViewOnly: boolean;
}) {
  // Determine if item can be batch approved (BFS ≥ 0.9, no compliance flags)
  const canBatchApprove = (content.bfsScore || 0) >= 0.9 && content.complianceBadges.length === 0;
  
  // Calculate SLA (assuming 3-day SLA for client review)
  // Fallback to current date if createdAt not available
  const sla = content.createdAt ? calculateSLA(content.createdAt, 3) : null;

  return (
    <Card
      className={cn(
        "transition-all hover:shadow-md cursor-pointer",
        selected && "ring-2 ring-[var(--color-primary)]",
        content.status === "approved" && "opacity-75",
      )}
      onClick={onPreview}
    >
      <CardContent className="p-6">
        <div className="flex gap-4">
          <input
            type="checkbox"
            checked={selected}
            onChange={(e) => {
              e.stopPropagation();
              onSelect(e.target.checked);
            }}
            disabled={!canBatchApprove || content.status === "approved"}
            className="mt-1"
          />

          {/* Visual Preview */}
          <div className="flex-shrink-0 w-24 h-24 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
            {content.thumbnail ? (
              <img
                src={content.thumbnail}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50">
                {content.platform === "instagram" || content.platform === "facebook" ? (
                  <ImageIcon className="h-8 w-8 text-gray-400" />
                ) : (
                  <Play className="h-8 w-8 text-gray-400" />
                )}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            {/* Platform + Post Type + Status */}
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Badge variant="outline" className="capitalize text-xs font-semibold">
                {content.platform}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {content.status === "in_review" ? "Review" : content.status === "draft" ? "Draft" : content.status}
              </Badge>
              
              {/* BFS Score */}
              {content.bfsScore !== undefined && (
                <Badge
                  variant={content.bfsScore >= 0.9 ? "default" : content.bfsScore >= 0.8 ? "secondary" : "outline"}
                  className={cn(
                    "text-xs font-semibold",
                    content.bfsScore >= 0.9 && "bg-green-100 text-green-800 border-green-300",
                    content.bfsScore >= 0.8 && content.bfsScore < 0.9 && "bg-yellow-100 text-yellow-800 border-yellow-300",
                  )}
                >
                  BFS: {(content.bfsScore * 100).toFixed(0)}%
                </Badge>
              )}

              {/* Compliance Flags (read-only for client) */}
              {content.complianceBadges.length > 0 && (
                <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-300">
                  <Shield className="h-3 w-3 mr-1" />
                  {content.complianceBadges.length} flag{content.complianceBadges.length !== 1 ? "s" : ""}
                </Badge>
              )}

              {/* Scheduled Date/Time */}
              {content.scheduledFor && (
                <div className="flex items-center gap-1 text-xs text-gray-600">
                  <Clock className="h-3 w-3" />
                  {new Date(content.scheduledFor).toLocaleDateString()} {new Date(content.scheduledFor).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              )}

              {/* SLA Status */}
              {sla && (content.status === "in_review" || content.status === "draft") && (
                <Badge
                  variant={sla.status === "overdue" ? "destructive" : sla.status === "due_soon" ? "secondary" : "outline"}
                  className="text-xs"
                >
                  {sla.status === "overdue" 
                    ? `Overdue by ${sla.days} day${sla.days !== 1 ? "s" : ""}`
                    : sla.status === "due_soon"
                    ? `Due in ${sla.days} day${sla.days !== 1 ? "s" : ""}`
                    : `Due in ${sla.days} days`}
                </Badge>
              )}
            </div>

            {/* Content Text */}
            <p className="text-gray-700 text-sm mb-3 line-clamp-3 leading-relaxed">
              {content.content}
            </p>

            {/* Action Buttons */}
            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              <Button 
                size="sm" 
                onClick={onPreview} 
                variant="outline"
                className="text-xs"
              >
                <Eye className="h-3 w-3 mr-1" />
                Preview
              </Button>
              {!isViewOnly && content.status !== "approved" && (
                <>
                  <Button
                    size="sm"
                    onClick={() =>
                      onApproval({ contentId: content.id, action: "approve" })
                    }
                    disabled={loading}
                    className="bg-green-600 hover:bg-green-700 text-white gap-1 text-xs"
                  >
                    <ThumbsUp className="h-3 w-3" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      onApproval({
                        contentId: content.id,
                        action: "request_changes",
                      })
                    }
                    disabled={loading}
                    className="gap-1 text-xs"
                  >
                    <Edit3 className="h-3 w-3" />
                    Request Changes
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Workflow Progress */}
        {content.workflowInstance && (
          <div className="mt-4 pt-4 border-t">
            <WorkflowTracker
              workflow={content.workflowInstance}
              canTakeAction={false}
              onAction={() => {}}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ContentPreviewPanel({
  content,
  onClose,
  onApproval,
  loading,
  isViewOnly,
}: {
  content: ContentItem;
  onClose: () => void;
  onApproval: (action: ApprovalAction) => void;
  loading?: boolean;
  isViewOnly: boolean;
}) {
  const [comment, setComment] = useState("");
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [showRejectBox, setShowRejectBox] = useState(false);
  
  // Calculate SLA
  const sla = content.createdAt ? calculateSLA(content.createdAt, 3) : null;

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg">Content Preview</CardTitle>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Media Preview */}
        <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
          {content.thumbnail ? (
            <img
              src={content.thumbnail}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="h-12 w-12 text-gray-400" />
            </div>
          )}
        </div>

        {/* Platform + Post Type + Status */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <Badge variant="outline" className="capitalize font-semibold">
            {content.platform}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {content.status === "in_review" ? "Review" : content.status === "draft" ? "Draft" : content.status}
          </Badge>
          
          {/* BFS Score */}
          {content.bfsScore !== undefined && (
            <Badge
              variant={content.bfsScore >= 0.9 ? "default" : content.bfsScore >= 0.8 ? "secondary" : "outline"}
              className={cn(
                "text-xs font-semibold",
                content.bfsScore >= 0.9 && "bg-green-100 text-green-800 border-green-300",
                content.bfsScore >= 0.8 && content.bfsScore < 0.9 && "bg-yellow-100 text-yellow-800 border-yellow-300",
              )}
            >
              BFS: {(content.bfsScore * 100).toFixed(0)}%
            </Badge>
          )}

          {/* Scheduled Date/Time */}
          {content.scheduledFor && (
            <div className="flex items-center gap-1 text-xs text-gray-600">
              <Clock className="h-3 w-3" />
              {new Date(content.scheduledFor).toLocaleDateString()} {new Date(content.scheduledFor).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          )}

          {/* SLA Status */}
          {sla && (content.status === "in_review" || content.status === "draft") && (
            <Badge
              variant={sla.status === "overdue" ? "destructive" : sla.status === "due_soon" ? "secondary" : "outline"}
              className="text-xs"
            >
              {sla.status === "overdue" 
                ? `Overdue by ${sla.days} day${sla.days !== 1 ? "s" : ""}`
                : sla.status === "due_soon"
                ? `Due in ${sla.days} day${sla.days !== 1 ? "s" : ""}`
                : `Due in ${sla.days} days`}
            </Badge>
          )}
        </div>

        {/* Content Text */}
        <div>
          <Label className="text-sm font-medium mb-2 block">Content</Label>
          <p className="text-sm text-gray-700 mt-1 p-3 bg-gray-50 rounded-lg leading-relaxed">
            {content.content}
          </p>
        </div>

        {/* BFS & Compliance (Read-only for client) */}
        <div className="space-y-3">
          {content.bfsScore !== undefined && (
            <div>
              <Label className="text-sm font-medium mb-2 block">Brand Fidelity Score</Label>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full transition-all",
                      content.bfsScore >= 0.9 && "bg-green-500",
                      content.bfsScore >= 0.8 && content.bfsScore < 0.9 && "bg-yellow-500",
                      content.bfsScore < 0.8 && "bg-red-500",
                    )}
                    style={{ width: `${content.bfsScore * 100}%` }}
                  />
                </div>
                <span className="text-xs font-semibold text-gray-700">
                  {(content.bfsScore * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          )}

          {/* Compliance Flags */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Compliance Status</Label>
            {content.complianceBadges.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-green-700">
                <CheckCircle className="h-4 w-4" />
                <span>All compliance checks passed</span>
              </div>
            ) : (
              <div className="space-y-2">
                {content.complianceBadges.map((badge, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm text-red-700">
                    <AlertTriangle className="h-4 w-4" />
                    <span>{badge}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        {!isViewOnly && content.status !== "approved" && (
          <div className="space-y-3 pt-4 border-t">
            <Button
              onClick={() =>
                onApproval({ contentId: content.id, action: "approve" })
              }
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white gap-2"
            >
              <ThumbsUp className="h-4 w-4" />
              Approve & Schedule
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                setShowCommentBox(!showCommentBox);
                setShowRejectBox(false);
              }}
              disabled={loading}
              className="w-full gap-2"
            >
              <Edit3 className="h-4 w-4" />
              Request Changes
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                setShowRejectBox(!showRejectBox);
                setShowCommentBox(false);
              }}
              disabled={loading}
              className="w-full gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <XCircle className="h-4 w-4" />
              Reject
            </Button>

            {/* Request Changes Comment Box */}
            {showCommentBox && (
              <div className="space-y-3 p-3 bg-gray-50 rounded-lg border">
                <Label className="text-sm font-medium">What changes would you like to see?</Label>
                <Textarea
                  placeholder="Describe the changes needed..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="min-h-20"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      onApproval({
                        contentId: content.id,
                        action: "request_changes",
                        comment,
                      });
                      setComment("");
                      setShowCommentBox(false);
                    }}
                    disabled={!comment.trim() || loading}
                    size="sm"
                    className="gap-2"
                  >
                    <Send className="h-3 w-3" />
                    Send Feedback
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowCommentBox(false);
                      setComment("");
                    }}
                    size="sm"
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Reject Comment Box */}
            {showRejectBox && (
              <div className="space-y-3 p-3 bg-red-50 rounded-lg border border-red-200">
                <Label className="text-sm font-medium text-red-800">Why are you rejecting this content?</Label>
                <Textarea
                  placeholder="Please provide a reason for rejection..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="min-h-20"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      onApproval({
                        contentId: content.id,
                        action: "request_changes", // Using request_changes for reject with comment
                        comment: comment || "Content rejected",
                      });
                      setComment("");
                      setShowRejectBox(false);
                    }}
                    disabled={!comment.trim() || loading}
                    size="sm"
                    variant="destructive"
                    className="gap-2"
                  >
                    <XCircle className="h-3 w-3" />
                    Reject Content
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowRejectBox(false);
                      setComment("");
                    }}
                    size="sm"
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Version History */}
        <div>
          <Label className="text-sm font-medium mb-2 block">
            Version History
          </Label>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <History className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">v2 - Current version</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function BrandGuideSection({ brandId }: { brandId: string }) {
  const navigate = useNavigate();
  const { currentBrand } = useBrand();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Brand Guide</CardTitle>
          <p className="text-sm text-slate-600 mt-2">
            View and update your brand guidelines, voice, and visual identity.
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-slate-700">
              Your brand guide helps ensure all content aligns with your brand identity.
            </p>
            <div className="flex gap-3">
              <Button
                onClick={() => navigate(`/brand-guide?brandId=${currentBrand?.id || brandId}`)}
                className="gap-2"
              >
                <FileText className="h-4 w-4" />
                View Brand Guide
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate(`/brand-intake?brandId=${currentBrand?.id || brandId}`)}
                className="gap-2"
              >
                <Edit3 className="h-4 w-4" />
                Update Brand Intake
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ShareLinkDialog({
  onClose,
  brandId,
}: {
  onClose: () => void;
  brandId: string;
}) {
  const [shareUrl, setShareUrl] = useState("");
  const [settings, setSettings] = useState({
    expiry: "30",
    passcode: false,
    allowDownload: true,
    watermark: true,
  });

  const generateShareLink = async () => {
    try {
      const response = await fetch("/api/client-portal/share-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `Analytics Report - ${new Date().toLocaleDateString()}`,
          description: "Shareable analytics report",
          scope: ["overview", "channels", "top-content"],
          expiryDays: parseInt(settings.expiry),
          requirePasscode: settings.passcode,
          passcode: settings.passcode ? prompt("Enter passcode:") : undefined,
          allowDownload: settings.allowDownload,
          showWatermark: settings.watermark,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        const fullUrl = `${window.location.origin}${result.shareUrl}`;
        setShareUrl(fullUrl);
      } else {
        const error = await response.json();
        console.error("Failed to generate share link:", error);
        alert(`Failed to create share link: ${error.message || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Failed to generate share link:", error);
      alert("Failed to create share link. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Create Share Link
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Expiry</Label>
            <Select
              value={settings.expiry}
              onValueChange={(value) =>
                setSettings((prev) => ({ ...prev, expiry: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 days</SelectItem>
                <SelectItem value="30">30 days</SelectItem>
                <SelectItem value="90">90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label>Require passcode</Label>
            <Switch
              checked={settings.passcode}
              onCheckedChange={(checked) =>
                setSettings((prev) => ({ ...prev, passcode: checked }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label>Allow downloads</Label>
            <Switch
              checked={settings.allowDownload}
              onCheckedChange={(checked) =>
                setSettings((prev) => ({ ...prev, allowDownload: checked }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label>Show watermark</Label>
            <Switch
              checked={settings.watermark}
              onCheckedChange={(checked) =>
                setSettings((prev) => ({ ...prev, watermark: checked }))
              }
            />
          </div>

          {shareUrl ? (
            <div className="space-y-3">
              <Label>Share URL</Label>
              <div className="flex gap-2">
                <Input
                  value={shareUrl}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  size="sm"
                  onClick={() => navigator.clipboard.writeText(shareUrl)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Shield className="h-4 w-4" />
                <span>This link will expire in {settings.expiry} days</span>
              </div>
            </div>
          ) : (
            <Button onClick={generateShareLink} className="w-full">
              Generate Share Link
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function UploadedAssetCard({ upload }: { upload: ClientMediaUpload }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="aspect-square bg-gray-100 rounded-lg mb-3 overflow-hidden">
          {upload.thumbnail ? (
            <img
              src={upload.thumbnail}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <FileText className="h-8 w-8 text-gray-400" />
            </div>
          )}
        </div>
        <div>
          <p className="font-medium text-sm mb-1">{upload.filename}</p>
          <Badge variant="secondary" className="text-xs mb-2">
            {upload.status || "In Review"}
          </Badge>
          <p className="text-xs text-gray-600">{upload.size}</p>
        </div>
      </CardContent>
    </Card>
  );
}

// ...existing code... (placeholder functions for other sections)

function ReviewsSection() {
  return (
    <div className="text-center py-8 text-gray-500">
      Reviews section coming soon
    </div>
  );
}

function EventsSection() {
  return (
    <div className="text-center py-8 text-gray-500">
      Events section coming soon
    </div>
  );
}

function MessagesSection({ data }: { data: ClientDashboardData }) {
  return (
    <div className="text-center py-8 text-gray-500">
      Messages section coming soon
    </div>
  );
}

function HistorySection({ data }: { data: ClientDashboardData }) {
  // Combine all content items (approved, scheduled, published) for history
  const historyItems = [
    ...data.recentContent.filter((item) => 
      item.status === "approved" || item.status === "scheduled" || item.status === "published"
    ),
    ...data.upcomingPosts,
  ].sort((a, b) => {
    const dateA = a.approvedAt || a.scheduledFor || a.publishedAt || "";
    const dateB = b.approvedAt || b.scheduledFor || b.publishedAt || "";
    return new Date(dateB).getTime() - new Date(dateA).getTime();
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Approval History</h2>
        <p className="text-sm text-gray-600">
          View all content you've approved, rejected, or requested changes for.
        </p>
      </div>

      {historyItems.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <History className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-600">No approval history yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {historyItems.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-6">
                <div className="flex gap-4">
                  {/* Thumbnail */}
                  <div className="flex-shrink-0 w-20 h-20 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                    {item.thumbnail ? (
                      <img
                        src={item.thumbnail}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50">
                        <ImageIcon className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Content Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <Badge variant="outline" className="capitalize text-xs">
                        {item.platform}
                      </Badge>
                      <Badge
                        variant={
                          item.status === "approved" || item.status === "scheduled" || item.status === "published"
                            ? "default"
                            : "secondary"
                        }
                        className="text-xs"
                      >
                        {item.status === "approved" && "✅ Approved"}
                        {item.status === "scheduled" && "📅 Scheduled"}
                        {item.status === "published" && "🚀 Published"}
                        {item.requestedChanges && "✏️ Changes Requested"}
                      </Badge>
                      {item.approvedAt && (
                        <span className="text-xs text-gray-500">
                          Approved {new Date(item.approvedAt).toLocaleDateString()}
                        </span>
                      )}
                      {item.scheduledFor && (
                        <span className="text-xs text-gray-500">
                          Scheduled {new Date(item.scheduledFor).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-gray-700 mb-2 line-clamp-2">
                      {item.content}
                    </p>

                    {item.requestedChanges && (
                      <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                        <strong>Your feedback:</strong> {item.requestedChanges}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

