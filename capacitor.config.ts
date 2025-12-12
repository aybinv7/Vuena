import type { CapacitorConfig } from "@capacitor/cli";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

// Load environment files
dotenv.config({ path: path.join(__dirname, ".env.local") });
dotenv.config({ path: path.join(__dirname, ".env") });

// Read version from package.json (single source of truth)
const packageJson = JSON.parse(
  fs.readFileSync(path.join(__dirname, "package.json"), "utf8")
);
const appVersion = packageJson.version;

const isLiveReload = process.env.VITE_LIVE_RELOAD === "true";

const getLiveReloadUrl = (): string | undefined => {
  if (!isLiveReload) return undefined;

  const scheme = process.env.VITE_LIVE_RELOAD_SCHEME ?? "http";
  const host = process.env.VITE_LIVE_RELOAD_HOST ?? "localhost";
  const port = process.env.VITE_LIVE_RELOAD_PORT ?? "5173";

  return `${scheme}://${host}:${port}`;
};

const config: CapacitorConfig = {
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
      autoUpdate: true,
      allowModifyUrl: true,
      disableAutoUpdateUnderNative: true, // Prevent OTA if native update needed
      updateUrl: process.env.VITE_UPDATE_API_URL
        ? `${process.env.VITE_UPDATE_API_URL}/api/update`
        : "",
      statsUrl: process.env.VITE_UPDATE_API_URL
        ? `${process.env.VITE_UPDATE_API_URL}/api/stats`
        : "",
      channelUrl: process.env.VITE_UPDATE_API_URL
        ? `${process.env.VITE_UPDATE_API_URL}/api/channel_self`
        : "",
      defaultChannel: process.env.VITE_UPDATE_CHANNEL ?? "staging",
      version: appVersion,
      directUpdate: false, // Changed: Show dialog instead of auto-apply
      appReadyTimeout: 10000,
      responseTimeout: 30000,
      maxVersions: 3,
    },
  },

  cordova: {},
};

export default config;
