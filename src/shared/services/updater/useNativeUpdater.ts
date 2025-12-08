// Native Updater Composable
// Orchestrates all update services
import { ref, computed, onMounted, onUnmounted } from "vue";
import { Capacitor } from "@capacitor/core";
import type { UpdateInfo, UpdateState, DownloadProgress } from "./types";
import {
  checkNativeUpdate,
  getCurrentVersionCode,
  logUpdateEvent,
} from "./api.service";
import { downloadApk, cleanupOldApks } from "./download.service";
import { openApkInstaller, verifyInstallation } from "./install.service";
import * as UI from "./ui.service";
import { getUpdaterConfig } from "./config";

// Shared state
const state = ref<UpdateState>({
  checking: false,
  downloading: false,
  progress: { loaded: 0, total: 0, percent: 0 },
  blocked: false,
  cachedPath: null,
  error: null,
  statusMessage: "",
  updateAvailable: false,
  currentUpdate: null,
});

const currentUpdate = ref<UpdateInfo | null>(null);
let checkInterval: ReturnType<typeof setInterval> | null = null;

// Computed
const updateAvailable = computed(() => currentUpdate.value !== null);
const isMandatory = computed(() => currentUpdate.value?.required ?? false);
const isBlocked = computed(() => state.value.blocked);
const isDownloading = computed(() => state.value.downloading);
const progress = computed(() => state.value.progress);

/**
 * Check for updates
 */
async function check(silent = false): Promise<UpdateInfo | null> {
  if (!Capacitor.isNativePlatform()) return null;

  state.value.checking = true;
  state.value.error = null;

  try {
    const result = await checkNativeUpdate();

    if (result) {
      currentUpdate.value = result;
      await logUpdateEvent("check", result);

      if (!silent) {
        showUpdateDialog();
      }

      return result;
    }

    currentUpdate.value = null;
    return null;
  } catch (error) {
    state.value.error = (error as Error).message;
    console.error("[Updater] Check failed:", error);
    return null;
  } finally {
    state.value.checking = false;
  }
}

/**
 * Show update dialog based on update type
 */
function showUpdateDialog(): void {
  if (!currentUpdate.value) return;

  if (currentUpdate.value.required) {
    UI.showMandatoryUpdateDialog(currentUpdate.value, () => startDownload());
  } else {
    UI.showOptionalUpdateDialog(
      currentUpdate.value,
      () => startDownload(),
      () => logUpdateEvent("cancel", currentUpdate.value)
    );
  }
}

/**
 * Start download with progress UI
 */
async function startDownload(): Promise<void> {
  if (!currentUpdate.value) return;

  state.value.downloading = true;
  const progressUI = UI.showDownloadProgress();

  try {
    const path = await downloadApk(
      currentUpdate.value,
      (p: DownloadProgress) => {
        state.value.progress = p;
        progressUI.update(p);
      }
    );

    progressUI.close();

    if (path) {
      state.value.cachedPath = path;
      await logUpdateEvent("download", currentUpdate.value);
      promptInstall();
    }
  } catch (error) {
    progressUI.close();
    state.value.error = (error as Error).message;
    await logUpdateEvent("error", currentUpdate.value, {
      error: (error as Error).message,
    });

    UI.showToast("Download failed. Please try again.");

    if (isMandatory.value) {
      UI.showBlockedScreen(() => startDownload());
    }
  } finally {
    state.value.downloading = false;
  }
}

/**
 * Prompt user to install
 */
function promptInstall(): void {
  UI.showInstallPrompt(
    () => install(),
    () => {
      if (isMandatory.value) {
        state.value.blocked = true;
        UI.showBlockedScreen(() => install());
      }
    }
  );
}

/**
 * Open installer
 */
async function install(): Promise<void> {
  if (!state.value.cachedPath || !currentUpdate.value) return;

  try {
    await openApkInstaller(state.value.cachedPath);
    await logUpdateEvent("install", currentUpdate.value);

    // Check if installation completed after a delay
    setTimeout(async () => {
      if (!currentUpdate.value || !currentUpdate.value?.version_code)
        return console.error("version_code is missing");
      const success = await verifyInstallation(
        currentUpdate.value?.version_code,
        getCurrentVersionCode
      );

      if (!success && isMandatory.value) {
        state.value.blocked = true;
        UI.showBlockedScreen(() => install());
      }
    }, 2000);
  } catch (error) {
    await logUpdateEvent("error", currentUpdate.value, {
      error: (error as Error).message,
    });
    UI.showToast("Failed to open installer.");
  }
}

/**
 * Initialize updater
 */
async function init(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;

  const config = getUpdaterConfig();

  // Cleanup old APKs
  const currentVersionCode = await getCurrentVersionCode();
  await cleanupOldApks(currentVersionCode);

  // Initial check
  if (config.autoCheck) {
    await check(true);

    // If mandatory update found, show immediately
    if (currentUpdate.value?.required) {
      showUpdateDialog();
    }
  }

  // Periodic checks
  if (config.checkInterval > 0) {
    checkInterval = setInterval(() => check(true), config.checkInterval);
  }
}

/**
 * Cleanup on unmount
 */
function cleanup(): void {
  if (checkInterval) {
    clearInterval(checkInterval);
    checkInterval = null;
  }
}

/**
 * Composable export
 */
export function useNativeUpdater() {
  onMounted(() => init());
  onUnmounted(() => cleanup());

  return {
    // State
    state,
    currentUpdate,
    updateAvailable,
    isMandatory,
    isBlocked,
    isDownloading,
    progress,

    // Methods
    check,
    startDownload,
    install,
    showUpdateDialog,
  };
}
