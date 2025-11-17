import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChevronRight,
  Loader2,
  AlertCircle,
  CheckCircle,
  RotateCcw,
  Copy,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/design-system";

interface ContentVersion {
  id: string;
  contentId: string;
  version: number;
  content: string;
  platform: string;
  createdBy?: string;
  createdAt: string;
  status: "draft" | "approved" | "published" | "archived";
  bfsScore?: number;
  linterPassed: boolean;
  complianceIssuesCount: number;
  changeType: "created" | "regenerated" | "edited" | "approved" | "published";
  changeReason?: string;
  metadata?: {
    agentType?: string;
    regenerationCount?: number;
    tags?: string[];
  };
}

interface VersionDiff {
  versionA: ContentVersion;
  versionB: ContentVersion;
  similarity: number;
  changeSize: number;
  additions: string[];
  deletions: string[];
  bfsScoreChange?: number;
  complianceIssuesChange?: number;
}

interface VersionHistoryViewerProps {
  contentId: string;
  className?: string;
}

export function VersionHistoryViewer({
  contentId,
  className,
}: VersionHistoryViewerProps) {
  const [versions, setVersions] = useState<ContentVersion[]>([]);
  const [selectedVersionA, setSelectedVersionA] = useState<number | null>(null);
  const [selectedVersionB, setSelectedVersionB] = useState<number | null>(null);
  const [diff, setDiff] = useState<VersionDiff | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedVersion, setExpandedVersion] = useState<number | null>(null);

  useEffect(() => {
    loadVersions();
  }, [contentId]);

  useEffect(() => {
    if (selectedVersionA && selectedVersionB) {
      loadDiff();
    }
  }, [selectedVersionA, selectedVersionB]);

  const loadVersions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/content/${contentId}/versions`);
      if (!response.ok) throw new Error("Failed to load versions");

      const data = await response.json();
      setVersions(data.versions || []);
      if (data.versions?.length > 0) {
        setSelectedVersionB(data.versions[data.versions.length - 1].version);
        if (data.versions.length > 1) {
          setSelectedVersionA(data.versions[data.versions.length - 2].version);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load versions");
    } finally {
      setLoading(false);
    }
  };

  const loadDiff = async () => {
    try {
      const response = await fetch(
        `/api/content/${contentId}/versions/diff?a=${selectedVersionA}&b=${selectedVersionB}`,
      );
      if (!response.ok) throw new Error("Failed to load diff");

      const data = await response.json();
      setDiff(data.diff);
    } catch (err) {
      console.error("Error loading diff:", err);
    }
  };

  const handleRollback = async (versionNumber: number) => {
    try {
      const response = await fetch(
        `/api/content/${contentId}/versions/${versionNumber}/rollback`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: "User initiated rollback" }),
        },
      );

      if (response.ok) {
        await loadVersions();
      } else {
        setError("Failed to rollback version");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Rollback failed");
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-12 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-4 flex gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-900">{error}</p>
            <Button
              onClick={loadVersions}
              variant="outline"
              size="sm"
              className="mt-2"
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (versions.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Version History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-gray-500 py-8">
            No versions available for this content
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Tabs defaultValue="timeline" className={cn("space-y-4", className)}>
      <TabsList>
        <TabsTrigger value="timeline">Timeline</TabsTrigger>
        <TabsTrigger value="compare">Compare</TabsTrigger>
      </TabsList>

      {/* Timeline Tab */}
      <TabsContent value="timeline" className="space-y-4">
        <div className="space-y-3">
          {versions.map((version, idx) => (
            <Card
              key={version.id}
              className={cn(
                "cursor-pointer transition-all",
                expandedVersion === version.version
                  ? "ring-2 ring-blue-500"
                  : "",
              )}
              onClick={() =>
                setExpandedVersion(
                  expandedVersion === version.version ? null : version.version,
                )
              }
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="flex flex-col items-center gap-1">
                      <div
                        className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold",
                          version.status === "published"
                            ? "bg-green-600"
                            : version.status === "approved"
                              ? "bg-blue-600"
                              : version.status === "archived"
                                ? "bg-gray-400"
                                : "bg-yellow-600",
                        )}
                      >
                        {version.version}
                      </div>
                      {idx < versions.length - 1 && (
                        <div className="w-0.5 h-8 bg-gray-300" />
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">
                          Version {version.version}
                        </h4>
                        <Badge variant="outline" className="text-xs">
                          {version.changeType}
                        </Badge>
                        <Badge
                          variant={
                            version.status === "published"
                              ? "default"
                              : "secondary"
                          }
                          className="text-xs"
                        >
                          {version.status}
                        </Badge>
                      </div>

                      <p className="text-sm text-gray-600 mb-2">
                        {new Date(version.createdAt).toLocaleString()}
                        {version.createdBy && ` · by ${version.createdBy}`}
                      </p>

                      {version.changeReason && (
                        <p className="text-sm text-gray-700 mb-2 italic">
                          {version.changeReason}
                        </p>
                      )}

                      {/* Quality Metrics */}
                      <div className="flex gap-4 text-xs">
                        {version.bfsScore !== undefined && (
                          <div className="flex items-center gap-1">
                            <span className="text-gray-600">BFS:</span>
                            <span
                              className={cn(
                                "font-semibold",
                                version.bfsScore >= 0.8
                                  ? "text-green-600"
                                  : "text-orange-600",
                              )}
                            >
                              {(version.bfsScore * 100).toFixed(0)}%
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <span className="text-gray-600">Compliance:</span>
                          {version.linterPassed ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                        {version.complianceIssuesCount > 0 && (
                          <div className="text-red-600">
                            {version.complianceIssuesCount} issue
                            {version.complianceIssuesCount > 1 ? "s" : ""}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <ChevronRight
                    className={cn(
                      "h-5 w-5 text-gray-400 transition-transform",
                      expandedVersion === version.version ? "rotate-90" : "",
                    )}
                  />
                </div>

                {/* Expanded Content */}
                {expandedVersion === version.version && (
                  <div className="mt-4 pt-4 border-t space-y-3">
                    {/* Content Preview */}
                    <div>
                      <p className="text-xs font-medium text-gray-600 mb-2">
                        Content:
                      </p>
                      <div className="bg-gray-50 rounded p-3 text-sm max-h-40 overflow-auto">
                        {version.content}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigator.clipboard.writeText(version.content);
                        }}
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copy
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRollback(version.version);
                        }}
                        disabled={version.status === "published"}
                      >
                        <RotateCcw className="h-3 w-3 mr-1" />
                        Rollback
                      </Button>
                      {version.status !== "archived" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Archive version
                          }}
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Archive
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>

      {/* Compare Tab */}
      <TabsContent value="compare" className="space-y-4">
        {/* Version Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Select Versions to Compare
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Version A
                </label>
                <select
                  value={selectedVersionA || ""}
                  onChange={(e) =>
                    setSelectedVersionA(parseInt(e.target.value))
                  }
                  className="w-full rounded border border-gray-300 p-2 text-sm"
                >
                  <option value="">Select version</option>
                  {versions.map((v) => (
                    <option key={v.id} value={v.version}>
                      v{v.version} -{" "}
                      {new Date(v.createdAt).toLocaleDateString()}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Version B
                </label>
                <select
                  value={selectedVersionB || ""}
                  onChange={(e) =>
                    setSelectedVersionB(parseInt(e.target.value))
                  }
                  className="w-full rounded border border-gray-300 p-2 text-sm"
                >
                  <option value="">Select version</option>
                  {versions.map((v) => (
                    <option key={v.id} value={v.version}>
                      v{v.version} -{" "}
                      {new Date(v.createdAt).toLocaleDateString()}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Diff Display */}
        {diff && (
          <>
            {/* Similarity Score */}
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Similarity</p>
                    <div className="flex items-center gap-4">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${diff.similarity * 100}%` }}
                        />
                      </div>
                      <span className="text-lg font-semibold">
                        {(diff.similarity * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  {/* Quality Changes */}
                  {diff.bfsScoreChange !== undefined && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        BFS Score Change
                      </span>
                      <span
                        className={cn(
                          "font-semibold",
                          diff.bfsScoreChange > 0
                            ? "text-green-600"
                            : "text-red-600",
                        )}
                      >
                        {diff.bfsScoreChange > 0 ? "+" : ""}
                        {(diff.bfsScoreChange * 100).toFixed(1)}%
                      </span>
                    </div>
                  )}

                  {diff.complianceIssuesChange !== undefined && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        Compliance Issues Change
                      </span>
                      <span
                        className={cn(
                          "font-semibold",
                          diff.complianceIssuesChange < 0
                            ? "text-green-600"
                            : "text-red-600",
                        )}
                      >
                        {diff.complianceIssuesChange > 0 ? "+" : ""}
                        {diff.complianceIssuesChange}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Additions and Deletions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {diff.additions.length > 0 && (
                <Card className="border-green-200 bg-green-50">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <span className="text-green-600">+</span>
                      Added ({diff.additions.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-64 overflow-auto">
                      {diff.additions.map((line, idx) => (
                        <div
                          key={idx}
                          className="p-2 bg-white rounded text-sm text-green-800 font-mono border-l-2 border-green-600"
                        >
                          {line}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {diff.deletions.length > 0 && (
                <Card className="border-red-200 bg-red-50">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <span className="text-red-600">−</span>
                      Removed ({diff.deletions.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-64 overflow-auto">
                      {diff.deletions.map((line, idx) => (
                        <div
                          key={idx}
                          className="p-2 bg-white rounded text-sm text-red-800 font-mono border-l-2 border-red-600 line-through"
                        >
                          {line}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </>
        )}
      </TabsContent>
    </Tabs>
  );
}
