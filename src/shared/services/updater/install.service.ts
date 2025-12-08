import { FileOpener } from "@capawesome-team/capacitor-file-opener";
import { Capacitor } from "@capacitor/core";

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
        "Cannot open APK installer. Please enable 'Install from Unknown Sources' " +
          "for this app in your device Settings > Security."
      );
    } else if (
      error.message?.includes("Permission denied") ||
      error.message?.includes("permission")
    ) {
      throw new Error(
        "Permission denied. Please enable 'Install from Unknown Sources' in Settings."
      );
    } else if (
      error.message?.includes("File not found") ||
      error.message?.includes("ENOENT")
    ) {
      throw new Error(
        "APK file not found. The download may have failed or been deleted."
      );
    } else {
      throw new Error(
        `Failed to open APK installer: ${error.message || "Unknown error"}. ` +
          "Please ensure 'Install from Unknown Sources' is enabled."
      );
    }
  }
}

export async function verifyInstallation(
  expectedVersionCode: number,
  getCurrentVersionCode: () => Promise<number>
): Promise<boolean> {
  try {
    const currentVersionCode = await getCurrentVersionCode();
    const success = currentVersionCode >= expectedVersionCode;

    if (success) {
      console.log(
        `[Install] Installation verified: ${currentVersionCode} >= ${expectedVersionCode}`
      );
    } else {
      console.log(
        `[Install] Installation not verified: ${currentVersionCode} < ${expectedVersionCode}`
      );
    }

    return success;
  } catch (error) {
    console.error("[Install] Failed to verify installation:", error);
    return false;
  }
}

export function getInstallInstructions(): string {
  return `
To install the update:

1. Open Settings on your device
2. Go to Security (or Apps & notifications)
3. Enable "Install unknown apps" or "Install from Unknown Sources"
4. Select this app and allow it to install apps
5. Return here and try the update again

Note: Steps may vary by device manufacturer.
  `.trim();
}

export async function checkInstallPermission(): Promise<{
  granted: boolean;
  message: string;
}> {
  return {
    granted: true,
    message: "Install permission will be requested when installing the update.",
  };
}
