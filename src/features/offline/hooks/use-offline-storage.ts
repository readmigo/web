'use client';

import { useState, useEffect, useCallback } from 'react';

export interface StorageInfo {
  used: number;
  quota: number;
  percentage: number;
}

export interface CacheInfo {
  name: string;
  size: number;
  entries: number;
}

export interface OfflineStorageState {
  isLoading: boolean;
  storageInfo: StorageInfo | null;
  caches: CacheInfo[];
  localStorageSize: number;
  totalOfflineSize: number;
  isOnline: boolean;
}

/**
 * Format bytes to human readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Hook to manage offline storage
 */
export function useOfflineStorage() {
  const [state, setState] = useState<OfflineStorageState>({
    isLoading: true,
    storageInfo: null,
    caches: [],
    localStorageSize: 0,
    totalOfflineSize: 0,
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  });

  // Calculate localStorage size
  const calculateLocalStorageSize = useCallback((): number => {
    if (typeof window === 'undefined') return 0;

    let total = 0;
    try {
      for (const key in localStorage) {
        if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
          total += localStorage[key].length * 2; // UTF-16 = 2 bytes per char
        }
      }
    } catch {
      // Ignore errors
    }
    return total;
  }, []);

  // Get cache info for a specific cache
  const getCacheInfo = useCallback(async (cacheName: string): Promise<CacheInfo> => {
    if (typeof caches === 'undefined') {
      return { name: cacheName, size: 0, entries: 0 };
    }

    try {
      const cache = await caches.open(cacheName);
      const keys = await cache.keys();
      let size = 0;

      // Estimate size by sampling responses
      const sampleSize = Math.min(keys.length, 10);
      for (let i = 0; i < sampleSize; i++) {
        const response = await cache.match(keys[i]);
        if (response) {
          const blob = await response.clone().blob();
          size += blob.size;
        }
      }

      // Extrapolate if we sampled
      if (sampleSize > 0 && keys.length > sampleSize) {
        size = Math.round((size / sampleSize) * keys.length);
      }

      return {
        name: cacheName,
        size,
        entries: keys.length,
      };
    } catch {
      return { name: cacheName, size: 0, entries: 0 };
    }
  }, []);

  // Refresh storage info
  const refreshStorageInfo = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      // Get storage estimate
      let storageInfo: StorageInfo | null = null;
      if (typeof navigator !== 'undefined' && navigator.storage?.estimate) {
        const estimate = await navigator.storage.estimate();
        const used = estimate.usage || 0;
        const quota = estimate.quota || 0;
        storageInfo = {
          used,
          quota,
          percentage: quota > 0 ? (used / quota) * 100 : 0,
        };
      }

      // Get cache info
      const cacheInfos: CacheInfo[] = [];
      if (typeof caches !== 'undefined') {
        const cacheNames = await caches.keys();
        for (const name of cacheNames) {
          const info = await getCacheInfo(name);
          cacheInfos.push(info);
        }
      }

      const localStorageSize = calculateLocalStorageSize();
      const totalCacheSize = cacheInfos.reduce((sum, c) => sum + c.size, 0);

      setState({
        isLoading: false,
        storageInfo,
        caches: cacheInfos,
        localStorageSize,
        totalOfflineSize: totalCacheSize + localStorageSize,
        isOnline: navigator.onLine,
      });
    } catch (error) {
      console.error('Failed to get storage info:', error);
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, [getCacheInfo, calculateLocalStorageSize]);

  // Clear a specific cache
  const clearCache = useCallback(async (cacheName: string) => {
    if (typeof caches === 'undefined') return;

    try {
      await caches.delete(cacheName);
      await refreshStorageInfo();
    } catch (error) {
      console.error(`Failed to clear cache ${cacheName}:`, error);
    }
  }, [refreshStorageInfo]);

  // Clear all caches
  const clearAllCaches = useCallback(async () => {
    if (typeof caches === 'undefined') return;

    try {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((name) => caches.delete(name)));
      await refreshStorageInfo();
    } catch (error) {
      console.error('Failed to clear all caches:', error);
    }
  }, [refreshStorageInfo]);

  // Clear localStorage data (except auth tokens)
  const clearLocalStorage = useCallback(() => {
    if (typeof window === 'undefined') return;

    const keysToPreserve = ['accessToken', 'refreshToken'];
    const keysToRemove: string[] = [];

    for (const key in localStorage) {
      if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
        if (!keysToPreserve.includes(key)) {
          keysToRemove.push(key);
        }
      }
    }

    keysToRemove.forEach((key) => localStorage.removeItem(key));
    refreshStorageInfo();
  }, [refreshStorageInfo]);

  // Clear all offline data
  const clearAllOfflineData = useCallback(async () => {
    await clearAllCaches();
    clearLocalStorage();
  }, [clearAllCaches, clearLocalStorage]);

  // Monitor online/offline status
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      setState((prev) => ({ ...prev, isOnline: true }));
    };

    const handleOffline = () => {
      setState((prev) => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Initial load
  useEffect(() => {
    refreshStorageInfo();
  }, [refreshStorageInfo]);

  return {
    ...state,
    refreshStorageInfo,
    clearCache,
    clearAllCaches,
    clearLocalStorage,
    clearAllOfflineData,
    formatBytes,
  };
}
