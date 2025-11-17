import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import type { AssetUploadResponse } from "@shared/api";

interface AssetUploaderProps {
  brandId: string;
  _brandId?: string;
  category: "logo" | "font" | "image" | "document";
  onUpload: (files: File[]) => Promise<AssetUploadResponse[]>;
  accept?: string;
  multiple?: boolean;
}

export function AssetUploader({
  _brandId,
  category,
  onUpload,
  accept,
  multiple = false,
}: AssetUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<AssetUploadResponse[]>([]);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    await handleUpload(files);
  }, []);

  const handleFileInput = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      await handleUpload(files);
    },
    [],
  );

  const handleUpload = async (files: File[]) => {
    if (files.length === 0) return;

    setIsUploading(true);
    try {
      const results = await onUpload(files);
      setUploadedFiles((prev) => [
        ...prev,
        ...results.filter((r) => r.success),
      ]);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging ? "border-primary bg-primary/5" : "border-gray-300"
        }`}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onDragEnter={() => setIsDragging(true)}
        onDragLeave={() => setIsDragging(false)}
      >
        <div className="space-y-4">
          <div className="text-4xl">📁</div>
          <div>
            <p className="text-lg font-medium">
              Drop {category} files here, or click to browse
            </p>
            <p className="text-sm text-gray-500">
              {accept || `Supports ${category} files`}
            </p>
          </div>

          <input
            type="file"
            accept={accept}
            multiple={multiple}
            onChange={handleFileInput}
            className="hidden"
            id={`file-input-${category}`}
          />

          <Button
            variant="outline"
            onClick={() =>
              document.getElementById(`file-input-${category}`)?.click()
            }
            disabled={isUploading}
          >
            {isUploading ? "Uploading..." : "Choose Files"}
          </Button>
        </div>
      </div>

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium">Uploaded Files</h4>
          {uploadedFiles.map((file, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-2 bg-gray-50 rounded"
            >
              <span className="text-green-600">✓</span>
              <span className="flex-1">{file.asset.filename}</span>
              <span className="text-sm text-gray-500">
                {(file.asset.size / 1024).toFixed(1)} KB
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
