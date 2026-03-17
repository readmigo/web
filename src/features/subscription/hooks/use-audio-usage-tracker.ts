'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useSubscriptionStore, FREE_DAILY_AUDIO_LIMIT_SECONDS } from '../stores/subscription-store';
import { useAudioPlayerStore } from '@/features/audiobook/stores/audio-player-store';
import type { TTSState } from '@/features/reader/hooks/use-tts';

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

interface UseAudioUsageTrackerOptions {
  /** Current TTS state from useTTS(); omit when used without TTS context. */
  ttsState?: TTSState;
  /** Called when the daily limit is reached. Use this to show AudioLimitDialog. */
  onLimitReached?: () => void;
  /** Called to pause TTS externally when limit is reached inside TTS context. */
  onPauseTTS?: () => void;
}

interface AudioUsageTrackerResult {
  dailySecondsUsed: number;
  dailyLimitSeconds: number;
  isLimitReached: boolean;
  isPro: boolean;
}

/**
 * Tracks daily audio usage for both audiobook and TTS playback.
 *
 * Design decisions:
 * - Uses Date.now() intervals (Web has no Mach Time equivalent)
 * - Accumulates every 5 seconds while playing, then settles remainder on pause/stop
 * - Pro users are entirely skipped — no intervals are started
 * - Resets the usage counter automatically when the calendar date changes
 * - Limit check is instant on each accumulation tick, not deferred to next interval
 */
export function useAudioUsageTracker(
  options: UseAudioUsageTrackerOptions = {},
): AudioUsageTrackerResult {
  const { ttsState, onLimitReached, onPauseTTS } = options;

  const tier = useSubscriptionStore((s) => s.tier);
  const status = useSubscriptionStore((s) => s.status);
  const dailyAudioSeconds = useSubscriptionStore((s) => s.dailyAudioSeconds);
  const dailyAudioDate = useSubscriptionStore((s) => s.dailyAudioDate);
  const setDailyAudioUsage = useSubscriptionStore((s) => s.setDailyAudioUsage);
  const resetDailyAudioUsage = useSubscriptionStore((s) => s.resetDailyAudioUsage);

  const audiobookIsPlaying = useAudioPlayerStore((s) => s.isPlaying);
  const pauseAudiobook = useAudioPlayerStore((s) => s.pause);

  const isPro =
    status === 'GRACE_PERIOD' || tier === 'PRO' || tier === 'PREMIUM';

  // Refs for interval bookkeeping — avoid stale closure issues
  const audiobookStartRef = useRef<number | null>(null);
  const ttsStartRef = useRef<number | null>(null);
  const audiobookIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const ttsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const limitReachedRef = useRef(false);

  // Keep stable refs for callbacks so intervals don't capture stale values
  const onLimitReachedRef = useRef(onLimitReached);
  const onPauseTTSRef = useRef(onPauseTTS);
  useEffect(() => { onLimitReachedRef.current = onLimitReached; }, [onLimitReached]);
  useEffect(() => { onPauseTTSRef.current = onPauseTTS; }, [onPauseTTS]);

  // Auto-reset when the calendar date rolls over
  useEffect(() => {
    const today = todayISO();
    if (dailyAudioDate !== today) {
      resetDailyAudioUsage();
      limitReachedRef.current = false;
    }
  }, [dailyAudioDate, resetDailyAudioUsage]);

  /**
   * Core accumulation logic called on every tick and on pause/stop.
   * Returns the updated total seconds after adding the elapsed segment.
   */
  const accumulate = useCallback(
    (startTime: number): number => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      if (elapsed <= 0) return useSubscriptionStore.getState().dailyAudioSeconds;

      const today = todayISO();
      const current = useSubscriptionStore.getState().dailyAudioSeconds;
      const updated = current + elapsed;
      setDailyAudioUsage(updated, today);
      return updated;
    },
    [setDailyAudioUsage],
  );

  /** Check limit and trigger pause + callback if exceeded. */
  const checkLimit = useCallback(
    (totalSeconds: number) => {
      if (isPro) return;
      if (limitReachedRef.current) return;
      if (totalSeconds >= FREE_DAILY_AUDIO_LIMIT_SECONDS) {
        limitReachedRef.current = true;
        pauseAudiobook();
        onPauseTTSRef.current?.();
        onLimitReachedRef.current?.();
      }
    },
    [isPro, pauseAudiobook],
  );

  // ─── Audiobook tracking ───────────────────────────────────────────────────

  useEffect(() => {
    if (isPro) return;

    if (audiobookIsPlaying) {
      // Reset limit flag only when a fresh session starts after a new day reset
      if (useSubscriptionStore.getState().dailyAudioSeconds < FREE_DAILY_AUDIO_LIMIT_SECONDS) {
        limitReachedRef.current = false;
      }

      audiobookStartRef.current = Date.now();

      audiobookIntervalRef.current = setInterval(() => {
        if (!audiobookStartRef.current) return;
        const total = accumulate(audiobookStartRef.current);
        // Reset start so next tick only counts the next 5s segment
        audiobookStartRef.current = Date.now();
        checkLimit(total);
      }, 5000);
    } else {
      // Settle remainder on pause/stop
      if (audiobookStartRef.current !== null) {
        const total = accumulate(audiobookStartRef.current);
        audiobookStartRef.current = null;
        checkLimit(total);
      }
      if (audiobookIntervalRef.current !== null) {
        clearInterval(audiobookIntervalRef.current);
        audiobookIntervalRef.current = null;
      }
    }

    return () => {
      if (audiobookIntervalRef.current !== null) {
        clearInterval(audiobookIntervalRef.current);
        audiobookIntervalRef.current = null;
      }
    };
  }, [audiobookIsPlaying, isPro, accumulate, checkLimit]);

  // ─── TTS tracking ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (isPro) return;
    if (ttsState === undefined) return;

    if (ttsState === 'playing') {
      if (useSubscriptionStore.getState().dailyAudioSeconds < FREE_DAILY_AUDIO_LIMIT_SECONDS) {
        limitReachedRef.current = false;
      }

      ttsStartRef.current = Date.now();

      ttsIntervalRef.current = setInterval(() => {
        if (!ttsStartRef.current) return;
        const total = accumulate(ttsStartRef.current);
        ttsStartRef.current = Date.now();
        checkLimit(total);
      }, 5000);
    } else {
      // Settle remainder when TTS pauses, stops, or enters loading
      if (ttsStartRef.current !== null) {
        const total = accumulate(ttsStartRef.current);
        ttsStartRef.current = null;
        checkLimit(total);
      }
      if (ttsIntervalRef.current !== null) {
        clearInterval(ttsIntervalRef.current);
        ttsIntervalRef.current = null;
      }
    }

    return () => {
      if (ttsIntervalRef.current !== null) {
        clearInterval(ttsIntervalRef.current);
        ttsIntervalRef.current = null;
      }
    };
  }, [ttsState, isPro, accumulate, checkLimit]);

  // ─── Cleanup on unmount ───────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      if (audiobookIntervalRef.current !== null) clearInterval(audiobookIntervalRef.current);
      if (ttsIntervalRef.current !== null) clearInterval(ttsIntervalRef.current);
    };
  }, []);

  return {
    dailySecondsUsed: dailyAudioSeconds,
    dailyLimitSeconds: FREE_DAILY_AUDIO_LIMIT_SECONDS,
    isLimitReached: !isPro && dailyAudioSeconds >= FREE_DAILY_AUDIO_LIMIT_SECONDS,
    isPro,
  };
}
