'use client';

import { useEffect, useRef } from 'react';
import { updateActivity } from '../api/client';

/**
 * Hook for tracking user activity and updating lastActiveAt
 *
 * Features:
 * - Updates activity on mount
 * - Updates activity when page becomes visible (tab switch)
 * - Updates activity every 5 minutes while page is active
 * - Uses local debouncing to prevent excessive API calls
 */
export function useActivityTracker() {
  const lastUpdateRef = useRef<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const MINIMUM_INTERVAL = 5 * 60 * 1000; // 5 minutes

    const performUpdate = async () => {
      const now = Date.now();
      const elapsed = now - lastUpdateRef.current;

      // Skip if updated recently (local debouncing)
      if (elapsed < MINIMUM_INTERVAL) {
        return;
      }

      try {
        await updateActivity();
        lastUpdateRef.current = now;
      } catch (error) {
        // Silent fail
        console.debug('Activity update failed:', error);
      }
    };

    // Update on mount
    performUpdate();

    // Update when page becomes visible (user switches back to tab)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        performUpdate();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Update every 5 minutes while page is active
    intervalRef.current = setInterval(() => {
      if (!document.hidden) {
        performUpdate();
      }
    }, MINIMUM_INTERVAL);

    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);
}
