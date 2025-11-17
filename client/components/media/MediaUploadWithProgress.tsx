import React, { useState, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  X,
  Check,
  AlertCircle,
  Loader2,
  ZapOff,
  Database,
} from "lucide-react";
import { cn } from "@/lib/design-system";

interface UploadFile {
  file: File;
  progress: number;
  status: "pending" | "uploading" | "processing" | "complete" | "error";
  error?: string;
  result?: unknown;
}

interface MediaUploadWithProgressProps {
  brandId: string;
  tenantId: string;
  category:
    | "graphics"
    | "images"
    | "logos"
    | "videos"
    | "ai_exports"
    | "client_uploads";
  onUploadComplete?: (assets: unknown[]) => void;
  onError?: (error: string) => void;
  className?: string;
}

export function MediaUploadWithProgress({
  brandId,
  tenantId,
  category,
  onUploadComplete,
  onError,
  className,
}: MediaUploadWithProgressProps) {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const newFiles = Array.from(e.dataTransfer.files).map((file) => ({
      file,
      progress: 0,
      status: "pending" as const,
    }));

    setFiles((prev) => [...prev, ...newFiles]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map((file) => ({
        file,
        progress: 0,
        status: "pending" as const,
      }));

      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const handleUpload = useCallback(async () => {
    if (files.length === 0) return;

    setIsUploading(true);
    const formData = new FormData();

    // Add all pending/failed files to the request
    const filesToUpload = files.filter(
      (f) => f.status === "pending" || f.status === "error",
    );

    for (const uploadFile of filesToUpload) {
      formData.append("files", uploadFile.file);
    }

    formData.append("brandId", brandId);
    formData.append("category", category);

    try {
      const response = await fetch(`/api/media/upload?tenantId=${tenantId}`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const data = await response.json();

      // Update file statuses
      setFiles((prev) =>
        prev.map((uf) => {
          const uploadedAsset = data.assets?.find(
            (a: { filename?: string }) => a.filename === uf.file.name,
          );
          if (uploadedAsset) {
            return {
              ...uf,
              progress: 100,
              status: "complete" as const,
              result: uploadedAsset,
            };
          }

          const error = data.errors?.find((e: { file?: string; error?: string }) => e.file === uf.file.name);
          if (error) {
            return {
              ...uf,
              status: "error" as const,
              error: error.error,
            };
          }

          return uf;
        }),
      );

      // Callback with uploaded assets
      const uploadedAssets = data.assets || [];
      onUploadComplete?.(uploadedAssets);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Upload failed";
      onError?.(errorMessage);
      setFiles((prev) =>
        prev.map((uf) =>
          uf.status === "uploading"
            ? { ...uf, status: "error" as const, error: errorMessage }
            : uf,
        ),
      );
    } finally {
      setIsUploading(false);
    }
  }, [files, brandId, tenantId, category, onUploadComplete, onError]);

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const clearCompleted = () => {
    setFiles((prev) => prev.filter((f) => f.status !== "complete"));
  };

  const pendingCount = files.filter((f) => f.status === "pending").length;
  const completeCount = files.filter((f) => f.status === "complete").length;
  const errorCount = files.filter((f) => f.status === "error").length;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Media Upload
        </CardTitle>
        <p className="text-sm text-gray-600">
          Upload files to {category} category. Max 100MB per file, 20 files at a
          time.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
            isDragging
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 hover:border-gray-400",
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            accept="image/*,video/*,.pdf"
            className="hidden"
          />

          <Upload className="h-12 w-12 mx-auto mb-3 text-gray-400" />
          <p className="text-lg font-medium">
            Drop files here or click to browse
          </p>
          <p className="text-sm text-gray-600">
            Supports images (JPG, PNG, GIF, WebP), videos (MP4, WebM), and PDFs
          </p>
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="space-y-2">
            {files.map((uploadFile, index) => (
              <div
                key={index}
                className="border rounded-lg p-3 flex items-start gap-3"
              >
                {/* Status Icon */}
                <div className="flex-shrink-0 pt-1">
                  {uploadFile.status === "complete" && (
                    <Check className="h-5 w-5 text-green-600" />
                  )}
                  {uploadFile.status === "uploading" && (
                    <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                  )}
                  {uploadFile.status === "error" && (
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  )}
                  {uploadFile.status === "pending" && (
                    <ZapOff className="h-5 w-5 text-gray-400" />
                  )}
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {uploadFile.file.name}
                  </p>
                  <p className="text-xs text-gray-600">
                    {(uploadFile.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  {uploadFile.error && (
                    <p className="text-xs text-red-600 mt-1">
                      {uploadFile.error}
                    </p>
                  )}
                </div>

                {/* Progress Bar */}
                {uploadFile.status !== "pending" &&
                  uploadFile.status !== "error" && (
                    <div className="flex-shrink-0 w-24">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${uploadFile.progress}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-600 text-right mt-1">
                        {uploadFile.progress}%
                      </p>
                    </div>
                  )}

                {/* Status Badge */}
                {uploadFile.status === "complete" && (
                  <Badge className="flex-shrink-0 bg-green-100 text-green-800">
                    Uploaded
                  </Badge>
                )}

                {uploadFile.status === "error" && (
                  <Badge className="flex-shrink-0 bg-red-100 text-red-800">
                    Failed
                  </Badge>
                )}

                {uploadFile.status === "pending" && (
                  <Badge className="flex-shrink-0" variant="outline">
                    Pending
                  </Badge>
                )}

                {/* Remove Button */}
                {uploadFile.status !== "uploading" && (
                  <button
                    onClick={() => removeFile(index)}
                    className="flex-shrink-0 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Stats */}
        {files.length > 0 && (
          <div className="flex gap-4 text-sm">
            {pendingCount > 0 && (
              <span className="text-gray-600">{pendingCount} pending</span>
            )}
            {completeCount > 0 && (
              <span className="text-green-600">{completeCount} uploaded</span>
            )}
            {errorCount > 0 && (
              <span className="text-red-600">{errorCount} failed</span>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          {pendingCount > 0 && (
            <Button
              onClick={handleUpload}
              disabled={isUploading}
              className="flex-1"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload {pendingCount} file{pendingCount !== 1 ? "s" : ""}
                </>
              )}
            </Button>
          )}

          {completeCount > 0 && (
            <Button onClick={clearCompleted} variant="outline">
              Clear completed
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
