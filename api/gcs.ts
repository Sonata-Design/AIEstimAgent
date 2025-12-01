import { Storage } from "@google-cloud/storage";

// Initialize GCS client
// On Cloud Run, it will use Application Default Credentials automatically
// No need to pass credentials explicitly
const storage = new Storage({
  projectId: process.env.GCP_PROJECT_ID || "estimagent",
});

const bucketName = process.env.GCS_BUCKET || "estimagent-uploads";
const bucket = storage.bucket(bucketName);

/**
 * Generate a signed URL for direct browser upload to GCS
 * Browser will PUT file directly to this URL
 */
export async function generateSignedUploadUrl(
  filename: string,
  contentType: string = "application/octet-stream"
): Promise<{ signedUrl: string; publicUrl: string }> {
  try {
    const file = bucket.file(filename);

    // Generate signed URL valid for 15 minutes
    const [signedUrl] = await file.getSignedUrl({
      version: "v4",
      action: "write",
      expires: Date.now() + 15 * 60 * 1000, // 15 minutes
      contentType,
    });

    // Public URL for reading the file
    const publicUrl = `https://storage.googleapis.com/${bucketName}/${filename}`;

    console.log(`[GCS] Generated signed URL for ${filename}`);
    return { signedUrl, publicUrl };
  } catch (error) {
    console.error("[GCS] Error generating signed URL:", error);
    throw error;
  }
}

/**
 * Delete a file from GCS
 */
export async function deleteFile(filename: string): Promise<void> {
  try {
    await bucket.file(filename).delete();
    console.log(`[GCS] Deleted ${filename}`);
  } catch (error) {
    console.error("[GCS] Error deleting file:", error);
    throw error;
  }
}

/**
 * List files in bucket
 */
export async function listFiles(prefix?: string): Promise<string[]> {
  try {
    const [files] = await bucket.getFiles({ prefix });
    return files.map((f: any) => f.name);
  } catch (error) {
    console.error("[GCS] Error listing files:", error);
    throw error;
  }
}

/**
 * Get file metadata
 */
export async function getFileMetadata(filename: string): Promise<any> {
  try {
    const [metadata] = await bucket.file(filename).getMetadata();
    return metadata;
  } catch (error) {
    console.error("[GCS] Error getting metadata:", error);
    throw error;
  }
}
