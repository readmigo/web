/**
 * clearUserData — called on sign-out to wipe user-specific cached data.
 *
 * Keys cleared:
 *   reader-storage         — Zustand persist: bookStats, highlights, bookmarks,
 *                            translationStates (all user-specific reading data)
 *   readmigo_subscription  — Zustand persist: tier, usage, expiry
 *   readmigo-offline-books — offline store metadata (downloaded book list)
 *   readmigo-offline-settings — offline preferences tied to the account
 *
 * Keys intentionally preserved:
 *   NEXT_LOCALE            — language preference (applies to all visitors)
 *   readmigo_device_id     — anonymous device identifier used for session tracking
 *   readmigo_guest_mode    — guest flag (managed separately by useGuestMode)
 *   readmigo_guest_history — guest browsing history (public data, not user-owned)
 *   readmigo-offline-queue — pending session uploads; flushed after re-login
 *   readmigo-pending-sessions — same as above
 */

const USER_STORAGE_KEYS = [
  'reader-storage',
  'readmigo_subscription',
  'readmigo-offline-books',
  'readmigo-offline-settings',
] as const;

export function clearUserData(): void {
  if (typeof localStorage === 'undefined') return;

  for (const key of USER_STORAGE_KEYS) {
    localStorage.removeItem(key);
  }
}
