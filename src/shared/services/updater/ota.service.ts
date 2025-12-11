/**
 * OTA Service
 * Wrapper for @capgo/capacitor-updater plugin
 * Plugin handles ALL API communication internally
 */
import { CapacitorUpdater } from "@capgo/capacitor-updater";
import type { OTAUpdateResponse } from "./types";

/**
 * Notify plugin that app is ready
 * Critical for rollback protection - must be called after app loads
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
 * Check for OTA updates via plugin's internal method
 * Plugin calls configured updateUrl with correct headers/body
 * @returns Update response if available, null otherwise
 */
export async function checkOTAUpdate(): Promise<OTAUpdateResponse | null> {
  try {
    const result = await CapacitorUpdater.getLatest();

    if (result.url && result.version) {
      console.log(`[OTA] Update found: v${result.version}`);
      return {
        version: result.version,
        url: result.url,
        checksum: result.checksum,
        sessionKey: result.sessionKey,
      };
    }

    if (result.error) {
      console.log("[OTA] Server response:", result.message || result.error);
      return null;
    }

    console.log("[OTA] No update available");
    return null;
  } catch (error) {
    console.error("[OTA] Check failed:", error);
    return null;
  }
}

/**
 * Download and schedule OTA update
 * Plugin handles checksums, encryption, etc.
 * @param update - Update info from checkOTAUpdate
 * @param onProgress - Optional progress callback (0-100)
 */
export async function downloadOTAUpdate(
  update: OTAUpdateResponse,
  onProgress?: (percent: number) => void
): Promise<void> {
  try {
    console.log("[OTA] Starting download:", update.version);

    const bundle = await CapacitorUpdater.download({
      url: update.url,
      version: update.version,
      checksum: update.checksum,
      sessionKey: update.sessionKey,
    });

    console.log("[OTA] Download complete:", bundle);
    if (onProgress) onProgress(100);

    await CapacitorUpdater.set(bundle);
    console.log("[OTA] Update scheduled for next restart");
  } catch (error) {
    console.error("[OTA] Download failed:", error);
    throw error;
  }
}

/**
 * Get currently active bundle info
 */
export async function getCurrentBundle() {
  try {
    return await CapacitorUpdater.current();
  } catch (error) {
    console.error("[OTA] Failed to get current bundle:", error);
    return null;
  }
}

/**
 * List all downloaded bundles
 */
export async function listBundles() {
  try {
    return await CapacitorUpdater.list();
  } catch (error) {
    console.error("[OTA] Failed to list bundles:", error);
    return { bundles: [] };
  }
}

/**
 * Delete a specific bundle by ID
 */
export async function deleteBundle(id: string) {
  try {
    await CapacitorUpdater.delete({ id });
    console.log("[OTA] Bundle deleted:", id);
  } catch (error) {
    console.error("[OTA] Failed to delete bundle:", error);
  }
}

/**
 * Reset to the built-in bundle
 */
export async function resetToBuiltin() {
  try {
    await CapacitorUpdater.reset();
    console.log("[OTA] Reset to builtin bundle");
  } catch (error) {
    console.error("[OTA] Failed to reset:", error);
  }
}
