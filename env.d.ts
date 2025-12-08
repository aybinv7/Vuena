/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_NAME: string;
  readonly VITE_APP_ID: string;
  readonly VITE_APP_VERSION: string;
  readonly VITE_LIVE_RELOAD: string;
  readonly VITE_LIVE_RELOAD_SCHEME: string;
  readonly VITE_LIVE_RELOAD_HOST: string;
  readonly VITE_LIVE_RELOAD_PORT: string;
  readonly VITE_POWERSYNC_URL: string;
  readonly VITE_DB_FILENAME: string;
  readonly VITE_DB_LOG_LEVEL: string;
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_POWERSYNC_DEBUG: string;
  readonly VITE_POWERSYNC_TOKEN_DASHBOARD: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module "framework7/lite-bundle";
declare module "framework7-vue/bundle";
declare module "./js/capacitor-app.js";
