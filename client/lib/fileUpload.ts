import { supabase } from "./supabase";
import { logError } from "./logger";

export interface UploadedFile {
  name: string;
  url: string;
  path: string;
  type: string;
  size: number;
}

/**
 * Upload file to Supabase Storage with progress tracking
 * @param file File to upload
 * @param brandId Brand ID for path organization
 * @param category Category subfolder (logos, imagery, references, etc.)
 * @param onProgress Optional callback for progress updates (0-100)
 * @returns Upload result with public URL
 */
export async function uploadBrandFile(
  file: File,
  brandId: string,
  category: string,
  onProgress?: (progress: number) => void,
): Promise<UploadedFile> {
  const fileExt = file.name.split(".").pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
  const filePath = `${brandId}/${category}/${fileName}`;

  // Simulate progress for better UX (actual Supabase SDK doesn't expose granular progress)
  const progressInterval = setInterval(() => {
    if (onProgress) {
      onProgress(Math.min(80, Math.random() * 100 * 0.3)); // Simulate up to 80%
    }
  }, 200);

  try {
    // Upload to Supabase Storage
    const { data: _data, error } = await supabase.storage
      .from("brand-assets")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    clearInterval(progressInterval);

    if (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("brand-assets").getPublicUrl(filePath);

    // Signal completion
    if (onProgress) onProgress(100);

    return {
      name: file.name,
      url: publicUrl,
      path: filePath,
      type: file.type,
      size: file.size,
    };
  } catch (error) {
    clearInterval(progressInterval);
    throw error;
  }
}

/**
 * Upload multiple files and create brand_assets records with progress tracking
 * @param onProgress Optional callback with {currentFile, totalFiles, progress: 0-100}
 */
export async function uploadBrandFiles(
  files: File[],
  brandId: string,
  category: string,
  assetType: string,
  onProgress?: (progress: {
    currentFile: number;
    totalFiles: number;
    progress: number;
  }) => void,
): Promise<UploadedFile[]> {
  const uploadedFiles: UploadedFile[] = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const uploadedFile = await uploadBrandFile(
      file,
      brandId,
      category,
      (fileProgress) => {
        // Calculate overall progress
        const overallProgress = ((i + fileProgress / 100) / files.length) * 100;
        if (onProgress) {
          onProgress({
            currentFile: i + 1,
            totalFiles: files.length,
            progress: Math.round(overallProgress),
          });
        }
      },
    );
    uploadedFiles.push(uploadedFile);
  }

  // Create brand_assets records
  const assetRecords = uploadedFiles.map((file) => ({
    brand_id: brandId,
    file_name: file.name,
    file_url: file.url,
    file_type: file.type,
    file_size_bytes: file.size,
    asset_type: assetType,
    tags: [category],
  }));

  const { error } = await supabase.from("brand_assets").insert(assetRecords);

  if (error) {
    logError("Error creating brand_assets records", error instanceof Error ? error : new Error(String(error)));
  }

  return uploadedFiles;
}

/**
 * Delete file from Supabase Storage
 */
export async function deleteBrandFile(filePath: string): Promise<void> {
  const { error } = await supabase.storage
    .from("brand-assets")
    .remove([filePath]);

  if (error) {
    throw new Error(`Delete failed: ${error.message}`);
  }
}
