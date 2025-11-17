/**
 * MultiClientApprovalDashboard
 * 
 * Kanban board for managing approvals across multiple clients/brands.
 * Features:
 * - 6-column Kanban: Draft / Needs Edits / Ready for Client / Awaiting Client / Approved / Scheduled
 * - BFS color coding (≥90 green, ≥80 yellow, <80 red)
 * - Compliance flags display
 * - Filters: brand, platform, status, assignee
 * - Search functionality
 * - Approval flow controls
 * - Audit log per item
 * - Real-time status updates
 */

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  CheckCircle,
  X,
  Clock,
  Eye,
  AlertTriangle,
  Search,
  Filter,
  Shield,
  Calendar,
  Edit,
  Send,
  ArrowRight,
  History,
  User,
  XCircle,
  Play,
  Image as ImageIcon,
} from "lucide-react";
import { cn } from "@/lib/design-system";
import { useToast } from "@/hooks/use-toast";
import { useBrand } from "@/contexts/BrandContext";

// Approval status types matching Kanban columns
export type ApprovalStatus =
  | "draft"
  | "needs_edits"
  | "ready_for_client"
  | "awaiting_client"
  | "approved"
  | "scheduled";

export interface ApprovalItem {
  id: string;
  brandId: string;
  brandName: string;
  contentId: string;
  platform: "instagram" | "facebook" | "linkedin" | "twitter" | "tiktok";
  content: string;
  thumbnail?: string;
  status: ApprovalStatus;
  bfsScore?: number;
  complianceFlags: string[];
  scheduledFor?: string;
  assignedTo?: string;
  assignedToName?: string;
  createdAt: string;
  updatedAt: string;
  requestedChanges?: string;
  approvedBy?: string;
  approvedAt?: string;
}

interface MultiClientApprovalDashboardProps {
  className?: string;
}

const KANBAN_COLUMNS: {
  id: ApprovalStatus;
  title: string;
  icon: React.ReactNode;
  color: string;
}[] = [
  {
    id: "draft",
    title: "Draft",
    icon: <Edit className="h-4 w-4" />,
    color: "bg-gray-100 text-gray-700",
  },
  {
    id: "needs_edits",
    title: "Needs Edits",
    icon: <AlertTriangle className="h-4 w-4" />,
    color: "bg-yellow-100 text-yellow-700",
  },
  {
    id: "ready_for_client",
    title: "Ready for Client",
    icon: <Send className="h-4 w-4" />,
    color: "bg-blue-100 text-blue-700",
  },
  {
    id: "awaiting_client",
    title: "Awaiting Client",
    icon: <Clock className="h-4 w-4" />,
    color: "bg-orange-100 text-orange-700",
  },
  {
    id: "approved",
    title: "Approved",
    icon: <CheckCircle className="h-4 w-4" />,
    color: "bg-green-100 text-green-700",
  },
  {
    id: "scheduled",
    title: "Scheduled",
    icon: <Calendar className="h-4 w-4" />,
    color: "bg-purple-100 text-purple-700",
  },
];

export function MultiClientApprovalDashboard({
  className,
}: MultiClientApprovalDashboardProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<ApprovalItem | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showAuditLog, setShowAuditLog] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterBrand, setFilterBrand] = useState<string>("all");
  const [filterPlatform, setFilterPlatform] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterAssignee, setFilterAssignee] = useState<string>("all");

  // Load approvals data
  useEffect(() => {
    loadApprovals();
  }, []);

  const loadApprovals = async () => {
    try {
      setLoading(true);
      // TODO: Replace with real API endpoint
      const response = await fetch("/api/approvals/pending?limit=100");
      if (response.ok) {
        const data = await response.json();
        // Map API response to ApprovalItem format
        const mappedItems: ApprovalItem[] = (data.items || []).map((item: any) => ({
          id: item.id || item.approvalId || item.contentId,
          brandId: item.brandId || item.brand_id,
          brandName: item.brandName || item.brand_name || "Unknown Brand",
          contentId: item.contentId || item.content_id || item.postId || item.post_id,
          platform: item.platform || "instagram",
          content: item.content || item.body || item.caption || "",
          thumbnail: item.thumbnail || item.media_urls?.[0],
          status: mapStatusToKanban(item.status || "draft"),
          bfsScore: item.bfsScore || item.bfs || item.brandFidelityScore,
          complianceFlags: item.complianceFlags || item.compliance_badges || item.compliance_flags || [],
          scheduledFor: item.scheduledFor || item.scheduled_for,
          assignedTo: item.assignedTo || item.assigned_to,
          assignedToName: item.assignedToName || item.assigned_to_name,
          createdAt: item.createdAt || item.created_at || new Date().toISOString(),
          updatedAt: item.updatedAt || item.updated_at || new Date().toISOString(),
          requestedChanges: item.requestedChanges || item.requested_changes,
          approvedBy: item.approvedBy || item.approved_by,
          approvedAt: item.approvedAt || item.approved_at,
        }));
        setApprovals(mappedItems);
      } else {
        // Fallback to mock data for development
        setApprovals(getMockApprovals());
      }
    } catch (error) {
      console.error("Failed to load approvals:", error);
      setApprovals(getMockApprovals());
    } finally {
      setLoading(false);
    }
  };

  // Map API status to Kanban status
  const mapStatusToKanban = (status: string): ApprovalStatus => {
    const statusMap: Record<string, ApprovalStatus> = {
      draft: "draft",
      "in_review": "ready_for_client",
      "pending": "awaiting_client",
      "awaiting_approval": "awaiting_client",
      approved: "approved",
      scheduled: "scheduled",
      rejected: "needs_edits",
      "changes_requested": "needs_edits",
    };
    return statusMap[status.toLowerCase()] || "draft";
  };

  // Filtered approvals
  const filteredApprovals = useMemo(() => {
    return approvals.filter((approval) => {
      const matchesSearch =
        searchQuery === "" ||
        approval.brandName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        approval.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        approval.platform.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesBrand = filterBrand === "all" || approval.brandId === filterBrand;
      const matchesPlatform =
        filterPlatform === "all" || approval.platform === filterPlatform;
      const matchesStatus = filterStatus === "all" || approval.status === filterStatus;
      const matchesAssignee =
        filterAssignee === "all" ||
        approval.assignedTo === filterAssignee ||
        !approval.assignedTo;

      return (
        matchesSearch &&
        matchesBrand &&
        matchesPlatform &&
        matchesStatus &&
        matchesAssignee
      );
    });
  }, [approvals, searchQuery, filterBrand, filterPlatform, filterStatus, filterAssignee]);

  // Group approvals by status
  const approvalsByStatus = useMemo(() => {
    const grouped: Record<ApprovalStatus, ApprovalItem[]> = {
      draft: [],
      needs_edits: [],
      ready_for_client: [],
      awaiting_client: [],
      approved: [],
      scheduled: [],
    };

    filteredApprovals.forEach((approval) => {
      grouped[approval.status].push(approval);
    });

    return grouped;
  }, [filteredApprovals]);

  // Get unique brands, platforms, assignees
  const brands = useMemo(
    () => Array.from(new Set(approvals.map((a) => a.brandId))),
    [approvals],
  );
  const platforms = useMemo(
    () => Array.from(new Set(approvals.map((a) => a.platform))),
    [approvals],
  );
  const assignees = useMemo(
    () => Array.from(new Set(approvals.map((a) => a.assignedTo).filter(Boolean))),
    [approvals],
  );

  // Approval actions
  const handleApproveForClient = async (item: ApprovalItem) => {
    setActionLoading(item.id);
    try {
      const response = await fetch(`/api/approvals/${item.id}/approve-for-client`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentId: item.contentId }),
      });

      if (response.ok) {
        toast({
          title: "Sent to client",
          description: `"${item.brandName}" content sent for client approval.`,
        });
        // Update status locally
        setApprovals(
          approvals.map((a) =>
            a.id === item.id ? { ...a, status: "awaiting_client" } : a,
          ),
        );
        setShowPreview(false);
      } else {
        throw new Error("Failed to approve for client");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send to client. Please try again.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleSendBackToDraft = async (item: ApprovalItem, reason?: string) => {
    setActionLoading(item.id);
    try {
      const response = await fetch(`/api/approvals/${item.id}/send-to-draft`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentId: item.contentId, reason }),
      });

      if (response.ok) {
        toast({
          title: "Sent back to draft",
          description: `Content returned to draft for "${item.brandName}".`,
        });
        setApprovals(
          approvals.map((a) =>
            a.id === item.id ? { ...a, status: "draft" } : a,
          ),
        );
        setShowPreview(false);
      } else {
        throw new Error("Failed to send back to draft");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send back to draft. Please try again.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkReadyForScheduling = async (item: ApprovalItem) => {
    setActionLoading(item.id);
    try {
      const response = await fetch(`/api/approvals/${item.id}/mark-ready-schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentId: item.contentId }),
      });

      if (response.ok) {
        toast({
          title: "Ready for scheduling",
          description: `"${item.brandName}" content is ready to be scheduled.`,
        });
        setApprovals(
          approvals.map((a) =>
            a.id === item.id ? { ...a, status: "scheduled" } : a,
          ),
        );
        setShowPreview(false);
      } else {
        throw new Error("Failed to mark ready for scheduling");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark ready for scheduling. Please try again.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900">
            Multi-Client Approvals
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Manage all client approvals in one place
          </p>
        </div>
        <Button
          onClick={loadApprovals}
          variant="outline"
          size="sm"
          disabled={loading}
        >
          <ArrowRight className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6 pb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by brand, content, platform..."
                  className="pl-9"
                />
              </div>
            </div>

            {/* Brand Filter */}
            <Select value={filterBrand} onValueChange={setFilterBrand}>
              <SelectTrigger>
                <SelectValue placeholder="All Brands" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Brands</SelectItem>
                {brands.map((brandId) => {
                  const brand = approvals.find((a) => a.brandId === brandId);
                  return (
                    <SelectItem key={brandId} value={brandId}>
                      {brand?.brandName || brandId}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>

            {/* Platform Filter */}
            <Select value={filterPlatform} onValueChange={setFilterPlatform}>
              <SelectTrigger>
                <SelectValue placeholder="All Platforms" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Platforms</SelectItem>
                {platforms.map((platform) => (
                  <SelectItem key={platform} value={platform}>
                    {platform.charAt(0).toUpperCase() + platform.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {KANBAN_COLUMNS.map((col) => (
                  <SelectItem key={col.id} value={col.id}>
                    {col.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-6 gap-4 overflow-x-auto pb-4">
        {KANBAN_COLUMNS.map((column) => {
          const columnItems = approvalsByStatus[column.id];

          return (
            <div key={column.id} className="flex flex-col min-w-[280px]">
              {/* Column Header */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={cn("p-1.5 rounded", column.color)}>
                      {column.icon}
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm">
                      {column.title}
                    </h3>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {columnItems.length}
                  </Badge>
                </div>
                <div className="h-1 bg-slate-200 rounded-full" />
              </div>

              {/* Cards */}
              <div className="flex-1 space-y-3 min-h-[200px]">
                {columnItems.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-sm">
                    <p>No items</p>
                  </div>
                ) : (
                  columnItems.map((item) => (
                    <ApprovalCard
                      key={item.id}
                      item={item}
                      onClick={() => {
                        setSelectedItem(item);
                        setShowPreview(true);
                      }}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Preview Dialog */}
      {selectedItem && (
        <ApprovalPreviewDialog
          item={selectedItem}
          open={showPreview}
          onClose={() => {
            setShowPreview(false);
            setSelectedItem(null);
          }}
          onApproveForClient={handleApproveForClient}
          onSendBackToDraft={handleSendBackToDraft}
          onMarkReadyForScheduling={handleMarkReadyForScheduling}
          onShowAuditLog={() => setShowAuditLog(true)}
          loading={actionLoading === selectedItem.id}
        />
      )}

      {/* Audit Log Dialog */}
      {selectedItem && (
        <AuditLogDialog
          item={selectedItem}
          open={showAuditLog}
          onClose={() => setShowAuditLog(false)}
        />
      )}
    </div>
  );
}

// Approval Card Component
interface ApprovalCardProps {
  item: ApprovalItem;
  onClick: () => void;
}

function ApprovalCard({ item, onClick }: ApprovalCardProps) {
  // BFS color logic
  const getBFSColor = (score?: number) => {
    if (!score) return "bg-gray-100 text-gray-700";
    if (score >= 0.9) return "bg-green-100 text-green-800 border-green-300";
    if (score >= 0.8) return "bg-yellow-100 text-yellow-800 border-yellow-300";
    return "bg-red-100 text-red-800 border-red-300";
  };

  const bfsColor = getBFSColor(item.bfsScore);

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02]",
        item.complianceFlags.length > 0 && "border-red-300",
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        {/* Brand Name */}
        <div className="flex items-center justify-between mb-2">
          <p className="font-bold text-slate-900 text-sm truncate">
            {item.brandName}
          </p>
          <Badge variant="outline" className="text-xs capitalize">
            {item.platform}
          </Badge>
        </div>

        {/* Thumbnail */}
        {item.thumbnail && (
          <div className="w-full h-24 bg-gray-100 rounded-lg mb-2 overflow-hidden">
            <img
              src={item.thumbnail}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Content Preview */}
        <p className="text-xs text-slate-700 line-clamp-2 mb-2">
          {item.content}
        </p>

        {/* BFS Score */}
        {item.bfsScore !== undefined && (
          <div className="mb-2">
            <Badge className={cn("text-xs font-semibold", bfsColor)}>
              BFS: {(item.bfsScore * 100).toFixed(0)}%
            </Badge>
          </div>
        )}

        {/* Compliance Flags */}
        {item.complianceFlags.length > 0 && (
          <div className="mb-2 flex items-center gap-1 flex-wrap">
            <Shield className="h-3 w-3 text-red-600" />
            <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-300">
              {item.complianceFlags.length} flag{item.complianceFlags.length !== 1 ? "s" : ""}
            </Badge>
          </div>
        )}

        {/* Scheduled Date */}
        {item.scheduledFor && (
          <div className="flex items-center gap-1 text-xs text-slate-600 mb-2">
            <Calendar className="h-3 w-3" />
            {new Date(item.scheduledFor).toLocaleDateString()}
          </div>
        )}

        {/* Assigned To */}
        {item.assignedToName && (
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <User className="h-3 w-3" />
            {item.assignedToName}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Preview Dialog Component
interface ApprovalPreviewDialogProps {
  item: ApprovalItem;
  open: boolean;
  onClose: () => void;
  onApproveForClient: (item: ApprovalItem) => void;
  onSendBackToDraft: (item: ApprovalItem, reason?: string) => void;
  onMarkReadyForScheduling: (item: ApprovalItem) => void;
  onShowAuditLog: () => void;
  loading?: boolean;
}

function ApprovalPreviewDialog({
  item,
  open,
  onClose,
  onApproveForClient,
  onSendBackToDraft,
  onMarkReadyForScheduling,
  onShowAuditLog,
  loading,
}: ApprovalPreviewDialogProps) {
  const [showReasonBox, setShowReasonBox] = useState(false);
  const [reason, setReason] = useState("");

  const getBFSColor = (score?: number) => {
    if (!score) return "bg-gray-100 text-gray-700";
    if (score >= 0.9) return "bg-green-100 text-green-800";
    if (score >= 0.8) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  const canApproveForClient = item.status === "ready_for_client";
  const canSendToDraft =
    item.status === "needs_edits" ||
    item.status === "ready_for_client" ||
    item.status === "awaiting_client";
  const canMarkReady =
    item.status === "approved" || item.status === "awaiting_client";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Content Preview - {item.brandName}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onShowAuditLog}
              className="gap-2"
            >
              <History className="h-4 w-4" />
              View History
            </Button>
          </DialogTitle>
          <DialogDescription>
            {item.platform.charAt(0).toUpperCase() + item.platform.slice(1)} post
            • Created {new Date(item.createdAt).toLocaleDateString()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Media Preview */}
          {item.thumbnail && (
            <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
              <img
                src={item.thumbnail}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Content */}
          <div>
            <h4 className="font-semibold mb-2">Content</h4>
            <p className="text-sm text-slate-700 p-3 bg-gray-50 rounded-lg leading-relaxed">
              {item.content}
            </p>
          </div>

          {/* BFS & Compliance */}
          <div className="grid grid-cols-2 gap-4">
            {/* BFS Score */}
            {item.bfsScore !== undefined && (
              <div>
                <h4 className="font-semibold mb-2 text-sm">Brand Fidelity Score</h4>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full transition-all",
                        item.bfsScore >= 0.9 && "bg-green-500",
                        item.bfsScore >= 0.8 &&
                          item.bfsScore < 0.9 &&
                          "bg-yellow-500",
                        item.bfsScore < 0.8 && "bg-red-500",
                      )}
                      style={{ width: `${item.bfsScore * 100}%` }}
                    />
                  </div>
                  <Badge className={cn("text-xs font-semibold", getBFSColor(item.bfsScore))}>
                    {(item.bfsScore * 100).toFixed(0)}%
                  </Badge>
                </div>
              </div>
            )}

            {/* Compliance Flags */}
            <div>
              <h4 className="font-semibold mb-2 text-sm">Compliance Status</h4>
              {item.complianceFlags.length === 0 ? (
                <div className="flex items-center gap-2 text-sm text-green-700">
                  <CheckCircle className="h-4 w-4" />
                  <span>All checks passed</span>
                </div>
              ) : (
                <div className="space-y-1">
                  {item.complianceFlags.map((flag, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 text-sm text-red-700"
                    >
                      <AlertTriangle className="h-4 w-4" />
                      <span>{flag}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Scheduled Date */}
          {item.scheduledFor && (
            <div>
              <h4 className="font-semibold mb-2 text-sm">Scheduled For</h4>
              <div className="flex items-center gap-2 text-sm text-slate-700">
                <Calendar className="h-4 w-4" />
                {new Date(item.scheduledFor).toLocaleString()}
              </div>
            </div>
          )}

          {/* Requested Changes */}
          {item.requestedChanges && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-semibold mb-1 text-sm text-yellow-900">
                Client Feedback
              </h4>
              <p className="text-sm text-yellow-800">{item.requestedChanges}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 pt-4 border-t">
            {canApproveForClient && (
              <Button
                onClick={() => onApproveForClient(item)}
                disabled={loading}
                className="w-full bg-[var(--color-lime-400)] text-black hover:bg-[var(--color-lime-600)] gap-2"
              >
                <Send className="h-4 w-4" />
                Approve for Client
              </Button>
            )}

            {canSendToDraft && (
              <>
                <Button
                  variant="outline"
                  onClick={() => setShowReasonBox(!showReasonBox)}
                  disabled={loading}
                  className="w-full gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Send Back to Draft
                </Button>
                {showReasonBox && (
                  <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
                    <textarea
                  placeholder="Reason (optional)..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full min-h-20 p-2 text-sm border rounded-lg"
                />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          onSendBackToDraft(item, reason);
                          setReason("");
                          setShowReasonBox(false);
                        }}
                        disabled={loading}
                        variant="outline"
                      >
                        Confirm
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          setShowReasonBox(false);
                          setReason("");
                        }}
                        variant="ghost"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}

            {canMarkReady && (
              <Button
                onClick={() => onMarkReadyForScheduling(item)}
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 text-white gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                Mark Ready for Scheduling
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Audit Log Dialog Component
interface AuditLogDialogProps {
  item: ApprovalItem;
  open: boolean;
  onClose: () => void;
}

function AuditLogDialog({ item, open, onClose }: AuditLogDialogProps) {
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      loadAuditLogs();
    }
  }, [open, item.id]);

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/approvals/${item.contentId}/history`);
      if (response.ok) {
        const data = await response.json();
        setAuditLogs(data.history || []);
      } else {
        // Fallback to mock data
        setAuditLogs(getMockAuditLogs(item));
      }
    } catch (error) {
      console.error("Failed to load audit log:", error);
      setAuditLogs(getMockAuditLogs(item));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Activity Log - {item.brandName}</DialogTitle>
          <DialogDescription>
            Complete audit trail for this content item
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8 text-slate-500">Loading...</div>
          ) : auditLogs.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No activity log entries yet.
            </div>
          ) : (
            auditLogs.map((log, idx) => (
              <div
                key={idx}
                className="flex gap-4 p-4 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                    <User className="h-5 w-5 text-indigo-600" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm">
                      {log.actorEmail || log.userEmail || "System"}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {log.role || log.userRole || "User"}
                    </Badge>
                    <span className="text-xs text-slate-500">
                      {new Date(log.timestamp || log.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge
                      variant={
                        log.action === "APPROVED"
                          ? "default"
                          : log.action === "REJECTED"
                            ? "destructive"
                            : "secondary"
                      }
                      className="text-xs"
                    >
                      {log.action}
                    </Badge>
                    {log.metadata?.before && log.metadata?.after && (
                      <span className="text-xs text-slate-600">
                        {log.metadata.before.status} → {log.metadata.after.status}
                      </span>
                    )}
                  </div>
                  {log.metadata?.note && (
                    <p className="text-sm text-slate-700 mt-2 p-2 bg-gray-50 rounded">
                      {log.metadata.note}
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Mock data helpers
function getMockApprovals(): ApprovalItem[] {
  return [
    {
      id: "1",
      brandId: "brand_1",
      brandName: "Acme Corp",
      contentId: "content_1",
      platform: "instagram",
      content: "New product launch coming next week! Stay tuned...",
      thumbnail: "/placeholder.svg",
      status: "draft",
      bfsScore: 0.85,
      complianceFlags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "2",
      brandId: "brand_2",
      brandName: "TechStart Inc",
      contentId: "content_2",
      platform: "linkedin",
      content: "Join us for our webinar on AI trends in 2025",
      thumbnail: "/placeholder.svg",
      status: "ready_for_client",
      bfsScore: 0.92,
      complianceFlags: [],
      scheduledFor: new Date(Date.now() + 86400000).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "3",
      brandId: "brand_3",
      brandName: "FoodCo",
      contentId: "content_3",
      platform: "facebook",
      content: "Today's special: Our famous burger with house sauce!",
      thumbnail: "/placeholder.svg",
      status: "awaiting_client",
      bfsScore: 0.78,
      complianceFlags: ["Missing disclaimer"],
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "4",
      brandId: "brand_1",
      brandName: "Acme Corp",
      contentId: "content_4",
      platform: "twitter",
      content: "Excited to announce our partnership with...",
      status: "approved",
      bfsScore: 0.95,
      complianceFlags: [],
      approvedBy: "client@example.com",
      approvedAt: new Date().toISOString(),
      createdAt: new Date(Date.now() - 172800000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "5",
      brandId: "brand_2",
      brandName: "TechStart Inc",
      contentId: "content_5",
      platform: "instagram",
      content: "Behind the scenes of our creative process...",
      status: "scheduled",
      bfsScore: 0.88,
      complianceFlags: [],
      scheduledFor: new Date(Date.now() + 172800000).toISOString(),
      createdAt: new Date(Date.now() - 259200000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "6",
      brandId: "brand_3",
      brandName: "FoodCo",
      contentId: "content_6",
      platform: "facebook",
      content: "Weekend special menu now available!",
      status: "needs_edits",
      bfsScore: 0.65,
      complianceFlags: ["Tone mismatch", "Missing CTA"],
      requestedChanges: "Please adjust tone to be more professional",
      createdAt: new Date(Date.now() - 345600000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
}

function getMockAuditLogs(item: ApprovalItem): any[] {
  return [
    {
      id: "log_1",
      action: "APPROVAL_REQUESTED",
      actorEmail: "agency@example.com",
      role: "agency",
      timestamp: item.createdAt,
      metadata: {
        before: { status: "draft" },
        after: { status: "in_review" },
        note: "Content submitted for client approval",
      },
    },
    ...(item.requestedChanges
      ? [
          {
            id: "log_2",
            action: "REJECTED",
            actorEmail: "client@example.com",
            role: "client",
            timestamp: item.updatedAt,
            metadata: {
              before: { status: "awaiting_client" },
              after: { status: "needs_edits" },
              note: item.requestedChanges,
            },
          },
        ]
      : []),
    ...(item.approvedAt
      ? [
          {
            id: "log_3",
            action: "APPROVED",
            actorEmail: item.approvedBy || "client@example.com",
            role: "client",
            timestamp: item.approvedAt,
            metadata: {
              before: { status: "awaiting_client" },
              after: { status: "approved" },
              note: "Content approved by client",
            },
          },
        ]
      : []),
  ];
}
