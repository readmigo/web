'use client';

import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { apiClient } from '@/lib/api/client';
import { useSubscriptionStore } from '../stores/subscription-store';
import type { SubscriptionState } from '../types';

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

  return {
    tier: store.tier,
    isActive: store.isActive,
    isPro: store.tier === 'PRO' || store.tier === 'PREMIUM',
    status: store.status,
    expiresAt: store.expiresAt,
    willRenew: store.willRenew,
    isLoading: store.isLoading,
  };
}
