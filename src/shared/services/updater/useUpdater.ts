/**
 * Unified Updater Composable
 * Implements "Native First" strategy:
 * 1. Check for native updates first (APK/IPA) - BLOCKS OTA if found
 * 2. OTA updates are handled automatically by Capgo plugin
 *
 * Key behaviors:
 * - Native updates must be installed before OTA updates proceed
 * - Plugin's auto-update is blocked until notifyAppReady() is called
 * - We only call notifyAppReady() when no native update is pending
 */
import { ref, computed } from "vue";
import { Capacitor } from "@capacitor/core";
import { CapacitorUpdater } from "@capgo/capacitor-updater";
import { FileTransfer } from "@capacitor/file-transfer";
import { Filesystem, Directory } from "@capacitor/filesystem";
import type { UpdateState, UpdateInfo, DownloadProgress } from "./types";
import {
  checkNativeUpdate,
  logUpdateEvent,
  getCurrentVersionCode,
  checkOTAUpdate,
} from "./api.service";
import { notifyAppReady, getCurrentBundle } from "./ota.service";
import { cleanupOldApks } from "./download.service";
import { openApkInstaller } from "./install.service";
import * as UI from "./ui.service";
import type { PluginListenerHandle } from "@capacitor/core";

// Global state
const state = ref<UpdateState>({
  checking: false,
  downloading: false,
  progress: { loaded: 0, total: 0, percent: 0 },
  blocked: false,
  updateAvailable: false,
  currentUpdate: null,
  error: null,
  statusMessage: "",
});

// Track if native update is pending (blocks OTA)
const nativeUpdatePending = ref(false);

let pluginListeners: PluginListenerHandle[] = [];

// Computed properties
const isChecking = computed(() => state.value.checking);
const isDownloading = computed(() => state.value.downloading);
const isBlocked = computed(() => state.value.blocked);
const updateAvailable = computed(() => state.value.updateAvailable);
const progress = computed(() => state.value.progress);
const currentUpdate = computed(() => state.value.currentUpdate);

/**
 * Setup Capgo plugin event listeners for OTA updates
 * These fire when the plugin auto-detects updates
 */
async function setupPluginListeners(): Promise<void> {
  // Clean up existing listeners
  for (const listener of pluginListeners) {
    await listener.remove();
  }
  pluginListeners = [];

  // Plugin found an OTA update
  const updateAvailableListener = await CapacitorUpdater.addListener(
    "updateAvailable",
    (event) => {
      console.log(
        "[Updater] Plugin detected OTA update:",
        event.bundle.version
      );

      // Only process if no native update is pending
      if (!nativeUpdatePending.value) {
        state.value.currentUpdate = {
          type: "ota",
          version: event.bundle.version,
          download_url: undefined,
          required: false,
        };
        (state.value.currentUpdate as any)._bundleId = event.bundle.id;
        state.value.updateAvailable = true;
      } else {
        console.log("[Updater] Ignoring OTA - native update pending");
      }
    }
  );
  pluginListeners.push(updateAvailableListener);

  // Download progress
  const downloadListener = await CapacitorUpdater.addListener(
    "download",
    (event) => {
      state.value.downloading = true;
      state.value.progress = {
        loaded: event.percent,
        total: 100,
        percent: event.percent,
      };
    }
  );
  pluginListeners.push(downloadListener);

  // Download completed
  const downloadCompleteListener = await CapacitorUpdater.addListener(
    "downloadComplete",
    (bundle) => {
      console.log("[Updater] OTA download complete:", bundle);
      state.value.downloading = false;
      state.value.progress = { loaded: 100, total: 100, percent: 100 };
      // UI.showToast("Update downloaded. Restarting...");
    }
  );
  pluginListeners.push(downloadCompleteListener);

  // Download failed
  const downloadFailedListener = await CapacitorUpdater.addListener(
    "downloadFailed",
    (info) => {
      console.error("[Updater] OTA download failed:", info);
      state.value.downloading = false;
      state.value.error = "Download failed";
      // UI.showToast("Update download failed");
    }
  );
  pluginListeners.push(downloadFailedListener);

  // Update failed (rollback happened)
  const updateFailedListener = await CapacitorUpdater.addListener(
    "updateFailed",
    (info) => {
      console.error("[Updater] Update failed, rolled back:", info);
      state.value.error = "Update failed, reverted to previous version";
      // UI.showToast("Update failed, reverted to previous version");
    }
  );
  pluginListeners.push(updateFailedListener);

  // App ready confirmed
  const appReadyListener = await CapacitorUpdater.addListener(
    "appReady",
    () => {
      console.log("[Updater] App ready confirmed by plugin");
    }
  );
  pluginListeners.push(appReadyListener);
}

/**
 * Check for updates - Native First strategy
 * Only checks for native updates; OTA is handled by plugin automatically
 * @param silent - If true, don't show dialogs for "no updates"
 */
async function check(silent = false): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  state.value.checking = true;
  state.value.error = null;
  state.value.statusMessage = "Checking for updates...";

  try {
    // SINGLE SOURCE OF TRUTH: Check backend for the definitive update decision
    // The backend now compares Native vs OTA and decides what's best.
    const otaResponse = await checkOTAUpdate();

    if (!otaResponse) {
      console.log("[Updater] No response from update server.");
      return;
    }

    // Case 1: BACKEND SAYS NATIVE IS REQUIRED OR PRIORITY
    // This happens if message is 'native_update_required' OR 'update_available' + native_update is present
    if (otaResponse.native_update) {
      const isPriority = otaResponse.message === "update_available";
      const isRequired = otaResponse.message === "native_update_required";

      console.log(
        `[Updater] Backend prioritized native update (${isPriority ? "priority" : "required"}):`,
        otaResponse.native_update.version_name
      );

      const updateObj: UpdateInfo = {
        type: "native",
        version: otaResponse.native_update.version_name,
        version_code: otaResponse.native_update.version_code,
        download_url: otaResponse.native_update.download_url,
        release_notes: otaResponse.native_update.release_notes,
        required: isRequired || (otaResponse.native_update.required ?? false),
        platform: otaResponse.native_update.platform,
      };

      nativeUpdatePending.value = true;
      state.value.currentUpdate = updateObj;
      state.value.updateAvailable = true;
      await logUpdateEvent("check", updateObj);
      return;
    }

    // Case 2: Pure OTA update
    if (
      otaResponse.message === "update_available" &&
      !otaResponse.native_update
    ) {
      console.log("[Updater] OTA update available. Plugin auto-handling.");
      // We keep nativeUpdatePending false to let the plugin proceed
      nativeUpdatePending.value = false;

      // We don't necessarily show the prompt for OTA here because the plugin
      // usually downloads it in the background. But if we want a manual prompt:
      /*
      state.value.currentUpdate = {
        type: 'bundle',
        version: otaResponse.version_name || 'unknown',
        required: otaResponse.required || false,
        release_notes: otaResponse.release_notes
      };
      state.value.updateAvailable = true;
      */
      return;
    }

    // Case 3: No update
    nativeUpdatePending.value = false;
    if (!state.value.updateAvailable) {
      state.value.currentUpdate = null;
    }
  } catch (error) {
    state.value.error = (error as Error).message;
    console.error("[Updater] Check failed:", error);
  } finally {
    state.value.checking = false;
    state.value.statusMessage = "";
  }
}

/**
 * Clean APK cache
 */
async function cleanApkCache(): Promise<void> {
  try {
    const { files } = await Filesystem.readdir({
      path: "",
      directory: Directory.Cache,
    });

    for (const file of files) {
      if (file.name.endsWith(".apk")) {
        await Filesystem.deleteFile({
          path: file.name,
          directory: Directory.Cache,
        });
      }
    }
  } catch (error) {
    console.error("[Cleanup] Failed to clean APK cache:", error);
  }
}

/**
 * Download APK with progress tracking
 */
async function downloadApkWithProgress(
  update: UpdateInfo,
  onProgress?: (progress: DownloadProgress) => void
): Promise<string> {
  if (!Capacitor.isNativePlatform()) {
    throw new Error("APK downloads only supported on native");
  }

  await cleanApkCache();

  const fileName = `app-v${update.version}-${update.version_code}.apk`;

  const fileInfo = await Filesystem.getUri({
    directory: Directory.Cache,
    path: fileName,
  });

  let progressListener: any = null;
  if (onProgress) {
    progressListener = await FileTransfer.addListener("progress", (p) => {
      if (p.url === update.download_url) {
        const percent = p.lengthComputable
          ? Math.round((p.bytes / p.contentLength) * 100)
          : 0;
        onProgress({ loaded: p.bytes, total: p.contentLength, percent });
      }
    });
  }

  if (!update.download_url) throw new Error("Missing download URL");

  const result = await FileTransfer.downloadFile({
    url: update.download_url,
    path: fileInfo.uri,
    progress: !!onProgress,
    connectTimeout: 60000,
    readTimeout: 300000,
  });

  if (progressListener) await progressListener.remove();

  await logUpdateEvent("download", update, { path: result.path });
  return result.path ?? "";
}

/**
 * Start download based on update type
 */
async function startDownload(): Promise<void> {
  const update = state.value.currentUpdate;
  if (!update) return;

  state.value.downloading = true;
  state.value.error = null;
  state.value.statusMessage =
    update.type === "native" ? "Downloading APK..." : "Installing update...";

  try {
    if (update.type === "native") {
      // Native APK download
      await cleanApkCache();

      const path = await downloadApkWithProgress(update, (p) => {
        state.value.progress = p;
      });

      if (path) {
        UI.showInstallPrompt(
          () => installNative(path, update),
          () => {
            if (update.required) state.value.blocked = true;
          }
        );
      }
    } else {
      // OTA update - plugin already downloaded, just apply
      const bundleId = (update as any)._bundleId;

      if (bundleId) {
        await CapacitorUpdater.set({ id: bundleId });
        // UI.showToast("Update ready. Restarting...");
        setTimeout(() => window.location.reload(), 1000);
      } else {
        // Fallback: trigger plugin to download and apply
        // UI.showToast("Applying update...");
        await CapacitorUpdater.reload();
      }
    }
  } catch (error) {
    state.value.error = (error as Error).message;
    // UI.showToast("Download failed: " + (error as Error).message);
  } finally {
    state.value.downloading = false;
    state.value.statusMessage = "";
  }
}

/**
 * Install native APK
 */
async function installNative(path: string, update: UpdateInfo): Promise<void> {
  try {
    await openApkInstaller(path);
    await logUpdateEvent("install", update);

    // Cleanup APK after install attempt
    try {
      const cleanPath = path.replace("file://", "").replace("content://", "");
      const pathParts = cleanPath.split("/").filter((part) => part.length > 0);
      const fileName = pathParts[pathParts.length - 1];
      if (fileName && fileName.endsWith(".apk")) {
        await Filesystem.deleteFile({
          path: fileName,
          directory: Directory.Cache,
        });
      }
    } catch (cleanupError) {
      console.warn(
        "[Cleanup] Failed to delete APK after installation:",
        cleanupError
      );
    }
  } catch (error) {
    state.value.error = "Installation failed";
    // UI.showToast("Installation failed: " + (error as Error).message);
  }
}

/**
 * Initialize updater on app start
 * Key: Only enable OTA if no native update pending
 */
async function init(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  console.log("[Updater] Initializing...");

  try {
    // Check backend for definitive update decision
    const otaResponse = await checkOTAUpdate();

    if (otaResponse?.native_update) {
      const isPriority = otaResponse.message === "update_available";
      const isRequired = otaResponse.message === "native_update_required";

      console.log(
        `[Updater] Native update prioritized during init (${isPriority ? "priority" : "required"}):`,
        otaResponse.native_update.version_name
      );

      const updateObj: UpdateInfo = {
        type: "native",
        version: otaResponse.native_update.version_name,
        version_code: otaResponse.native_update.version_code,
        download_url: otaResponse.native_update.download_url,
        release_notes: otaResponse.native_update.release_notes,
        required: isRequired || (otaResponse.native_update.required ?? false),
        platform: otaResponse.native_update.platform,
      };

      nativeUpdatePending.value = true;
      state.value.currentUpdate = updateObj;
      state.value.updateAvailable = true;
      console.log("[Updater] OTA blocked until native update handled");
      return;
    }
  } catch (error) {
    console.error("[Updater] Init failed to check backend:", error);
  }

  // Step 2: Safe to enable OTA auto-updates
  nativeUpdatePending.value = false;
  await setupPluginListeners();
  await notifyAppReady();

  // Cleanup old APKs
  const code = await getCurrentVersionCode();
  await cleanupOldApks(code);

  console.log("[Updater] Initialized. OTA auto-update enabled.");
}

/**
 * Cleanup on unmount
 */
async function cleanup(): Promise<void> {
  for (const listener of pluginListeners) {
    await listener.remove();
  }
  pluginListeners = [];
}

/**
 * Dismiss update dialog (for non-required updates)
 */
function dismissUpdate(): void {
  if (!state.value.currentUpdate?.required) {
    state.value.updateAvailable = false;
    state.value.currentUpdate = null;
  }
}

/**
 * Get current bundle info for display
 */
async function getBundleInfo() {
  return await getCurrentBundle();
}

export function useUpdater() {
  return {
    state,
    isChecking,
    isDownloading,
    isBlocked,
    updateAvailable,
    currentUpdate,
    progress,
    nativeUpdatePending,
    check,
    startDownload,
    init,
    cleanup,
    dismissUpdate,
    getBundleInfo,
  };
}
