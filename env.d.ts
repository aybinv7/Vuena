/// <reference types="vite/client" />

import type { LogLevel } from "kysely";

declare module "framework7/lite-bundle";
declare module "framework7-vue/bundle";
declare module "./js/capacitor-app.js";

// env variables
interface ImportMetaEnv {
  readonly VITE_APP_NAME: string;
  readonly VITE_APP_VERSION: string;

  readonly VITE_DB_FILENAME: string;
  readonly VITE_DB_LOG_LEVEL: LogLevel;

  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_POWERSYNC_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
