/**
 * Update UI Service
 * Framework7 dialogs and toasts for update prompts
 */
import { f7 } from "framework7-vue";
import type { UpdateInfo, DownloadProgress } from "./types";

/**
 * Show optional update dialog with "Later" and "Update" buttons
 */
export function showOptionalUpdateDialog(
  update: UpdateInfo,
  onUpdate: () => void,
  onLater: () => void
): void {
  f7.dialog
    .create({
      title: "📦 Update Available",
      text: `
        <div class="update-dialog-content">
          <p><strong>Version ${update.version}</strong></p>
          <p class="text-color-gray">Size: ${formatSize(update.file_size)}</p>
          ${update.release_notes ? `<p class="margin-top">${update.release_notes}</p>` : ""}
        </div>
      `,
      buttons: [
        { text: "Later", color: "gray", onClick: onLater },
        { text: "Update", strong: true, onClick: onUpdate },
      ],
      closeByBackdropClick: true,
    })
    .open();
}

/**
 * Show mandatory update dialog (cannot dismiss)
 */
export function showMandatoryUpdateDialog(
  update: UpdateInfo,
  onUpdate: () => void
): void {
  f7.dialog
    .create({
      title: "⚠️ Required Update",
      text: `
        <div class="update-dialog-content">
          <p><strong>Version ${update.version}</strong></p>
          <p class="text-color-gray">Size: ${formatSize(update.file_size)}</p>
          ${update.release_notes ? `<p class="margin-top">${update.release_notes}</p>` : ""}
          <p class="text-color-red margin-top"><strong>This update is required.</strong></p>
        </div>
      `,
      buttons: [{ text: "Update Now", strong: true, onClick: onUpdate }],
      closeByBackdropClick: false,
    })
    .open();
}

/**
 * Show download progress dialog
 * @returns Object with update() and close() methods
 */
export function showDownloadProgress(): {
  update: (progress: DownloadProgress) => void;
  close: () => void;
} {
  const dialog = f7.dialog.progress("Downloading Update...", 0);

  return {
    update: (progress: DownloadProgress) => {
      dialog.setProgress(progress.percent);
      dialog.setText(`${progress.percent}%`);
    },
    close: () => dialog.close(),
  };
}

/**
 * Show install confirmation prompt
 */
export function showInstallPrompt(
  onInstall: () => void,
  onCancel: () => void
): void {
  f7.dialog.confirm(
    "Download complete! Install now?",
    "Install Update",
    onInstall,
    onCancel
  );
}

/**
 * Show blocked screen for mandatory updates
 */
export function showBlockedScreen(onRetry: () => void): void {
  f7.dialog
    .create({
      title: "⛔ Update Required",
      text: `
        <div class="text-align-center">
          <p>You must update to continue.</p>
          <p class="text-color-gray margin-top">Your data is saved.</p>
        </div>
      `,
      buttons: [{ text: "Install Update", strong: true, onClick: onRetry }],
      closeByBackdropClick: false,
    })
    .open();
}

/**
 * Show centered toast message
 */
export function showToast(message: string): void {
  f7.toast
    .create({
      text: message,
      position: "center",
      closeTimeout: 2000,
    })
    .open();
}

function formatSize(bytes?: number): string {
  if (!bytes) return "Unknown size";
  const mb = bytes / 1024 / 1024;
  return `${mb.toFixed(1)} MB`;
}
