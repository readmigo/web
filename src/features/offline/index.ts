// Types
export type {
  DownloadStatus,
  DownloadedBook,
  DownloadTask,
  OfflineSettings,
  OfflineStorageInfo,
} from './types';
export { DEFAULT_OFFLINE_SETTINGS, DOWNLOAD_STATUS_LABEL } from './types';

// Store
export { useOfflineStore } from './stores/offline-store';

// Components
export { OfflineDownloadsCard } from './components/offline-downloads-card';
export { OfflineSettingsCard } from './components/offline-settings-card';
export { DownloadBookButton } from './components/download-book-button';

// Legacy (storage stats card kept for reference)
export { OfflineStorageCard } from './components/offline-storage-card';
export { useOfflineStorage, formatBytes } from './hooks/use-offline-storage';
export type { StorageInfo, CacheInfo, OfflineStorageState } from './hooks/use-offline-storage';
