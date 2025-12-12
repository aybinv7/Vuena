/**
 * Updater Configuration
 * 
 * Native API URL: For checking APK/IPA updates (handled by JS)
 * OTA updates are handled automatically by Capgo plugin via capacitor.config.ts
 */

export interface UpdaterConfig {
  /** Backend URL for native update check API */
  nativeApiUrl: string;
  
  /** App bundle ID (e.g., com.example.app) */
  appId: string;
  
  /** Platform (android/ios) */
  platform: "android" | "ios";
  
  /** Update channel (production, beta, staging) */
  channel: string;
  
  /** Environment (prod, staging, dev) */
  environment: string;
  
  /** Show update dialogs to user */
  showDialogs: boolean;
}

export const DEFAULT_CONFIG: UpdaterConfig = {
  nativeApiUrl:
    import.meta.env.VITE_UPDATE_API_URL ||
    "https://capgo-updater-back.onrender.com",
  appId: import.meta.env.VITE_APP_ID || "",
  platform: "android",
  channel: import.meta.env.VITE_UPDATE_CHANNEL || "stable",
  environment:
    import.meta.env.VITE_ENVIRONMENT ||
    (import.meta.env.PROD ? "production" : "staging"),
  showDialogs: true,
};

export function getUpdaterConfig(): UpdaterConfig {
  return {
    ...DEFAULT_CONFIG,
  };
}
