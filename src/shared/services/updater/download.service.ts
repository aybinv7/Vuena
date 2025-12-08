// APK Download Service
import type { UpdateInfo, DownloadProgress } from "./types";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { FileTransfer } from "@capacitor/file-transfer";
import { Network } from "@capacitor/network";

/**
 * Download APK to device cache using FileTransfer plugin
 * @returns File URI or null if failed
 */
export async function downloadApk(
  update: UpdateInfo,
  onProgress?: (progress: DownloadProgress) => void
): Promise<string | null> {
  // Check network
  const status = await Network.getStatus();
  if (!status.connected) {
    throw new Error("No internet connection");
  }

  const versionCode = update.version_code ?? 0;
  const fileName = `native-update-${versionCode}.apk`;

  // Check if already cached
  const cached = await getCachedApk(versionCode);
  if (cached) {
    console.log("[Download] Using cached APK:", cached);
    return cached;
  }

  console.log("[Download] Starting download:", update.download_url);

  try {
    if (!update.download_url) throw new Error("Missing download URL");

    // Get the file URI where we want to save the APK
    const fileInfo = await Filesystem.getUri({
      directory: Directory.Cache,
      path: fileName,
    });

    console.log("[Download] Saving to:", fileInfo.uri);

    // Set up progress listener
    let progressListener: any = null;
    if (onProgress) {
      progressListener = await FileTransfer.addListener(
        "progress",
        (progress) => {
          if (progress.url === update.download_url) {
            const percentage = progress.lengthComputable
              ? Math.round((progress.bytes / progress.contentLength) * 100)
              : 0;

            onProgress({
              loaded: progress.bytes,
              total: progress.contentLength,
              percent: percentage,
            });
          }
        }
      );
    }

    // Download the file
    const result = await FileTransfer.downloadFile({
      url: update.download_url,
      path: fileInfo.uri,
      progress: !!onProgress,
      connectTimeout: 60000, // 1 minute
      readTimeout: 300000, // 5 minutes for large files
    });

    // Clean up progress listener
    if (progressListener) {
      await progressListener.remove();
    }

    console.log("[Download] APK saved to:", result.path);
    return result.path ?? "";
  } catch (error: any) {
    console.error("[Download] Failed:", error);

    // Handle specific FileTransfer errors
    if (error.code) {
      switch (error.code) {
        case "OS-PLUG-FLTR-0008":
          throw new Error(
            "Failed to connect to download server. Check your internet connection."
          );
        case "OS-PLUG-FLTR-0010":
          throw new Error(
            `Download failed with HTTP error: ${error.httpStatus || "Unknown"}`
          );
        case "OS-PLUG-FLTR-0006":
          throw new Error(
            "Permission denied. Please grant storage permissions."
          );
        case "OS-PLUG-FLTR-0007":
          throw new Error("File does not exist at the specified location.");
        default:
          throw new Error(
            `Download failed: ${error.message || "Unknown error"}`
          );
      }
    }

    throw error;
  }
}

/**
 * Check if APK is already downloaded
 */
export async function getCachedApk(
  versionCode: number
): Promise<string | null> {
  try {
    const fileName = `native-update-${versionCode}.apk`;

    // First check if file exists
    const stat = await Filesystem.stat({
      path: fileName,
      directory: Directory.Cache,
    });

    // If it exists, get the full URI
    const { uri } = await Filesystem.getUri({
      directory: Directory.Cache,
      path: fileName,
    });

    return uri;
  } catch {
    return null;
  }
}

/**
 * Delete old cached APKs
 */
export async function cleanupOldApks(
  currentVersionCode: number
): Promise<void> {
  try {
    const { files } = await Filesystem.readdir({
      path: "",
      directory: Directory.Cache,
    });

    for (const file of files) {
      if (
        file.name.startsWith("native-update-") &&
        file.name.endsWith(".apk")
      ) {
        const code = parseInt(
          file.name.replace("native-update-", "").replace(".apk", "")
        );

        if (code <= currentVersionCode) {
          await Filesystem.deleteFile({
            path: file.name,
            directory: Directory.Cache,
          });
          console.log("[Cleanup] Deleted old APK:", file.name);
        }
      }
    }
  } catch (error) {
    console.error("[Cleanup] Failed:", error);
  }
}

/**
 * Delete a specific APK by version code
 */
export async function deleteApk(versionCode: number): Promise<void> {
  try {
    const fileName = `native-update-${versionCode}.apk`;
    await Filesystem.deleteFile({
      path: fileName,
      directory: Directory.Cache,
    });
    console.log("[Cleanup] Deleted APK:", fileName);
  } catch (error) {
    console.error("[Cleanup] Failed to delete APK:", error);
  }
}

/**
 * Get the size of a cached APK in bytes
 */
export async function getApkSize(versionCode: number): Promise<number | null> {
  try {
    const fileName = `native-update-${versionCode}.apk`;
    const stat = await Filesystem.stat({
      path: fileName,
      directory: Directory.Cache,
    });
    return stat.size;
  } catch {
    return null;
  }
}
