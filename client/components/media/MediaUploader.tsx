import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, X, CheckCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/design-system";

interface MediaUploadProgress {
  id: string;
  filename: string;
  progress: number;
  status: "uploading" | "processing" | "complete" | "error";
  error?: string;
}

interface MediaUploaderProps {
  brandId: string;
  onUploadComplete?: (assets: unknown[]) => void;
  maxFiles?: number;
  acceptedTypes?: string[];
  className?: string;
}

export function MediaUploader({
  brandId,
  onUploadComplete,
  maxFiles = 10,
  acceptedTypes = ["image/*"],
  className,
}: MediaUploaderProps) {
  const [uploads, setUploads] = useState<MediaUploadProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const uploadFile = async (file: File): Promise<unknown> => {
    const uploadId = Math.random().toString(36).substr(2, 9);

    setUploads((prev) => [
      ...prev,
      {
        id: uploadId,
        filename: file.name,
        progress: 0,
        status: "uploading",
      },
    ]);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("brandId", brandId);
      formData.append("generateVariants", "true");

      const xhr = new XMLHttpRequest();

      return new Promise((resolve, reject) => {
        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            const progress = (e.loaded / e.total) * 90;
            setUploads((prev) =>
              prev.map((upload) =>
                upload.id === uploadId ? { ...upload, progress } : upload,
              ),
            );
          }
        });

        xhr.onload = () => {
          if (xhr.status === 200) {
            const response = JSON.parse(xhr.responseText);
            setUploads((prev) =>
              prev.map((upload) =>
                upload.id === uploadId
                  ? { ...upload, progress: 100, status: "complete" }
                  : upload,
              ),
            );
            resolve(response);
          } else {
            const error = `Upload failed: ${xhr.statusText}`;
            setUploads((prev) =>
              prev.map((upload) =>
                upload.id === uploadId
                  ? { ...upload, status: "error", error }
                  : upload,
              ),
            );
            reject(new Error(error));
          }
        };

        xhr.onerror = () => {
          const error = "Network error during upload";
          setUploads((prev) =>
            prev.map((upload) =>
              upload.id === uploadId
                ? { ...upload, status: "error", error }
                : upload,
            ),
          );
          reject(new Error(error));
        };

        xhr.open("POST", "/api/media/upload");
        xhr.send(formData);
      });
    } catch (error) {
      setUploads((prev) =>
        prev.map((upload) =>
          upload.id === uploadId
            ? {
                ...upload,
                status: "error",
                error: error instanceof Error ? error.message : "Upload failed",
              }
            : upload,
        ),
      );
      throw error;
    }
  };

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      setIsUploading(true);
      const results: unknown[] = [];

      try {
        const uploadPromises = acceptedFiles.slice(0, maxFiles).map(uploadFile);
        const responses = await Promise.allSettled(uploadPromises);

        responses.forEach((result) => {
          if (result.status === "fulfilled") {
            results.push(result.value);
          }
        });

        onUploadComplete?.(results);
      } catch (error) {
        console.error("Upload error:", error);
      } finally {
        setIsUploading(false);
      }
    },
    [brandId, maxFiles, onUploadComplete],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedTypes.reduce((acc, type) => ({ ...acc, [type]: [] }), {}),
    maxFiles,
    disabled: isUploading,
  });

  const removeUpload = (id: string) => {
    setUploads((prev) => prev.filter((upload) => upload.id !== id));
  };

  const clearCompleted = () => {
    setUploads((prev) => prev.filter((upload) => upload.status !== "complete"));
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-gray-300 hover:border-gray-400",
          isUploading && "opacity-50 cursor-not-allowed",
        )}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        {isDragActive ? (
          <p className="text-lg font-medium">Drop files here...</p>
        ) : (
          <div>
            <p className="text-lg font-medium mb-2">
              Drag & drop media files here, or click to select
            </p>
            <p className="text-sm text-gray-500">
              Supports {acceptedTypes.join(", ")} • Max {maxFiles} files • 50MB
              per file
            </p>
          </div>
        )}
      </div>

      {uploads.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Uploads</h3>
            {uploads.some((u) => u.status === "complete") && (
              <Button variant="ghost" size="sm" onClick={clearCompleted}>
                Clear completed
              </Button>
            )}
          </div>

          {uploads.map((upload) => (
            <div
              key={upload.id}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium truncate">
                    {upload.filename}
                  </span>
                  {upload.status === "complete" && (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                  {upload.status === "error" && (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  )}
                  <Badge
                    variant={
                      upload.status === "complete"
                        ? "default"
                        : upload.status === "error"
                          ? "destructive"
                          : "secondary"
                    }
                  >
                    {upload.status}
                  </Badge>
                </div>
                {upload.status !== "error" && (
                  <Progress value={upload.progress} className="h-1" />
                )}
                {upload.error && (
                  <p className="text-xs text-red-600 mt-1">{upload.error}</p>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeUpload(upload.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
