import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { cn } from "@/lib/design-system";
import {
  ClientDashboardData,
  ContentItem,
  ApprovalAction,
} from "@shared/client-portal";
import { WorkflowTracker } from "@/components/workflow/WorkflowTracker";
import { WorkflowAction } from "@shared/workflow";

export default function ClientPortal() {
  const [dashboardData, setDashboardData] =
    useState<ClientDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("overview");

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
        const data = await response.json();
        setDashboardData(data as unknown);
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
                <ActionChip
                  icon={<CheckCircle className="h-4 w-4" />}
                  label={`Approve items (${dashboardData.metrics.pendingApprovals})`}
                  onClick={() => setActiveSection("approvals")}
                  variant="primary"
                />
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
                label: "At-a-Glance",
                icon: <Home className="h-4 w-4" />,
              },
              {
                id: "analytics",
                label: "Analytics",
                icon: <BarChart3 className="h-4 w-4" />,
              },
              {
                id: "approvals",
                label: "Content Review",
                icon: <CheckCircle className="h-4 w-4" />,
                badge: dashboardData.metrics.pendingApprovals,
              },
              {
                id: "uploads",
                label: "Upload Assets",
                icon: <Upload className="h-4 w-4" />,
              },
              {
                id: "reviews",
                label: "Reviews",
                icon: <Star className="h-4 w-4" />,
              },
              {
                id: "events",
                label: "Events",
                icon: <Calendar className="h-4 w-4" />,
              },
              {
                id: "messages",
                label: "Updates",
                icon: <MessageSquare className="h-4 w-4" />,
              },
              {
                id: "questions",
                label: "Questions",
                icon: <HelpCircle className="h-4 w-4" />,
              },
              {
                id: "feedback-history",
                label: "Feedback Impact",
                icon: <TrendingUp className="h-4 w-4" />,
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
        {activeSection === "analytics" && (
          <AnalyticsSection data={dashboardData} />
        )}
        {activeSection === "approvals" && (
          <ApprovalsSection
            data={dashboardData}
            onUpdate={loadDashboardData}
            onWorkflowAction={handleWorkflowAction}
          />
        )}
        {activeSection === "uploads" && <UploadsSection />}
        {activeSection === "reviews" && <ReviewsSection />}
        {activeSection === "events" && <EventsSection />}
        {activeSection === "messages" && (
          <MessagesSection data={dashboardData} />
        )}
        {activeSection === "questions" && (
          <ClientQAChat
            clientId={dashboardData.brandInfo.name}
            agencyName={dashboardData.agencyInfo.name}
          />
        )}
        {activeSection === "feedback-history" && (
          <FeedbackImpactTimeline clientId={dashboardData.brandInfo.name} />
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
            <p className="text-xs text-gray-500">Powered by Aligned AI</p>
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
}: {
  data: ClientDashboardData;
  onUpdate: () => void;
  onWorkflowAction: (action: WorkflowAction) => void;
}) {
  const [selectedApprovals, setSelectedApprovals] = useState<string[]>([]);
  const [previewItem, setPreviewItem] = useState<ContentItem | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const handleApproval = async (action: ApprovalAction) => {
    try {
      const response = await fetch(
        `/api/client-portal/content/${action.contentId}/approve`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            approved: action.action === "approve",
            comment: action.comment,
          }),
        },
      );

      if (response.ok) {
        await onUpdate();
        setSelectedApprovals([]);
        setPreviewItem(null);
      }
    } catch (error) {
      console.error("Failed to process approval:", error);
    }
  };

  const eligibleForBatch = data.pendingApprovals.filter(
    (item) => (item.bfsScore || 0) >= 0.8 && item.complianceBadges.length === 0,
  );

  return (
    <div className="space-y-6">
      {/* Content Queue */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Content Review Queue</h2>
        <div className="flex items-center gap-3">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All items</SelectItem>
              <SelectItem value="in_review">In Review</SelectItem>
              <SelectItem value="high_bfs">High BFS (≥80%)</SelectItem>
            </SelectContent>
          </Select>
          {selectedApprovals.length > 0 && (
            <Button className="gap-2">
              <CheckCircle className="h-4 w-4" />
              Batch Approve ({selectedApprovals.length})
            </Button>
          )}
        </div>
      </div>

      {/* Quick Approve Section */}
      {eligibleForBatch.length > 0 && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800 flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Ready for Quick Approval
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-green-700 text-sm mb-4">
              These {eligibleForBatch.length} posts have high Brand Fit Scores
              (≥80%) and pass all compliance checks.
            </p>
            <Button className="gap-2">
              <CheckCircle className="h-4 w-4" />
              Approve All ({eligibleForBatch.length})
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Content Items */}
      <div className="space-y-4">
        {data.pendingApprovals.map((item) => (
          <Card key={item.id}>
            <CardContent className="p-6">
              <ContentReviewCard
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
              />

              {/* Workflow Progress */}
              {item.workflowInstance && (
                <div className="mt-4 pt-4 border-t">
                  <WorkflowTracker
                    workflow={item.workflowInstance}
                    canTakeAction={true}
                    onAction={onWorkflowAction}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Preview Panel */}
      <div className="lg:col-span-1">
        {previewItem ? (
          <ContentPreviewPanel
            content={previewItem}
            onClose={() => setPreviewItem(null)}
            onApproval={handleApproval}
          />
        ) : (
          <Card className="h-full flex items-center justify-center text-gray-500">
            <div className="text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Select an item to preview</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

function UploadsSection() {
  const [uploads, setUploads] = useState<unknown[]>([]);
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
        const result = await response.json();
        setUploads((prev) => [...prev, ...result.uploads]);
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

function ContentReviewCard({
  content,
  selected,
  onSelect,
  onPreview,
  onApproval,
}: {
  content: ContentItem;
  selected: boolean;
  onSelect: (selected: boolean) => void;
  onPreview: () => void;
  onApproval: (action: ApprovalAction) => void;
}) {
  return (
    <Card
      className={cn(
        "transition-all hover:shadow-md",
        selected && "ring-2 ring-primary",
      )}
    >
      <CardContent className="p-6">
        <div className="flex gap-4">
          <input
            type="checkbox"
            checked={selected}
            onChange={(e) => onSelect(e.target.checked)}
            className="mt-1"
          />

          <div className="flex-shrink-0 w-16 h-16 bg-gray-200 rounded-lg overflow-hidden">
            {content.thumbnail ? (
              <img
                src={content.thumbnail}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ImageIcon className="h-6 w-6 text-gray-400" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="capitalize text-xs">
                {content.platform}
              </Badge>
              {content.bfsScore && (
                <Badge
                  variant={content.bfsScore >= 0.8 ? "default" : "secondary"}
                  className="text-xs"
                >
                  BFS: {(content.bfsScore * 100).toFixed(0)}%
                </Badge>
              )}
              {content.complianceBadges.map((badge) => (
                <Badge key={badge} variant="outline" className="text-xs">
                  {badge}
                </Badge>
              ))}
              {content.scheduledFor && (
                <span className="text-xs text-gray-500">
                  {new Date(content.scheduledFor).toLocaleDateString()}
                </span>
              )}
            </div>

            <p className="text-gray-700 text-sm mb-3 line-clamp-2">
              {content.content}
            </p>

            <div className="flex items-center gap-2">
              <Button size="sm" onClick={onPreview} variant="outline">
                Preview
              </Button>
              <Button
                size="sm"
                onClick={() =>
                  onApproval({ contentId: content.id, action: "approve" })
                }
                className="bg-green-600 hover:bg-green-700 gap-1"
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
                className="gap-1"
              >
                <ThumbsDown className="h-3 w-3" />
                Request Edit
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ContentPreviewPanel({
  content,
  onClose,
  onApproval,
}: {
  content: ContentItem;
  onClose: () => void;
  onApproval: (action: ApprovalAction) => void;
}) {
  const [comment, setComment] = useState("");
  const [showCommentBox, setShowCommentBox] = useState(false);

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

        {/* Content Details */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Badge variant="outline" className="capitalize">
              {content.platform}
            </Badge>
            {content.bfsScore && (
              <Badge
                variant={content.bfsScore >= 0.8 ? "default" : "secondary"}
              >
                BFS: {(content.bfsScore * 100).toFixed(0)}%
              </Badge>
            )}
          </div>

          <div className="space-y-3">
            <div>
              <Label className="text-sm font-medium">Caption</Label>
              <p className="text-sm text-gray-700 mt-1 p-3 bg-gray-50 rounded-lg">
                {content.content}
              </p>
            </div>

            <div>
              <Label className="text-sm font-medium">Alt Text</Label>
              <p className="text-sm text-gray-600 mt-1">
                Auto-generated alt text for accessibility
              </p>
            </div>
          </div>
        </div>

        {/* Compliance Checks */}
        <div>
          <Label className="text-sm font-medium mb-2 block">
            Compliance Checks
          </Label>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm">Disclaimers present</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm">Hashtags included</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm">Brand guidelines followed</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-4 border-t">
          <Button
            onClick={() =>
              onApproval({ contentId: content.id, action: "approve" })
            }
            className="w-full bg-green-600 hover:bg-green-700 gap-2"
          >
            <ThumbsUp className="h-4 w-4" />
            Approve & Schedule
          </Button>

          <Button
            variant="outline"
            onClick={() => setShowCommentBox(!showCommentBox)}
            className="w-full gap-2"
          >
            <ThumbsDown className="h-4 w-4" />
            Request Changes
          </Button>

          {showCommentBox && (
            <div className="space-y-3">
              <Textarea
                placeholder="What changes would you like to see?"
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
                  disabled={!comment.trim()}
                  size="sm"
                  className="gap-2"
                >
                  <Send className="h-3 w-3" />
                  Send Feedback
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowCommentBox(false)}
                  size="sm"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>

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
          brandId,
          scope: ["overview", "channels", "top-content"],
          expiryDays: parseInt(settings.expiry),
          requirePasscode: settings.passcode,
          allowDownload: settings.allowDownload,
          showWatermark: settings.watermark,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setShareUrl(result.shareUrl);
      }
    } catch (error) {
      console.error("Failed to generate share link:", error);
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

function UploadedAssetCard({ upload }: { upload: unknown }) {
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

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}
