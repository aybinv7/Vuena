import OpenReplay from "@openreplay/tracker";
import trackerAssist from "@openreplay/tracker-assist";
import { Capacitor } from "@capacitor/core";
import { Device } from "@capacitor/device";
import { Network } from "@capacitor/network";
import trackerVuex from "@openreplay/tracker-vuex";
import type { StartOptions } from "node_modules/@openreplay/tracker/dist/lib/main/app";
import { trackedStores } from "@/config/tracked-stores";

export interface OpenReplayOptions {
  enabled?: boolean;
  projectKey?: string;
  ingestPoint?: string;
  userConsent?: boolean;
}

let trackerInstance: OpenReplay | null = null;

async function getDeviceInfo() {
  try {
    const deviceInfo = await Device.getInfo();
    const batteryInfo = await Device.getBatteryInfo();
    const networkStatus = await Network.getStatus();

    return {
      model: deviceInfo.model ?? "",
      platform: deviceInfo.platform,
      operatingSystem: deviceInfo.operatingSystem,
      osVersion: deviceInfo.osVersion,
      manufacturer: deviceInfo.manufacturer,
      isVirtual: deviceInfo.isVirtual.toString(),
      webViewVersion: deviceInfo.webViewVersion,
      memUsed: deviceInfo.memUsed?.toString() ?? "",
      batteryLevel: batteryInfo.batteryLevel?.toString() ?? "",
      isCharging: batteryInfo.isCharging?.toString() ?? "",
      networkConnection: networkStatus.connectionType,
      networkConnected: networkStatus.connected?.toString() ?? "",
    };
  } catch (error) {
    console.warn("Failed to get device info for OpenReplay:", error);
    return {};
  }
}

const openReplay = async function openReplay(
  app: any,
  options: OpenReplayOptions = {}
): Promise<void> {
  const {
    enabled = false,
    projectKey = "",
    ingestPoint,
    userConsent = true,
  } = options;

  const isEnabled = import.meta.env.VITE_OPENREPLAY_ENABLED || enabled;
  const isNative = Capacitor.isNativePlatform();

  if (!isEnabled) {
    console.warn(
      "OpenReplay is disabled via VITE_OPENREPLAY_ENABLED or options."
    );
    return;
  }

  const finalProjectKey =
    import.meta.env.VITE_OPENREPLAY_PROJECT_KEY || projectKey;
  if (!finalProjectKey) {
    console.error(
      "OpenReplay project key is required. Set VITE_OPENREPLAY_PROJECT_KEY or provide it in options."
    );
    return;
  }

  const finalIngestPoint =
    import.meta.env.VITE_OPENREPLAY_INGEST_POINT || ingestPoint;

  try {
    if (!userConsent) {
      console.warn(
        "User consent for OpenReplay is not granted. Skipping initialization."
      );
      return;
    }

    const trackerConfig: any = {
      __DISABLE_SECURE_MODE: true,
      projectKey: finalProjectKey,
      // ...(finalIngestPoint && { ingestPoint: finalIngestPoint }),
      capturePerformance: true,
      obscureTextEmails: true,
      captureExceptions: true,
      canvas: {
        __save_canvas_locally: true,
        fileExt: "avif",
        useAnimationFrame: false,
      },
      capturePageLoadTimings: true,
      network: {
        capturePayload: true,
        // axiosInstances: [getClientApi()],
      },
    };

    if (isNative) {
      trackerConfig.resourceBaseHref =
        import.meta.env.VITE_OPENREPLAY_ASSETS_CDN ||
        "https://cdn.statically.io/gh/inventor7/Vuena@assets/";
    }

    trackerInstance = new OpenReplay(trackerConfig);

    // --- Pinia Tracking Integration ---
    const vuexPlugin = trackerInstance.use(trackerVuex());

    // Auto-track configured stores
    Object.entries(trackedStores).forEach(([name, useStore]) => {
      try {
        const store = useStore();
        const wrapper = vuexPlugin(name);
        wrapper(store);
        console.log(`OpenReplay: Tracking store '${name}'`);
      } catch (err) {
        console.warn(
          `OpenReplay: Failed to track store '${name}'. Ensure Pinia is installed.`,
          err
        );
      }
    });
    // ----------------------------------

    const deviceInfo = await getDeviceInfo();
    const authStore = useAuthStore();
    const { user } = storeToRefs(authStore);

    const startOptions: StartOptions = {
      userID: user.value?.id,
      metadata: {
        platform: Capacitor.getPlatform(),
        ...deviceInfo,
      } as StartOptions["metadata"],
    };

    trackerInstance?.start(startOptions);

    trackerInstance.use(trackerAssist());
    app.provide("$openReplay", trackerInstance);

    const originalErrorHandler = app.config.errorHandler;
    app.config.errorHandler = (err: any, instance: any, info: string) => {
      const componentName =
        instance?.$options.__name || instance?.type?.__name || "Unknown";
      const currentRoute = f7.views.current.router.currentRoute.name;
      const routeJson = JSON.stringify({
        name: currentRoute,
        params: f7.views.current.router.currentRoute.params,
        path: f7.views.current.router.currentRoute.path,
      });

      if (trackerInstance) {
        trackerInstance.setMetadata("vue_component", componentName);
        trackerInstance.setMetadata("current_route", routeJson);
      }
      if (originalErrorHandler) {
        originalErrorHandler(err, instance, info);
      }
    };
  } catch (error) {
    console.error("Failed to initialize OpenReplay tracker:", error);
    trackerInstance = null;
  }
};

export const openReplayTracker = trackerInstance;

export default openReplay;
