'use client';

import { useState, useEffect, useCallback } from 'react';

const DEFAULT_STORAGE_KEY = 'readmigo-search-history';
const MAX_HISTORY = 20;

function loadHistory(storageKey: string): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        return parsed.filter((item): item is string => typeof item === 'string');
      }
    }
  } catch {
    // Ignore parse errors
  }
  return [];
}

function saveHistory(storageKey: string, history: string[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(storageKey, JSON.stringify(history));
  } catch {
    // Ignore storage errors (e.g., quota exceeded)
  }
}

interface UseSearchHistoryOptions {
  storageKey?: string;
  maxHistory?: number;
}

export function useSearchHistory(options: UseSearchHistoryOptions = {}) {
  const { storageKey = DEFAULT_STORAGE_KEY, maxHistory = MAX_HISTORY } = options;
  const [history, setHistory] = useState<string[]>([]);

  // Load history from localStorage on mount
  useEffect(() => {
    setHistory(loadHistory(storageKey));
  }, [storageKey]);

  const addSearch = useCallback(
    (query: string) => {
      const trimmed = query.trim();
      if (!trimmed) return;

      setHistory((prev) => {
        // Remove duplicate if exists, then prepend
        const filtered = prev.filter(
          (item) => item.toLowerCase() !== trimmed.toLowerCase()
        );
        const updated = [trimmed, ...filtered].slice(0, maxHistory);
        saveHistory(storageKey, updated);
        return updated;
      });
    },
    [storageKey, maxHistory]
  );

  const removeSearch = useCallback(
    (query: string) => {
      setHistory((prev) => {
        const updated = prev.filter(
          (item) => item.toLowerCase() !== query.toLowerCase()
        );
        saveHistory(storageKey, updated);
        return updated;
      });
    },
    [storageKey]
  );

  const clearHistory = useCallback(() => {
    setHistory([]);
    saveHistory(storageKey, []);
  }, [storageKey]);

  return { history, addSearch, removeSearch, clearHistory };
}
