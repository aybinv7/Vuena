import type { CapacitorConfig } from "@capacitor/cli";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(__dirname, ".env.local") });
dotenv.config({ path: path.join(__dirname, ".env") });

const isLiveReload = process.env.VITE_LIVE_RELOAD === "true";

const getLiveReloadUrl = (): string | undefined => {
  if (!isLiveReload) return undefined;

  const scheme = process.env.VITE_LIVE_RELOAD_SCHEME ?? "http";
  const host = process.env.VITE_LIVE_RELOAD_HOST ?? "localhost";
  const port = process.env.VITE_LIVE_RELOAD_PORT ?? "5173";

  return `${scheme}://${host}:${port}`;
};

const config: CapacitorConfig = {
  appId: process.env.VITE_APP_ID ?? "io.aybinv7.vuena",
  appName: process.env.VITE_APP_NAME ?? "Vuena",
  webDir: "dist",
  server: {
    url: getLiveReloadUrl(),
    cleartext: isLiveReload,
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
      launchAutoHide: true,
      backgroundColor: "#ffffff",
    },

    Keyboard: {
      resize: "body",
      resizeOnFullScreen: true,
    },

    CapacitorUpdater: {
      autoUpdate: false,
      allowModifyUrl: true,
      updateUrl: process.env.VITE_UPDATE_API_URL
        ? `${process.env.VITE_UPDATE_API_URL}/api/update`
        : "",
      statsUrl: process.env.VITE_UPDATE_API_URL
        ? `${process.env.VITE_UPDATE_API_URL}/api/stats`
        : "",
      channelUrl: process.env.VITE_UPDATE_API_URL
        ? `${process.env.VITE_UPDATE_API_URL}/api/channel`
        : "",
      defaultChannel: "staging",
      directUpdate: "always",
      appReadyTimeout: 10000,
      maxVersions: 3,
    },
  },

  cordova: {},
};

export default config;
