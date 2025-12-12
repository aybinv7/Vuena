/**
 * Unified Updater Composable
 * Implements "Native First" strategy: Native Check -> (fallback) -> OTA Check
 */
import { ref, computed } from "vue";
import { Capacitor } from "@capacitor/core";
import { CapacitorUpdater } from "@capgo/capacitor-updater";
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
import { openApkInstaller } from "./install.service";
import * as UI from "./ui.service";
import { getUpdaterConfig } from "./config";
import type { PluginListenerHandle } from "@capacitor/core";

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
let pluginListeners: PluginListenerHandle[] = [];

const isChecking = computed(() => state.value.checking);
const isDownloading = computed(() => state.value.downloading);
const isBlocked = computed(() => state.value.blocked);
const updateAvailable = computed(() => state.value.updateAvailable);
const progress = computed(() => state.value.progress);
const currentUpdate = computed(() => state.value.currentUpdate);

/**
 * Setup Capgo plugin event listeners
 */
async function setupPluginListeners(): Promise<void> {
  for (const listener of pluginListeners) {
    await listener.remove();
  }
  pluginListeners = [];

  const updateAvailableListener = await CapacitorUpdater.addListener(
    "updateAvailable",
    (event) => {
      console.log("[Updater] Plugin found update:", event.bundle);
      state.value.currentUpdate = {
        type: "ota",
        version: event.bundle.version,
        download_url: undefined,
        required: false,
      };
      (state.value.currentUpdate as any)._bundleId = event.bundle.id;
      state.value.updateAvailable = true;
      showUpdateDialog();
    },
  );
  pluginListeners.push(updateAvailableListener);

  const downloadListener = await CapacitorUpdater.addListener(
    "download",
    (event) => {
      state.value.downloading = true;
      state.value.progress = {
        loaded: event.percent,
        total: 100,
        percent: event.percent,
      };
    },
  );
  pluginListeners.push(downloadListener);

  const downloadCompleteListener = await CapacitorUpdater.addListener(
    "downloadComplete",
    () => {
      state.value.downloading = false;
      state.value.progress = { loaded: 100, total: 100, percent: 100 };
      UI.showToast("Update ready. Restarting...");
    },
  );
  pluginListeners.push(downloadCompleteListener);

  const downloadFailedListener = await CapacitorUpdater.addListener(
    "downloadFailed",
    () => {
      state.value.downloading = false;
      state.value.error = "Download failed";
      if (state.value.downloading) {
        UI.showToast("Update download failed");
      }
    },
  );
  pluginListeners.push(downloadFailedListener);

  const updateFailedListener = await CapacitorUpdater.addListener(
    "updateFailed",
    () => {
      state.value.error = "Update failed, reverted";
      if (state.value.downloading || state.value.checking) {
        UI.showToast("Update failed, reverted to previous version");
      }
    },
  );
  pluginListeners.push(updateFailedListener);

  const appReadyListener = await CapacitorUpdater.addListener(
    "appReady",
    () => {
      console.log("[Updater] App ready confirmed");
    },
  );
  pluginListeners.push(appReadyListener);
}

/**
 * Check for updates (Native first, then OTA fallback)
 * @param silent - If true, don't show dialogs
 */
async function check(silent = false): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  state.value.checking = true;
  state.value.error = null;
  state.value.statusMessage = "Checking for updates...";

  try {
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
      return;
    }

    await notifyAppReady();
    const otaUpdate = await checkOTAUpdate();

    if (otaUpdate) {
      console.log("[Updater] OTA update found:", otaUpdate.version);
      state.value.currentUpdate = {
        type: "ota",
        version: otaUpdate.version,
        download_url: otaUpdate.url,
        required: false,
      };
      (state.value.currentUpdate as any)._rawOTA = otaUpdate;
      state.value.updateAvailable = true;
      if (!silent) showUpdateDialog();
    } else {
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

function showUpdateDialog(): void {
  // Reactive state is used by <UpdatePrompt /> component
}

/**
 * Clean all APK files from cache directory
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
  onProgress?: (progress: DownloadProgress) => void,
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
    update.type === "native" ? "Downloading APK..." : "Downloading Bundle...";

  if (update.type === "native") {
    await cleanApkCache();
  }

  try {
    if (update.type === "native") {
      const path = await downloadApkWithProgress(update, (p) => {
        state.value.progress = p;
      });

      if (path) {
        UI.showInstallPrompt(
          () => installNative(path, update),
          () => {
            if (update.required) state.value.blocked = true;
          },
        );
      }
    } else {
      const bundleId = (update as any)._bundleId;
      const rawOTA = (update as any)._rawOTA as OTAUpdateResponse | undefined;

      if (bundleId) {
        await CapacitorUpdater.set({ id: bundleId });
        UI.showToast("Update ready. Restarting...");
        setTimeout(() => window.location.reload(), 1000);
      } else if (rawOTA) {
        await downloadOTAUpdate(rawOTA, (percent) => {
          state.value.progress = { loaded: percent, total: 100, percent };
        });
        UI.showToast("Update ready. Restarting...");
        setTimeout(() => window.location.reload(), 1000);
      } else {
        throw new Error("No OTA update data available");
      }
    }
  } catch (error) {
    state.value.error = (error as Error).message;
    UI.showToast("Download failed: " + (error as Error).message);
  } finally {
    state.value.downloading = false;
    state.value.statusMessage = "";
  }
}

async function installNative(path: string, update: UpdateInfo): Promise<void> {
  try {
    await openApkInstaller(path);
    await logUpdateEvent("install", update);

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
        cleanupError,
      );
    }
  } catch (error) {
    state.value.error = "Installation failed";
    UI.showToast("Installation failed: " + (error as Error).message);
  }
}

/**
 * Initialize updater on app start
 */
async function init(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  await setupPluginListeners();
  await notifyAppReady();

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

async function cleanup() {
  if (checkInterval) clearInterval(checkInterval);
  for (const listener of pluginListeners) {
    await listener.remove();
  }
  pluginListeners = [];
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
    check,
    startDownload,
    init,
    cleanup,
  };
}
