import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  AlertCircle,
  RotateCcw,
  Eye,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/design-system";
import { useToast } from "@/hooks/use-toast";
import { useCurrentBrand } from "@/hooks/useCurrentBrand";

interface BrandGuideVersion {
  id: string;
  brandId: string;
  version: number;
  brandGuide: any; // Partial BrandGuide snapshot
  changedFields: string[];
  changedBy?: string;
  changeReason?: string;
  createdAt: string;
}

interface BrandGuideVersionHistoryProps {
  className?: string;
}

export function BrandGuideVersionHistory({ className }: BrandGuideVersionHistoryProps) {
  const { brandId } = useCurrentBrand();
  const { toast } = useToast();
  const [versions, setVersions] = useState<BrandGuideVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedVersion, setExpandedVersion] = useState<number | null>(null);
  const [viewingVersion, setViewingVersion] = useState<BrandGuideVersion | null>(null);
  const [rollingBack, setRollingBack] = useState<number | null>(null);

  useEffect(() => {
    if (brandId) {
      loadVersions();
    }
  }, [brandId]);

  const loadVersions = async () => {
    if (!brandId) return;

    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/brand-guide/${brandId}/versions`);
      if (!response.ok) {
        throw new Error("Failed to load version history");
      }

      const data = await response.json();
      setVersions(data.versions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load version history");
      console.error("Error loading version history:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewVersion = async (versionNumber: number) => {
    if (!brandId) return;

    try {
      const response = await fetch(`/api/brand-guide/${brandId}/versions/${versionNumber}`);
      if (!response.ok) {
        throw new Error("Failed to load version");
      }

      const data = await response.json();
      setViewingVersion(data.version);
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to load version",
        variant: "destructive",
      });
    }
  };

  const handleRollback = async (versionNumber: number) => {
    if (!brandId) return;

    const confirmed = window.confirm(
      `Are you sure you want to rollback to version ${versionNumber}? This will create a new version with the restored content.`
    );

    if (!confirmed) return;

    try {
      setRollingBack(versionNumber);
      const response = await fetch(`/api/brand-guide/${brandId}/rollback/${versionNumber}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Rollback failed" }));
        throw new Error(errorData.message || "Failed to rollback");
      }

      toast({
        title: "✅ Rollback Complete",
        description: `Brand Guide rolled back to version ${versionNumber}`,
      });

      // Reload versions and refresh Brand Guide
      await loadVersions();
      window.location.reload(); // Refresh to show updated Brand Guide
    } catch (err) {
      toast({
        title: "Rollback Failed",
        description: err instanceof Error ? err.message : "Failed to rollback version",
        variant: "destructive",
      });
    } finally {
      setRollingBack(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getChangedFieldsBadges = (fields: string[]) => {
    if (fields.length === 0) return null;
    return fields.slice(0, 5).map((field) => (
      <Badge key={field} variant="outline" className="text-xs">
        {field}
      </Badge>
    ));
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
      <Card className={cn("border-red-200 bg-red-50", className)}>
        <CardContent className="p-4 flex gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
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
        <CardContent className="p-12 text-center">
          <p className="text-gray-600 mb-2">No version history yet</p>
          <p className="text-sm text-gray-500">
            Version history will appear here as you make changes to your Brand Guide.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5" />
            Version History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {versions.map((version) => (
              <div
                key={version.id}
                className={cn(
                  "border rounded-lg p-4 transition-all",
                  expandedVersion === version.version
                    ? "border-indigo-300 bg-indigo-50"
                    : "border-gray-200 hover:border-gray-300"
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="font-bold">
                        v{version.version}
                      </Badge>
                      <span className="text-sm text-gray-600">
                        {formatDate(version.createdAt)}
                      </span>
                      {version.changeReason && (
                        <span className="text-xs text-gray-500 italic">
                          ({version.changeReason})
                        </span>
                      )}
                    </div>

                    {version.changedFields.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {getChangedFieldsBadges(version.changedFields)}
                        {version.changedFields.length > 5 && (
                          <Badge variant="outline" className="text-xs">
                            +{version.changedFields.length - 5} more
                          </Badge>
                        )}
                      </div>
                    )}

                    {expandedVersion === version.version && (
                      <div className="mt-3 p-3 bg-white rounded border border-gray-200">
                        <p className="text-xs font-bold text-gray-700 mb-2">Changed Fields:</p>
                        <ul className="text-xs text-gray-600 space-y-1">
                          {version.changedFields.map((field) => (
                            <li key={field}>• {field}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (expandedVersion === version.version) {
                          setExpandedVersion(null);
                        } else {
                          setExpandedVersion(version.version);
                        }
                      }}
                    >
                      {expandedVersion === version.version ? "Collapse" : "Details"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewVersion(version.version)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    {version.version < versions[0]?.version && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRollback(version.version)}
                        disabled={rollingBack === version.version}
                      >
                        {rollingBack === version.version ? (
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                          <RotateCcw className="h-4 w-4 mr-1" />
                        )}
                        Rollback
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* View Version Modal */}
      {viewingVersion && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Version {viewingVersion.version}</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewingVersion(null)}
                >
                  Close
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-bold text-gray-700 mb-2">Created:</p>
                  <p className="text-sm text-gray-600">{formatDate(viewingVersion.createdAt)}</p>
                </div>
                {viewingVersion.changeReason && (
                  <div>
                    <p className="text-sm font-bold text-gray-700 mb-2">Reason:</p>
                    <p className="text-sm text-gray-600">{viewingVersion.changeReason}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-bold text-gray-700 mb-2">Changed Fields:</p>
                  <div className="flex flex-wrap gap-1">
                    {viewingVersion.changedFields.map((field) => (
                      <Badge key={field} variant="outline" className="text-xs">
                        {field}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-700 mb-2">Brand Guide Snapshot:</p>
                  <pre className="text-xs bg-gray-50 p-4 rounded border border-gray-200 overflow-x-auto">
                    {JSON.stringify(viewingVersion.brandGuide, null, 2)}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

