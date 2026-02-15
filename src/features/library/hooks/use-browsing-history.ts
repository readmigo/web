'use client';

import { useCallback, useSyncExternalStore } from 'react';

export interface BrowsingHistoryItem {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
}

const STORAGE_KEY = 'readmigo-browsing-history';
const MAX_ITEMS = 20;

let listeners: Array<() => void> = [];

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

function getSnapshot(): BrowsingHistoryItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function getServerSnapshot(): BrowsingHistoryItem[] {
  return [];
}

function subscribe(listener: () => void) {
  listeners = [...listeners, listener];
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

function persist(items: BrowsingHistoryItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // localStorage may be full or unavailable
  }
  emitChange();
}

export function useBrowsingHistory() {
  const history = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const addToHistory = useCallback((item: BrowsingHistoryItem) => {
    const current = getSnapshot();
    // Remove duplicate if already exists
    const filtered = current.filter((h) => h.id !== item.id);
    // Prepend to front, limit to MAX_ITEMS
    const updated = [item, ...filtered].slice(0, MAX_ITEMS);
    persist(updated);
  }, []);

  const removeFromHistory = useCallback((bookId: string) => {
    const current = getSnapshot();
    const updated = current.filter((h) => h.id !== bookId);
    persist(updated);
  }, []);

  const clearHistory = useCallback(() => {
    persist([]);
  }, []);

  return {
    history,
    addToHistory,
    removeFromHistory,
    clearHistory,
  };
}
