// Native Update API Service
// This is SEPARATE from Capgo OTA - uses a different API route
import type { UpdateInfo } from "./types";
import { getUpdaterConfig } from "./config";
import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";
import { FileTransfer } from "@capacitor/file-transfer";
import { Filesystem, Directory } from "@capacitor/filesystem";
import axios from "axios";

/**
 * Get current app version code
 */
export async function getCurrentVersionCode(): Promise<number> {
  if (!Capacitor.isNativePlatform()) {
    return 999999; // Web always "up to date"
  }

  try {
    const info = await App.getInfo();
    return parseInt(info.build) || 0;
  } catch (error) {
    console.error("[NativeUpdater] Failed to get app info:", error);
    return 0;
  }
}

/**
 * Get current platform
 */
export function getPlatform(): "android" | "ios" | "web" {
  return Capacitor.getPlatform() as "android" | "ios" | "web";
}

/**
 * Check for native updates via separate API
 */
export async function checkNativeUpdate(): Promise<UpdateInfo | null> {
  const config = getUpdaterConfig();
  const platform = getPlatform();

  if (platform === "web") {
    return null;
  }

  const currentVersionCode = await getCurrentVersionCode();
  console.log("currentVersionCode this on to execute ", currentVersionCode);

  try {
    const response = await axios.get(
      `${config.nativeApiUrl}/api/native-updates/check`,
      {
        params: {
          platform,
          environment: config.environment,
          current_version_code: currentVersionCode.toString(),
        },
      }
    );

    const data = response.data;

    if (data.available && data.update) {
      return {
        type: "native",
        version: data.update.version,
        version_code: data.update.version_code,
        download_url: data.update.download_url,
        release_notes: data.update.release_notes,
        required: data.update.required,
        platform: data.update.platform,
      } as UpdateInfo;
    }

    return null;
  } catch (error) {
    console.error("[NativeUpdater] Check failed:", error);
    return null;
  }
}

/**
 * Download APK file using FileTransfer plugin
 * @param downloadUrl - The URL to download the APK from
 * @param fileName - The name to save the file as (e.g., "app-update.apk")
 * @param onProgress - Optional callback for download progress
 * @returns The local file path where the APK was saved
 */
export async function downloadApk(
  downloadUrl: string,
  fileName: string = "app-update.apk",
  onProgress?: (progress: {
    bytes: number;
    contentLength: number;
    percentage: number;
  }) => void
): Promise<string> {
  if (!Capacitor.isNativePlatform()) {
    throw new Error("APK downloads are only supported on native platforms");
  }

  try {
    console.log(`[Download] Starting download: ${downloadUrl}`);

    // Get the file URI where we want to save the APK
    const fileInfo = await Filesystem.getUri({
      directory: Directory.Cache, // Use Cache directory for temporary downloads
      path: fileName,
    });

    console.log(`[Download] Saving to: ${fileInfo.uri}`);

    // Set up progress listener if callback provided
    let progressListener: any = null;
    if (onProgress) {
      progressListener = await FileTransfer.addListener(
        "progress",
        (progress) => {
          if (progress.url === downloadUrl) {
            const percentage = progress.lengthComputable
              ? Math.round((progress.bytes / progress.contentLength) * 100)
              : 0;

            onProgress({
              bytes: progress.bytes,
              contentLength: progress.contentLength,
              percentage,
            });
          }
        }
      );
    }

    // Download the file
    const result = await FileTransfer.downloadFile({
      url: downloadUrl,
      path: fileInfo.uri,
      progress: !!onProgress, // Enable progress events if callback provided
      connectTimeout: 60000, // 1 minute
      readTimeout: 300000, // 5 minutes for large files
    });

    // Clean up progress listener
    if (progressListener) {
      await progressListener.remove();
    }

    console.log(`[Download] Completed: ${result.path}`);
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
 * Log update event
 */
export async function logUpdateEvent(
  event: "check" | "download" | "install" | "cancel" | "error",
  update: UpdateInfo | null,
  details?: Record<string, unknown>
): Promise<void> {
  const config = getUpdaterConfig();
  const platform = getPlatform();
  const currentVersionCode = await getCurrentVersionCode();

  try {
    await axios.post(
      `${config.nativeApiUrl}/api/native-updates/log`,
      {
        event,
        platform,
        device_id: localStorage.getItem("device_id") || "unknown",
        current_version_code: currentVersionCode,
        new_version: update?.version,
        new_version_code: update?.version_code,
        channel: config.channel,
        environment: config.environment,
        ...details,
      },
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[NativeUpdater] Failed to log event:", error);
  }
}
