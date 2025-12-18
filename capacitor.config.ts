import type { CapacitorConfig } from "@capacitor/cli";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { KeyboardResize } from "@capacitor/keyboard";

dotenv.config({ path: path.join(__dirname, ".env.local") });
dotenv.config({ path: path.join(__dirname, ".env") });

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
  appId: process.env.VITE_APP_ID,
  appName: process.env.VITE_APP_NAME,
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
      resize: KeyboardResize.Native,
      resizeOnFullScreen: true,
    },

    CapacitorUpdater: {
      autoUpdate: true,
      allowModifyUrl: true,
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
      directUpdate: false,
      appReadyTimeout: 10000,
      responseTimeout: 30000,
    },
  },

  cordova: {},
};

export default config;
