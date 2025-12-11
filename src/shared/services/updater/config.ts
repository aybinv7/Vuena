export interface UpdaterConfig {
  nativeApiUrl: string;
  otaApiUrl: string;

  appId: string;
  platform: "android" | "ios";

  channel: string;
  environment: string;
  checkInterval: number;
  autoCheck: boolean;
  showDialogs: boolean;
}

export const DEFAULT_CONFIG: UpdaterConfig = {
  nativeApiUrl:
    import.meta.env.VITE_UPDATE_API_URL ||
    "https://capgo-updater-back.onrender.com",
  otaApiUrl:
    import.meta.env.VITE_UPDATE_API_URL ||
    "https://capgo-updater-back.onrender.com",
  appId: import.meta.env.VITE_APP_ID || "",
  platform: "android",
  channel: import.meta.env.VITE_UPDATE_CHANNEL || "stable",
  environment:
    import.meta.env.VITE_ENVIRONMENT ||
    (import.meta.env.PROD ? "production" : "staging"),
  checkInterval: 60 * 60 * 1000,
  autoCheck: true,
  showDialogs: true,
};

export function getUpdaterConfig(): UpdaterConfig {
  return {
    ...DEFAULT_CONFIG,
  };
}
