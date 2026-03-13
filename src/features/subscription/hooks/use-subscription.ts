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
  const store = useSubscriptionStore();

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
    store.setLoading(isLoading);
  }, [isLoading, store]);

  useEffect(() => {
    if (data) {
      store.setSubscription(data);
    }
  }, [data, store]);

  const isPro = store.tier === 'PRO' || store.tier === 'PREMIUM';

  // Auto-reset daily audio counter when the date changes
  useEffect(() => {
    if (!isPro && store.dailyAudioDate !== todayISO()) {
      store.resetDailyAudioUsage();
    }
  }, [isPro, store]);

  const canUseAudio =
    isPro || store.dailyAudioSeconds < FREE_DAILY_AUDIO_LIMIT_SECONDS;

  return {
    tier: store.tier,
    isActive: store.isActive,
    isPro,
    status: store.status,
    expiresAt: store.expiresAt,
    willRenew: store.willRenew,
    isLoading: store.isLoading,
    canUseAudio,
    dailyAudioSeconds: store.dailyAudioSeconds,
    dailyAudioRemainingSeconds: isPro
      ? Infinity
      : Math.max(0, FREE_DAILY_AUDIO_LIMIT_SECONDS - store.dailyAudioSeconds),
  };
}
