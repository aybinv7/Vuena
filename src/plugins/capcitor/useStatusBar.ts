import { Capacitor } from "@capacitor/core";
import { StatusBar } from "@capacitor/status-bar";
import type Framework7 from "framework7";

export const useStatusBar = (f7: Framework7) => {
  if (!Capacitor.isNativePlatform()) {
    return;
  }
  StatusBar.setOverlaysWebView({ overlay: true });
};
