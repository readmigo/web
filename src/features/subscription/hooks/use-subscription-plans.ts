'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import type { SubscriptionPeriod, SubscriptionPlan } from '../types';

/**
 * Fallback plans used when the API is unavailable.
 * Mirrors the pricing previously hardcoded in paywall-view.tsx.
 */
const FALLBACK_PLANS: SubscriptionPlan[] = [
  {
    id: 'weekly',
    priceDisplay: '$2.99',
    hasTrial: false,
    isBestValue: false,
  },
  {
    id: 'monthly',
    priceDisplay: '¥38',
    pricePerMonth: '¥38',
    hasTrial: true,
    isBestValue: false,
  },
  {
    id: 'yearly',
    priceDisplay: '¥198',
    pricePerMonth: '¥16.5',
    savings: '48%',
    hasTrial: true,
    isBestValue: true,
  },
];

/**
 * Query hook for fetching available subscription plans with live pricing.
 * Falls back to hardcoded plans if the API is unavailable.
 */
export function useSubscriptionPlans() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['subscription', 'plans'],
    queryFn: async () => {
      const res = await apiClient.get<{ plans: SubscriptionPlan[] }>('/subscriptions/plans', {
        noRedirectOn401: true,
      });
      return res.plans;
    },
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });

  const plans = isError || !data || data.length === 0 ? FALLBACK_PLANS : data;

  return {
    plans,
    isLoading,
    isError,
  };
}

export type { SubscriptionPeriod };
