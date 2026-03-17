// MARK: - Download Status

export type DownloadStatus =
  | 'not_downloaded'
  | 'queued'
  | 'downloading'
  | 'paused'
  | 'completed'
  | 'failed';

// i18n keys for download status labels — use offline.status* keys via useTranslations('offline')
export const DOWNLOAD_STATUS_LABEL: Record<DownloadStatus, string> = {
  not_downloaded: 'offline.statusNotDownloaded',
  queued: 'offline.statusQueued',
  downloading: 'offline.statusDownloading',
  paused: 'offline.statusPaused',
  completed: 'offline.statusCompleted',
  failed: 'offline.statusFailed',
};

// MARK: - Downloaded Book

export interface DownloadedBook {
  id: string;
  bookId: string;
  title: string;
  author: string;
  coverUrl?: string;
  totalChapters: number;
  downloadedChapters: number;
  totalSizeBytes: number;
  downloadedSizeBytes: number;
  status: DownloadStatus;
  priority: number;
  downloadStartedAt?: number; // timestamp
  downloadCompletedAt?: number;
  lastAccessedAt?: number;
  expiresAt?: number;
  errorMessage?: string;
}

// MARK: - Download Task

export interface DownloadTask {
  id: string;
  bookId: string;
  chapterId: string;
  status: DownloadStatus;
  retryCount: number;
  errorMessage?: string;
}

// MARK: - Offline Settings

export type DownloadQuality = 'low' | 'medium' | 'high';

export interface OfflineSettings {
  autoDownloadEnabled: boolean;
  downloadOnWifiOnly: boolean;
  maxStorageMB: number; // 0 = unlimited
  autoDeleteAfterDays: number; // 0 = never
  predownloadNextChapters: number;
  downloadQuality: DownloadQuality;
}

export const DEFAULT_OFFLINE_SETTINGS: OfflineSettings = {
  autoDownloadEnabled: true,
  downloadOnWifiOnly: true,
  maxStorageMB: 1000, // 1GB
  autoDeleteAfterDays: 30,
  predownloadNextChapters: 3,
  downloadQuality: 'high',
};

// MARK: - Storage Info

export interface OfflineStorageInfo {
  used: number;
  quota: number;
  percentage: number;
  offlineContentSize: number;
}
