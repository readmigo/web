'use client';

import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { apiClient } from '@/lib/api/client';
import { useSubscriptionStore, FREE_DAILY_AUDIO_LIMIT_SECONDS } from '../stores/subscription-store';
import type { SubscriptionState } from '../types';

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function useSubscription() {
  // Use individual selectors to avoid subscribing to the entire store object.
  // Subscribing without a selector caused React #185 errors because Zustand's
  // synchronous re-render during setLoading propagated the full store object
  // through the React reconciler.
  const tier = useSubscriptionStore((s) => s.tier);
  const status = useSubscriptionStore((s) => s.status);
  const isActive = useSubscriptionStore((s) => s.isActive);
  const expiresAt = useSubscriptionStore((s) => s.expiresAt);
  const trialEnd = useSubscriptionStore((s) => s.trialEnd);
  const willRenew = useSubscriptionStore((s) => s.willRenew);
  const storeIsLoading = useSubscriptionStore((s) => s.isLoading);
  const dailyAudioSeconds = useSubscriptionStore((s) => s.dailyAudioSeconds);
  const dailyAudioDate = useSubscriptionStore((s) => s.dailyAudioDate);
  const setLoading = useSubscriptionStore((s) => s.setLoading);
  const setSubscription = useSubscriptionStore((s) => s.setSubscription);
  const resetDailyAudioUsage = useSubscriptionStore((s) => s.resetDailyAudioUsage);

  const { data, isLoading } = useQuery({
    queryKey: ['subscription', 'status'],
    queryFn: async () => {
      const res = await apiClient.get<{ subscription: SubscriptionState }>('/subscriptions/status');
      return res.subscription;
    },
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  useEffect(() => {
    setLoading(isLoading);
  }, [isLoading, setLoading]);

  useEffect(() => {
    if (data) {
      setSubscription(data);
    }
  }, [data, setSubscription]);

  const isPro = tier === 'PRO' || tier === 'PREMIUM';

  // Auto-reset daily audio counter when the date changes
  useEffect(() => {
    if (!isPro && dailyAudioDate !== todayISO()) {
      resetDailyAudioUsage();
    }
  }, [isPro, dailyAudioDate, resetDailyAudioUsage]);

  const canUseAudio =
    isPro || dailyAudioSeconds < FREE_DAILY_AUDIO_LIMIT_SECONDS;

  return {
    tier,
    isActive,
    isPro,
    status,
    expiresAt,
    trialEnd,
    willRenew,
    isLoading: storeIsLoading,
    canUseAudio,
    dailyAudioSeconds,
    dailyAudioRemainingSeconds: isPro
      ? Infinity
      : Math.max(0, FREE_DAILY_AUDIO_LIMIT_SECONDS - dailyAudioSeconds),
  };
}
