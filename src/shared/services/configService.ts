import { Preferences } from "@capacitor/preferences";
import { getUpdaterConfig } from "./updater/config";
import axios from "axios";
import { reactive, readonly } from "vue";

const CONFIG_STORAGE_KEY = "capucho_dynamic_config";
const APP_ID_OVERRIDE_KEY = "capucho_app_id_override";

interface ConfigState {
  config: Record<string, any>;
  isInitialized: boolean;
  activeAppId: string;
}

const state = reactive<ConfigState>({
  config: {},
  isInitialized: false,
  activeAppId: "",
});

/**
 * Configuration Service
 * Manages dynamic environment variables and client-specific settings
 */
export const configService = {
  state: readonly(state),

  /**
   * Initialize configuration
   * Call this during app boot sequence
   */
  async initialize(): Promise<void> {
    if (state.isInitialized) return;

    const updaterConfig = getUpdaterConfig();

    // Check for App ID override (Client Selector)
    const { value: overrideAppId } = await Preferences.get({
      key: APP_ID_OVERRIDE_KEY,
    });
    state.activeAppId = overrideAppId || updaterConfig.appId;

    // Load cached config first for immediate availability
    const { value: cachedConfig } = await Preferences.get({
      key: CONFIG_STORAGE_KEY,
    });
    if (cachedConfig) {
      try {
        state.config = JSON.parse(cachedConfig);
      } catch (e) {
        console.error("[ConfigService] Failed to parse cached config", e);
      }
    }

    // Mark as initialized early so UI can start using cached values
    state.isInitialized = true;

    // Fetch fresh config in background
    this.fetchFreshConfig().catch((err) => {
      console.warn("[ConfigService] Background fetch failed, using cache", err);
    });
  },

  /**
   * Fetch fresh configuration from backend
   */
  async fetchFreshConfig(): Promise<void> {
    const updaterConfig = getUpdaterConfig();
    const appId = state.activeAppId || updaterConfig.appId;

    try {
      const response = await axios.get(
        `${updaterConfig.nativeApiUrl}/api/config`,
        {
          params: { app_id: appId },
        }
      );

      const newConfig = response.data;
      state.config = newConfig;

      // Persist to storage
      await Preferences.set({
        key: CONFIG_STORAGE_KEY,
        value: JSON.stringify(newConfig),
      });

      console.log("[ConfigService] Config updated from backend", appId);
    } catch (error) {
      console.error("[ConfigService] Failed to fetch fresh config", error);
      throw error;
    }
  },

  /**
   * Get a configuration value
   */
  get<T = any>(key: string, defaultValue?: T): T {
    const value = state.config[key];
    return value !== undefined ? value : (defaultValue as T);
  },

  /**
   * Set App ID override and reload configuration
   * Used by Client Selector
   */
  async setAppIdOverride(appId: string | null): Promise<void> {
    if (appId) {
      await Preferences.set({ key: APP_ID_OVERRIDE_KEY, value: appId });
    } else {
      await Preferences.remove({ key: APP_ID_OVERRIDE_KEY });
    }

    state.activeAppId = appId || getUpdaterConfig().appId;
    await this.fetchFreshConfig();
  },
};
