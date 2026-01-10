/**
 * Update Types
 */

export interface OTAUpdateResponse {
  version: string;
  url: string;
  checksum?: string;
  sessionKey?: string;
  message?: string;
  error?: string;
  manifest?: Array<{
    file_name: string;
    file_hash: string;
    download_url: string;
  }>;
}

export type UpdateType = "native" | "ota";

export interface UpdateInfo {
  type: UpdateType;
  version: string;
  version_code?: number;
  download_url?: string;
  release_notes?: string;
  required: boolean;
  platform?: "android" | "ios";
  file_size?: number;
}

export interface DownloadProgress {
  loaded: number;
  total: number;
  percent: number;
}

export interface UpdateState {
  checking: boolean;
  downloading: boolean;
  progress: DownloadProgress;
  blocked: boolean;
  updateAvailable: boolean;
  currentUpdate: UpdateInfo | null;
  error: string | null;
  statusMessage: string;
  cachedPath?: string | null;
}

export const UPDATE_CHANNELS = ["dev", "staging", "prod"] as const;
export type UpdateChannel = (typeof UPDATE_CHANNELS)[number];

export const UPDATE_ENVIRONMENTS = ["dev", "staging", "prod"] as const;
export type UpdateEnvironment = (typeof UPDATE_ENVIRONMENTS)[number];
