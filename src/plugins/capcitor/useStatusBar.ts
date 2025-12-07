import { Capacitor } from "@capacitor/core";
import { StatusBar } from "@capacitor/status-bar";
import type Framework7 from "framework7";

export const useStatusBar = async (f7: Framework7) => {
  if (!Capacitor.isNativePlatform()) {
    return;
  }
  StatusBar.setOverlaysWebView({ overlay: true });

  const statusBarHeight = (await StatusBar.getInfo()) as any;

  document.documentElement.style.setProperty(
    "--f7-safe-area-top",
    `${statusBarHeight.height}px`
  );
};
