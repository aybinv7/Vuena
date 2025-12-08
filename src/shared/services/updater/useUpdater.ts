// Unified Updater Composable
// Orchestrates Native First strategy: Native Check -> (fallback) -> OTA Check
import { ref, computed, onMounted, onUnmounted } from "vue";
import { Capacitor } from "@capacitor/core";
import { FileTransfer } from "@capacitor/file-transfer";
import { Filesystem, Directory } from "@capacitor/filesystem";
import type {
  UpdateState,
  UpdateInfo,
  OTAUpdateResponse,
  DownloadProgress,
} from "./types";
import {
  checkNativeUpdate,
  logUpdateEvent,
  getCurrentVersionCode,
} from "./api.service";
import {
  checkOTAUpdate,
  downloadOTAUpdate,
  notifyAppReady,
} from "./ota.service";
import { cleanupOldApks } from "./download.service";
import { openApkInstaller, verifyInstallation } from "./install.service";
import * as UI from "./ui.service";
import { getUpdaterConfig } from "./config";

// Global State
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

let checkInterval: ReturnType<typeof setInterval> | null = null;

// Getters
const isChecking = computed(() => state.value.checking);
const isDownloading = computed(() => state.value.downloading);
const isBlocked = computed(() => state.value.blocked);
const updateAvailable = computed(() => state.value.updateAvailable);
const progress = computed(() => state.value.progress);
const currentUpdate = computed(() => state.value.currentUpdate);

/**
 * Main Check Function
 * Implements "Native First" logic
 */
async function check(silent = false): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    console.log("[Updater] Skipping check on web");
    return;
  }

  state.value.checking = true;
  state.value.error = null;
  state.value.statusMessage = "Checking for updates...";

  try {
    // 1. Check Native Update first
    const nativeUpdate = await checkNativeUpdate();

    if (nativeUpdate) {
      console.log("[Updater] Native update found:", nativeUpdate.version);

      state.value.currentUpdate = {
        type: "native",
        version: nativeUpdate.version,
        version_code: nativeUpdate.version_code,
        download_url: nativeUpdate.download_url,
        release_notes: nativeUpdate.release_notes,
        required: nativeUpdate.required,
        platform: nativeUpdate.platform,
      };

      state.value.updateAvailable = true;
      await logUpdateEvent("check", nativeUpdate);

      if (!silent) showUpdateDialog();
      return; // STOP here if native update found
    }

    // 2. Fallback to OTA
    // Notify plugin first (vital for rollback protection)
    await notifyAppReady();

    const otaUpdate = await checkOTAUpdate();

    if (otaUpdate) {
      console.log("[Updater] OTA update found:", otaUpdate.version);

      state.value.currentUpdate = {
        type: "ota",
        version: otaUpdate.version,
        download_url: otaUpdate.url,
        required: false, // OTA usually not mandatory in this context, or add logic
      };

      // Store full response for download
      (state.value.currentUpdate as any)._rawOTA = otaUpdate;

      state.value.updateAvailable = true;

      if (!silent) showUpdateDialog();
    } else {
      console.log("[Updater] No updates available");
      state.value.currentUpdate = null;
      state.value.updateAvailable = false;
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
 * Show Dialog
 */
function showUpdateDialog(): void {
  // Logic to trigger UI component (e.g. set a flag that App.vue watches)
  // For now we rely on the reactive state being used by <UpdatePrompt />
}

/**
 * Download APK using FileTransfer plugin
 */
async function downloadApk(
  update: UpdateInfo,
  onProgress?: (progress: DownloadProgress) => void
): Promise<string> {
  if (!Capacitor.isNativePlatform()) {
    throw new Error("APK downloads are only supported on native platforms");
  }

  try {
    console.log(`[Download] Starting download: ${update.download_url}`);

    const fileName = `app-v${update.version}-${update.version_code}.apk`;

    // Get the file URI where we want to save the APK
    const fileInfo = await Filesystem.getUri({
      directory: Directory.Cache,
      path: fileName,
    });

    console.log(`[Download] Saving to: ${fileInfo.uri}`);

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

    if (!update.download_url) throw new Error("Missing download URL");

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

    console.log(`[Download] Completed: ${result.path}`);
    await logUpdateEvent("download", update, { path: result.path });

    return result.path ?? "";
  } catch (error: any) {
    console.error("[Download] Failed:", error);

    await logUpdateEvent("error", update, {
      error: error.message,
      code: error.code,
    });

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
 * Start Download
 */
async function startDownload(): Promise<void> {
  const update = state.value.currentUpdate;
  if (!update) return;

  state.value.downloading = true;
  state.value.error = null;
  state.value.statusMessage =
    update.type === "native" ? "Downloading APK..." : "Downloading Bundle...";

  try {
    if (update.type === "native") {
      const nativeUpdate: UpdateInfo = {
        type: "native",
        version: update.version,
        version_code: update.version_code!,
        download_url: update.download_url!,
        required: update.required,
        platform: update.platform!,
      };

      const path = await downloadApk(nativeUpdate, (p) => {
        state.value.progress = p;
      });

      if (path) {
        UI.showInstallPrompt(
          () => installNative(path, nativeUpdate),
          () => {
            if (update.required) state.value.blocked = true;
          }
        );
      }
    } else {
      // OTA Download
      const rawOTA = (update as any)._rawOTA as OTAUpdateResponse;
      await downloadOTAUpdate(rawOTA, (percent) => {
        state.value.progress = { loaded: percent, total: 100, percent };
      });

      // OTA is simpler - plugin handles reload on restart
      UI.showToast("Update ready. Restarting...");
      setTimeout(() => {
        // Reload app to apply OTA
        window.location.reload();
      }, 1000);
    }
  } catch (error) {
    state.value.error = (error as Error).message;
    UI.showToast("Download failed: " + (error as Error).message);
  } finally {
    state.value.downloading = false;
    state.value.statusMessage = "";
  }
}

/**
 * Install Native APK
 */
async function installNative(path: string, update: any): Promise<void> {
  try {
    await openApkInstaller(path);
    await logUpdateEvent("install", update);
  } catch (error) {
    state.value.error = "Installation failed";
    UI.showToast("Installation failed: " + (error as Error).message);
  }
}

/**
 * Initialize
 */
async function init(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  // Cleanup old APKs
  const code = await getCurrentVersionCode();
  await cleanupOldApks(code);

  const config = getUpdaterConfig();
  if (config.autoCheck) {
    await check(true);
  }

  if (config.checkInterval) {
    checkInterval = setInterval(() => check(true), config.checkInterval);
  }
}

function cleanup() {
  if (checkInterval) clearInterval(checkInterval);
}

// Composition
export function useUpdater() {
  // Single instance init if needed, or call init() from App.vue

  return {
    state,
    isChecking,
    isDownloading,
    isBlocked,
    updateAvailable,
    currentUpdate,
    progress,
    check,
    startDownload,
    init,
    cleanup,
  };
}
