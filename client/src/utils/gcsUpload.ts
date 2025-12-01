import { createApiUrl } from "@/config/api";

/**
 * Upload file directly to Google Cloud Storage
 * Much faster than uploading through API server
 */
export async function uploadToGCS(
  file: File,
  onProgress?: (progress: number) => void
): Promise<{ file_url: string; filename: string }> {
  try {
    console.log("[GCS] Starting direct upload to Google Cloud Storage");
    const uploadStart = performance.now();

    // Step 1: Get signed URL from backend
    console.log("[GCS] Requesting signed URL...");
    const signedUrlResponse = await fetch(createApiUrl("/api/get-signed-url"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${file.name}`,
        contentType: file.type,
      }),
    });

    if (!signedUrlResponse.ok) {
      throw new Error("Failed to get signed URL");
    }

    const { signed_url, public_url, filename } = await signedUrlResponse.json();
    console.log("[GCS] Got signed URL, uploading to GCS...");

    // Step 2: Upload file directly to GCS using signed URL
    const uploadResponse = await new Promise<Response>((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const percentComplete = (e.loaded / e.total) * 100;
          onProgress?.(percentComplete);
          console.log(`[GCS] Upload progress: ${percentComplete.toFixed(1)}%`);
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(new Response(xhr.responseText, { status: xhr.status }));
        } else {
          reject(new Error(`Upload failed: ${xhr.status}`));
        }
      });

      xhr.addEventListener("error", () => {
        reject(new Error("Upload failed"));
      });

      xhr.addEventListener("abort", () => {
        reject(new Error("Upload aborted"));
      });

      xhr.open("PUT", signed_url, true);
      xhr.setRequestHeader("Content-Type", file.type);
      xhr.send(file);
    });

    if (!uploadResponse.ok) {
      throw new Error("GCS upload failed");
    }

    const uploadTime = performance.now() - uploadStart;
    console.log(`[GCS] ✅ Upload complete in ${uploadTime.toFixed(0)}ms`);

    return {
      file_url: public_url,
      filename: filename,
    };
  } catch (error) {
    console.error("[GCS] Upload failed:", error);
    throw error;
  }
}

/**
 * Upload PDF directly to GCS
 */
export async function uploadPDFToGCS(
  file: File,
  onProgress?: (progress: number) => void
): Promise<{ file_url: string; filename: string }> {
  return uploadToGCS(file, onProgress);
}
