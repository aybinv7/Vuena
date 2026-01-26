/**
 * Native Update API Service
 * Handles communication with self-hosted update server for native (APK) updates
 */
import type { UpdateInfo } from "./types";
import { getUpdaterConfig } from "./config";
import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";
import axios from "axios";

/**
 * Get current app version code (build number)
 * @returns Version code number, or 999999 on web
 */
export async function getCurrentVersionCode(): Promise<number> {
  if (!Capacitor.isNativePlatform()) {
    return 999999;
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
 * @returns "android" | "ios" | "web"
 */
export function getPlatform(): "android" | "ios" | "web" {
  return Capacitor.getPlatform() as "android" | "ios" | "web";
}

/**
 * Check for native updates via backend API
 * @returns UpdateInfo if update available, null otherwise
 */
export async function checkNativeUpdate(): Promise<UpdateInfo | null> {
  const config = getUpdaterConfig();
  const platform = getPlatform();

  if (platform === "web") {
    return null;
  }

  const currentVersionCode = await getCurrentVersionCode();

  try {
    const response = await axios.get(
      `${config.nativeApiUrl}/api/native-updates/check`,
      {
        params: {
          platform,
          channel: config.channel,
          current_version_code: currentVersionCode.toString(),
          app_id: config.appId,
        },
      }
    );

    const data = response.data;

    if (data.available && data.update) {
      return {
        type: "native",
        version: data.update.version_name,
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
 * Log update event to backend for analytics
 * @param event - Event type
 * @param update - Update info (optional)
 * @param details - Additional details (optional)
 */
export async function logUpdateEvent(
  event:
    | "check"
    | "download"
    | "install"
    | "cancel"
    | "error"
    | "download_complete",
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

/**
 * Check for OTA updates manually to catch "native_update_required"
 * @returns Response object from Capgo-compatible endpoint
 */
export async function checkOTAUpdate(): Promise<any> {
  const config = getUpdaterConfig();
  const platform = getPlatform();
  const currentVersionCode = await getCurrentVersionCode();

  try {
    const response = await axios.post(`${config.nativeApiUrl}/api/update`, {
      appId: config.appId,
      platform,
      channel: config.channel,
      versionCode: currentVersionCode.toString(),
      version_name: "builtin", // Standard for checking against baseline
    });

    return response.data;
  } catch (error) {
    console.error("[OTA] Manual check failed:", error);
    return null;
  }
}
