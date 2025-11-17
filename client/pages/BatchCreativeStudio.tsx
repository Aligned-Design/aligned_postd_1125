import { useState } from "react";
import { AppShell } from "@postd/layout/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sparkles,
  Plus,
  Trash2,
  CheckCircle,
  Calendar,
  Eye,
  Loader,
  ArrowLeft,
  Download,
  Upload,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface BatchPost {
  id: string;
  topic: string;
  platforms: string[];
  scheduleDate: string;
  status: "pending" | "generating" | "ready" | "queued";
  safetyMode: boolean;
}

const PLATFORMS = [
  { id: "instagram", name: "Instagram", icon: "📸" },
  { id: "linkedin", name: "LinkedIn", icon: "💼" },
  { id: "twitter", name: "Twitter", icon: "🐦" },
  { id: "facebook", name: "Facebook", icon: "👥" },
  { id: "tiktok", name: "TikTok", icon: "🎵" },
];

export default function BatchCreativeStudio() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [posts, setPosts] = useState<BatchPost[]>([
    {
      id: "1",
      topic: "",
      platforms: [],
      scheduleDate: "",
      status: "pending",
      safetyMode: true,
    },
  ]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedRows, setSelectedRows] = useState<string[]>([]);

  const handleAddRow = () => {
    const newPost: BatchPost = {
      id: `${Date.now()}`,
      topic: "",
      platforms: [],
      scheduleDate: "",
      status: "pending",
      safetyMode: true,
    };
    setPosts([...posts, newPost]);
  };

  const handleRemoveRow = (id: string) => {
    setPosts(posts.filter((p) => p.id !== id));
    setSelectedRows(selectedRows.filter((r) => r !== id));
  };

  const handleUpdatePost = (id: string, updates: Partial<BatchPost>) => {
    setPosts(posts.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  };

  const togglePlatform = (postId: string, platformId: string) => {
    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    const platforms = post.platforms.includes(platformId)
      ? post.platforms.filter((p) => p !== platformId)
      : [...post.platforms, platformId];

    handleUpdatePost(postId, { platforms });
  };

  const toggleSelectRow = (id: string) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id],
    );
  };

  const toggleSelectAll = () => {
    if (selectedRows.length === posts.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(posts.map((p) => p.id));
    }
  };

  const handleGenerateAll = async () => {
    const validPosts = posts.filter((p) => p.topic && p.platforms.length > 0);

    if (validPosts.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please fill in at least one topic and select platforms",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    // Update status to generating
    const generatingIds = validPosts.map((p) => p.id);
    setPosts((prev) =>
      prev.map((p) =>
        generatingIds.includes(p.id) ? { ...p, status: "generating" } : p,
      ),
    );

    // Simulate parallel AI generation (in real app, would call API)
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Update status to ready
    setPosts((prev) =>
      prev.map((p) =>
        generatingIds.includes(p.id) ? { ...p, status: "ready" } : p,
      ),
    );

    setIsGenerating(false);

    toast({
      title: "✅ Generation Complete",
      description: `Generated ${validPosts.length} posts successfully`,
    });
  };

  const handleQueueSelected = () => {
    const selectedPosts = posts.filter((p) => selectedRows.includes(p.id));
    const readyPosts = selectedPosts.filter((p) => p.status === "ready");

    if (readyPosts.length === 0) {
      toast({
        title: "No Ready Posts",
        description: "Please generate posts before queuing",
        variant: "destructive",
      });
      return;
    }

    // Update status to queued
    setPosts((prev) =>
      prev.map((p) =>
        readyPosts.some((rp) => rp.id === p.id)
          ? { ...p, status: "queued" }
          : p,
      ),
    );

    toast({
      title: "📤 Queued Successfully",
      description: `${readyPosts.length} posts added to Content Queue`,
    });

    setSelectedRows([]);
  };

  const handleExportCSV = () => {
    const csv = [
      ["Topic", "Platforms", "Schedule Date", "Safety Mode", "Status"],
      ...posts.map((p) => [
        p.topic,
        p.platforms.join("; "),
        p.scheduleDate,
        p.safetyMode ? "Yes" : "No",
        p.status,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `batch-content-${Date.now()}.csv`;
    a.click();

    toast({
      title: "⬇️ Exported",
      description: "CSV file downloaded successfully",
    });
  };

  const validPostsCount = posts.filter(
    (p) => p.topic && p.platforms.length > 0,
  ).length;

  return (
    <AppShell>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <button
              onClick={() => navigate("/creative-studio")}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-2 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Back to Creative Studio</span>
            </button>
            <h1 className="text-3xl font-black text-slate-900">
              Batch Content Creation
            </h1>
            <p className="text-slate-600 mt-1">
              Create multiple posts at once for faster content planning
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportCSV}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button variant="outline">
              <Upload className="w-4 h-4 mr-2" />
              Import CSV
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">
                Total Rows
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-black text-slate-900">
                {posts.length}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">
                Valid Posts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-black text-indigo-600">
                {validPostsCount}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">
                Ready to Queue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-black text-green-600">
                {posts.filter((p) => p.status === "ready").length}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-slate-600">
                Queued
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-black text-blue-600">
                {posts.filter((p) => p.status === "queued").length}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
          <div className="flex items-center gap-3">
            <Button onClick={handleAddRow} variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Row
            </Button>

            {selectedRows.length > 0 && (
              <Button
                onClick={() => {
                  selectedRows.forEach((id) => handleRemoveRow(id));
                }}
                variant="outline"
                size="sm"
                className="text-red-600 hover:bg-red-50 border-red-200"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Selected ({selectedRows.length})
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleQueueSelected}
              variant="outline"
              disabled={selectedRows.length === 0}
            >
              Queue Selected ({selectedRows.length})
            </Button>

            <Button
              onClick={handleGenerateAll}
              disabled={isGenerating || validPostsCount === 0}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
            >
              {isGenerating ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate All ({validPostsCount})
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <input
                        type="checkbox"
                        checked={
                          selectedRows.length === posts.length &&
                          posts.length > 0
                        }
                        onChange={toggleSelectAll}
                        className="rounded"
                      />
                    </TableHead>
                    <TableHead className="w-8">#</TableHead>
                    <TableHead className="min-w-[250px]">
                      Topic / Headline
                    </TableHead>
                    <TableHead className="min-w-[200px]">Platforms</TableHead>
                    <TableHead className="min-w-[150px]">
                      Schedule Date
                    </TableHead>
                    <TableHead className="w-32">Safety Mode</TableHead>
                    <TableHead className="w-32">Status</TableHead>
                    <TableHead className="w-20">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {posts.map((post, index) => (
                    <TableRow
                      key={post.id}
                      className={
                        selectedRows.includes(post.id) ? "bg-indigo-50" : ""
                      }
                    >
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedRows.includes(post.id)}
                          onChange={() => toggleSelectRow(post.id)}
                          className="rounded"
                        />
                      </TableCell>
                      <TableCell className="font-medium text-slate-600">
                        {index + 1}
                      </TableCell>
                      <TableCell>
                        <input
                          type="text"
                          value={post.topic}
                          onChange={(e) =>
                            handleUpdatePost(post.id, { topic: e.target.value })
                          }
                          placeholder="E.g., Product launch announcement"
                          className="w-full px-3 py-2 rounded border border-slate-200 focus:border-indigo-500 focus:outline-none text-sm"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {PLATFORMS.map((platform) => (
                            <button
                              key={platform.id}
                              onClick={() =>
                                togglePlatform(post.id, platform.id)
                              }
                              className={`px-2 py-1 rounded text-xs font-medium transition-all ${
                                post.platforms.includes(platform.id)
                                  ? "bg-indigo-100 text-indigo-700 border-2 border-indigo-500"
                                  : "bg-slate-100 text-slate-600 border-2 border-transparent hover:border-slate-300"
                              }`}
                            >
                              {platform.icon} {platform.name}
                            </button>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <input
                          type="date"
                          value={post.scheduleDate}
                          onChange={(e) =>
                            handleUpdatePost(post.id, {
                              scheduleDate: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 rounded border border-slate-200 focus:border-indigo-500 focus:outline-none text-sm"
                        />
                      </TableCell>
                      <TableCell>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={post.safetyMode}
                            onChange={(e) =>
                              handleUpdatePost(post.id, {
                                safetyMode: e.target.checked,
                              })
                            }
                            className="rounded"
                          />
                          <span className="text-xs">On</span>
                        </label>
                      </TableCell>
                      <TableCell>
                        {post.status === "pending" && (
                          <Badge variant="outline">Pending</Badge>
                        )}
                        {post.status === "generating" && (
                          <Badge className="bg-indigo-100 text-indigo-700">
                            <Loader className="w-3 h-3 mr-1 animate-spin" />
                            Generating
                          </Badge>
                        )}
                        {post.status === "ready" && (
                          <Badge className="bg-green-100 text-green-700">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Ready
                          </Badge>
                        )}
                        {post.status === "queued" && (
                          <Badge className="bg-blue-100 text-blue-700">
                            <Calendar className="w-3 h-3 mr-1" />
                            Queued
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {post.status === "ready" && (
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveRow(post.id)}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Help Text */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm text-blue-900 font-medium mb-2">
            💡 <strong>Pro Tips for Batch Creation:</strong>
          </p>
          <ul className="text-xs text-blue-800 space-y-1">
            <li>
              • Fill in topics and platforms for each row before clicking
              "Generate All"
            </li>
            <li>
              • Generation happens in parallel - create 10 posts in the same
              time as 1
            </li>
            <li>
              • Safety Mode runs brand fidelity checks on all posts
              automatically
            </li>
            <li>
              • Use CSV import/export to prepare content in spreadsheets offline
            </li>
            <li>• Select multiple rows to queue or delete them together</li>
          </ul>
        </div>
      </div>
    </AppShell>
  );
}
