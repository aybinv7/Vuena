/**
 * APK Install Service
 * Handles opening the APK installer on Android
 */
import { FileOpener } from "@capawesome-team/capacitor-file-opener";
import { Capacitor } from "@capacitor/core";

/**
 * Open Android APK installer
 * @param apkPath - Path to downloaded APK file
 */
export async function openApkInstaller(apkPath: string): Promise<void> {
  if (Capacitor.getPlatform() !== "android") {
    throw new Error("APK installation is only supported on Android");
  }

  console.log("[Install] Opening APK:", apkPath);

  try {
    await FileOpener.openFile({
      path: apkPath,
      mimeType: "application/vnd.android.package-archive",
    });
  } catch (error: any) {
    console.error("[Install] Failed to open APK:", error);

    if (
      error.message?.includes("No Activity found") ||
      error.message?.includes("No app found")
    ) {
      throw new Error(
        "Enable 'Install from Unknown Sources' for this app in Settings > Security"
      );
    } else if (
      error.message?.includes("Permission denied") ||
      error.message?.includes("permission")
    ) {
      throw new Error(
        "Permission denied. Enable 'Install from Unknown Sources' in Settings"
      );
    } else if (
      error.message?.includes("File not found") ||
      error.message?.includes("ENOENT")
    ) {
      throw new Error("APK file not found. Download may have failed.");
    } else {
      throw new Error(
        `Failed to open APK: ${error.message || "Unknown error"}`
      );
    }
  }
}

/**
 * Verify that installation completed successfully
 * @param expectedVersionCode - Expected version code after install
 * @param getCurrentVersionCode - Function to get current version
 */
export async function verifyInstallation(
  expectedVersionCode: number,
  getCurrentVersionCode: () => Promise<number>
): Promise<boolean> {
  try {
    const currentVersionCode = await getCurrentVersionCode();
    const success = currentVersionCode >= expectedVersionCode;

    console.log(
      `[Install] Verification: ${currentVersionCode} >= ${expectedVersionCode} = ${success}`
    );

    return success;
  } catch (error) {
    console.error("[Install] Failed to verify:", error);
    return false;
  }
}

/**
 * Get human-readable install instructions
 */
export function getInstallInstructions(): string {
  return `To install the update:

1. Open Settings on your device
2. Go to Security (or Apps & notifications)
3. Enable "Install unknown apps" for this app
4. Return here and try the update again`;
}

/**
 * Check install permission status
 */
export async function checkInstallPermission(): Promise<{
  granted: boolean;
  message: string;
}> {
  return {
    granted: true,
    message: "Install permission will be requested when installing",
  };
}
