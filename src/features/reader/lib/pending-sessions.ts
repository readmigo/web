/**
 * Pending sessions storage utility.
 *
 * Provides localStorage-backed persistence for reading and audiobook sessions
 * so they survive network failures, crashes, and page closures.
 *
 * Flow:
 *   1. Save to localStorage before attempting API call
 *   2. On API success, remove from localStorage
 *   3. On failure, leave in localStorage — retried on next mount or network recovery
 */

import { apiClient } from '@/lib/api/client';

const STORAGE_KEY = 'readmigo_pending_sessions';

export interface PendingSession {
  id: string;
  payload: Record<string, unknown>;
  endpoint: string; // e.g. '/reading/sessions' or '/reading/audiobook-sessions'
  createdAt: number;
  retryCount: number;
}

export function savePendingSession(session: PendingSession): void {
  const existing = getPendingSessions();
  // Replace if same ID exists (snapshot update replaces earlier snapshot)
  const filtered = existing.filter((s) => s.id !== session.id);
  filtered.push(session);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch {
    // localStorage may be full or unavailable — silently skip
  }
}

export function getPendingSessions(): PendingSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const sessions = JSON.parse(raw) as PendingSession[];
    // Drop sessions older than 30 days to keep storage lean
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    return sessions.filter((s) => s.createdAt > thirtyDaysAgo);
  } catch {
    return [];
  }
}

export function removePendingSession(id: string): void {
  const existing = getPendingSessions();
  const filtered = existing.filter((s) => s.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch {
    // Silently skip if localStorage is unavailable
  }
}

/**
 * Attempt to flush all pending sessions to the backend.
 *
 * Auth is handled transparently by apiClient via the Next.js /api/proxy route
 * (httpOnly JWT cookie) — no Bearer token needed in client code.
 *
 * Sessions that succeed (2xx or 409 Conflict = already persisted) are removed.
 * Sessions that fail due to network or server errors are left for the next retry.
 */
export async function flushPendingSessions(): Promise<void> {
  const sessions = getPendingSessions();
  if (sessions.length === 0) return;

  for (const session of sessions) {
    try {
      await apiClient.post(session.endpoint, session.payload, { noRedirectOn401: true });
      removePendingSession(session.id);
    } catch (error: unknown) {
      // 409 Conflict means the session already exists on the server — treat as success
      if (
        error &&
        typeof error === 'object' &&
        'status' in error &&
        (error as { status: number }).status === 409
      ) {
        removePendingSession(session.id);
        continue;
      }
      // Any other error (network failure, 5xx, etc.) — leave for next retry
    }
  }
}
