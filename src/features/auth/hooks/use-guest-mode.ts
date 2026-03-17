'use client';

import { useState, useCallback, useEffect } from 'react';

const GUEST_MODE_KEY = 'readmigo_guest_mode';
const GUEST_HISTORY_KEY = 'readmigo_guest_history';

export interface GuestHistoryItem {
  bookId: string;
  title: string;
  visitedAt: number;
}

function readGuestMode(): boolean {
  if (typeof localStorage === 'undefined') return false;
  return localStorage.getItem(GUEST_MODE_KEY) === 'true';
}

function readGuestHistory(): GuestHistoryItem[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(GUEST_HISTORY_KEY);
    if (raw) return JSON.parse(raw) as GuestHistoryItem[];
  } catch {
    /* ignore */
  }
  return [];
}

/**
 * Manages guest mode state and browsing history.
 * Aligned with iOS GuestModeManager.
 *
 * - enterGuestMode(): sets localStorage flag and activates guest session
 * - exitGuestMode(): clears flag on login (history is preserved)
 * - addGuestHistory(): records a book the guest visited
 */
export function useGuestMode() {
  const [isGuest, setIsGuest] = useState<boolean>(() => readGuestMode());
  const [guestHistory, setGuestHistory] = useState<GuestHistoryItem[]>(() =>
    readGuestHistory(),
  );

  // Sync across tabs / windows
  useEffect(() => {
    function handleStorage(event: StorageEvent) {
      if (event.key === GUEST_MODE_KEY) {
        setIsGuest(event.newValue === 'true');
      }
      if (event.key === GUEST_HISTORY_KEY) {
        setGuestHistory(readGuestHistory());
      }
    }
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const enterGuestMode = useCallback(() => {
    localStorage.setItem(GUEST_MODE_KEY, 'true');
    setIsGuest(true);
  }, []);

  /**
   * Called after a successful login.
   * Clears the guest flag but keeps browsing history in localStorage
   * so it remains accessible if the user later returns without an account.
   */
  const exitGuestMode = useCallback(() => {
    localStorage.removeItem(GUEST_MODE_KEY);
    setIsGuest(false);
  }, []);

  const addGuestHistory = useCallback((item: Omit<GuestHistoryItem, 'visitedAt'>) => {
    setGuestHistory((prev) => {
      const filtered = prev.filter((h) => h.bookId !== item.bookId);
      const next: GuestHistoryItem[] = [
        { ...item, visitedAt: Date.now() },
        ...filtered,
      ].slice(0, 50); // keep last 50 items
      localStorage.setItem(GUEST_HISTORY_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const clearGuestHistory = useCallback(() => {
    localStorage.removeItem(GUEST_HISTORY_KEY);
    setGuestHistory([]);
  }, []);

  return {
    isGuest,
    guestHistory,
    enterGuestMode,
    exitGuestMode,
    addGuestHistory,
    clearGuestHistory,
  };
}
