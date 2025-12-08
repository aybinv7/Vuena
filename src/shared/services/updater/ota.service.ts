// OTA Service Wrapper
// Encapsulates interaction with @capgo/capacitor-updater
import { CapacitorUpdater } from "@capgo/capacitor-updater";
import { App } from "@capacitor/app";
import { Device } from "@capacitor/device";
import { getUpdaterConfig } from "./config";
import type { OTAUpdateResponse } from "./types";
import axios from "axios";

/**
 * Notify plugin that app is ready
 * Critical for rollback protection
 */
export async function notifyAppReady(): Promise<void> {
  try {
    await CapacitorUpdater.notifyAppReady();
    console.log("[OTA] App marked as ready");
  } catch (error) {
    console.warn("[OTA] Failed to notify app ready:", error);
  }
}

/**
 * Check for OTA updates via backend
 */
export async function checkOTAUpdate(): Promise<OTAUpdateResponse | null> {
  const config = getUpdaterConfig();

  try {
    // 1. Get Device Info
    const appInfo = await App.getInfo();
    const deviceInfo = await Device.getInfo();
    const deviceId = (await Device.getId()).identifier;

    // 2. Call Backend API (POST /api/update)
    console.log("[OTA] Checking for updates...", {
      url: `${config.otaApiUrl}/api/update`,
      version: appInfo.version,
      channel: config.channel,
    });

    const { data } = await axios.post<OTAUpdateResponse>(
      `${config.otaApiUrl}/api/update`,
      {
        appId: appInfo.id,
        platform: deviceInfo.platform,
        version: appInfo.version,
        deviceId: deviceId,
        channel: config.channel,
        // custom_id: ... if needed
      }
    );

    // 3. Validate Response
    if (data.version && data.url) {
      console.log(`[OTA] Update found: v${data.version}`);
      return data;
    }

    console.log("[OTA] No update available");
    return null;
  } catch (error) {
    console.error("[OTA] Check failed:", error);
    return null;
  }
}

/**
 * Download and Schedule OTA Update
 */
export async function downloadOTAUpdate(
  update: OTAUpdateResponse,
  onProgress?: (percent: number) => void
): Promise<void> {
  try {
    console.log("[OTA] Starting download:", update.version);

    // Download via plugin
    const version = await CapacitorUpdater.download({
      url: update.url,
      version: update.version,
      checksum: update.checksum,
    });

    console.log("[OTA] Download complete:", version);
    if (onProgress) onProgress(100);

    // Schedule install for next restart
    await CapacitorUpdater.set(version);
    console.log("[OTA] Update scheduled for next restart");
  } catch (error) {
    console.error("[OTA] Download failed:", error);
    throw error;
  }
}
