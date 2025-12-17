import OpenReplay from "@openreplay/tracker";
import trackerAssist from "@openreplay/tracker-assist";
import { Capacitor } from "@capacitor/core";
import { Device } from "@capacitor/device";
import { Network } from "@capacitor/network";
import type { StartOptions } from "node_modules/@openreplay/tracker/dist/lib/main/app";

export interface OpenReplayOptions {
  enabled?: boolean;
  projectKey?: string;
  ingestPoint?: string;
  userConsent?: boolean;
  assetsBaseUrl?: string;
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
    assetsBaseUrl,
  } = options;

  const isEnabled = import.meta.env.VITE_OPENREPLAY_ENABLED || enabled;
  const isNative = Capacitor.isNativePlatform();
  const platform = Capacitor.getPlatform();

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

  const finalAssetsBaseUrl =
    import.meta.env.VITE_ASSETS_BASE_URL ||
    assetsBaseUrl ||
    "https://vuena.onrender.com";

  try {
    if (!userConsent) {
      console.warn(
        "User consent for OpenReplay is not granted. Skipping initialization."
      );
      return;
    }

    // Base configuration for all platforms
    const trackerConfig: any = {
      projectKey: finalProjectKey,
      ...(finalIngestPoint && { ingestPoint: finalIngestPoint }),
      obscureTextEmails: true,
      captureExceptions: true,
      respectDoNotTrack: false,
      __DISABLE_SECURE_MODE: true,
    };

    // Platform-specific configurations
    if (isNative) {
      console.log("Configuring OpenReplay for native platform:", platform);
      console.log("Assets base URL:", finalAssetsBaseUrl);

      // Native-specific settings
      Object.assign(trackerConfig, {
        // Critical for Capacitor apps
        resourceBaseHref: finalAssetsBaseUrl,

        // Disable features that don't work well in native
        capturePerformance: false,
        capturePageLoadTimings: false,
        captureResourceTimings: false,
        capturePageRenderTimings: false,

        // Canvas capture - can be problematic in native
        canvas: false,

        // Network capture
        network: {
          capturePayload: true,
          captureInIframes: true,
          ignoreHeaders: ["Cookie", "Set-Cookie", "Authorization"], // Security
          sessionTokenHeader: false,
        },

        // Console and errors
        consoleMethods: ["log", "info", "warn", "error"],
        consoleThrottling: 30,
      });
    } else {
      console.log("Configuring OpenReplay for web platform");

      // Web-specific settings
      Object.assign(trackerConfig, {
        capturePerformance: true,
        capturePageLoadTimings: true,
        captureResourceTimings: true,

        canvas: {
          __save_canvas_locally: true,
          fileExt: "avif",
          useAnimationFrame: false,
        },

        network: {
          capturePayload: true,
          captureInIframes: true,
        },
      });
    }

    // Initialize tracker
    trackerInstance = new OpenReplay(trackerConfig);

    // Get device info and user data
    const deviceInfo = await getDeviceInfo();
    const authStore = useAuthStore();
    const { user } = storeToRefs(authStore);

    // Start options
    const startOptions: StartOptions = {
      userID: user.value?.id || "anonymous",
      metadata: {
        platform: platform,
        isNative: isNative.toString(),
        appVersion: import.meta.env.VITE_APP_VERSION || "1.0.0",
        environment: import.meta.env.MODE || "production",
        ...deviceInfo,
      } as StartOptions["metadata"],
    };

    // Start tracking
    const started = await trackerInstance.start(startOptions);

    if (!started) {
      console.error("OpenReplay failed to start");
      return;
    }

    console.log("OpenReplay started successfully", {
      platform,
      isNative,
      userId: startOptions.userID,
    });

    // Add assist plugin
    trackerInstance.use(trackerAssist());

    // Provide to Vue app
    app.provide("$openReplay", trackerInstance);

    // Enhanced error handler
    const originalErrorHandler = app.config.errorHandler;
    app.config.errorHandler = (err: any, instance: any, info: string) => {
      try {
        const componentName =
          instance?.$options?.__name ||
          instance?.type?.__name ||
          instance?.$options?.name ||
          "Unknown";

        const currentRoute = f7?.views?.current?.router?.currentRoute;

        if (currentRoute) {
          const routeJson = JSON.stringify({
            name: currentRoute.name,
            params: currentRoute.params,
            path: currentRoute.path,
          });

          if (trackerInstance) {
            trackerInstance.setMetadata("vue_component", componentName);
            trackerInstance.setMetadata("current_route", routeJson);
            trackerInstance.setMetadata("error_info", info);

            // Track the error as an event
            trackerInstance.event("vue_error", {
              component: componentName,
              route: currentRoute.name,
              error: err?.message || String(err),
            });
          }
        }
      } catch (metadataError) {
        console.error("Error setting OpenReplay metadata:", metadataError);
      }

      if (originalErrorHandler) {
        originalErrorHandler(err, instance, info);
      } else {
        console.error("Vue Error:", err, info);
      }
    };

    // Optional: Add network state listener for native
    if (isNative) {
      Network.addListener("networkStatusChange", (status) => {
        trackerInstance?.event("network_status_change", {
          connected: status.connected,
          connectionType: status.connectionType,
        });
      });
    }
  } catch (error) {
    console.error("Failed to initialize OpenReplay tracker:", error);
    trackerInstance = null;
  }
};

// Export tracker instance
export const getOpenReplayTracker = () => trackerInstance;

// Utility function to track custom events
export const trackEvent = (
  eventName: string,
  payload?: Record<string, any>
) => {
  if (trackerInstance) {
    trackerInstance.event(eventName, payload);
  }
};

// Utility function to identify user
export const identifyUser = (
  userId: string,
  metadata?: Record<string, any>
) => {
  if (trackerInstance) {
    trackerInstance.setUserID(userId);
    if (metadata) {
      Object.entries(metadata).forEach(([key, value]) => {
        trackerInstance?.setMetadata(key, String(value));
      });
    }
  }
};

export default openReplay;
