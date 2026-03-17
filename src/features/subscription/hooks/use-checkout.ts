'use client';

import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import type { SubscriptionPeriod } from '../types';

interface CreateCheckoutSessionPayload {
  planId: SubscriptionPeriod;
  successUrl: string;
  cancelUrl: string;
}

interface CheckoutSessionResponse {
  url: string;
}

/**
 * Mutation hook for creating a Stripe Checkout session.
 * On success, redirects the browser to the Stripe-hosted checkout page.
 */
export function useCheckout() {
  const mutation = useMutation({
    mutationFn: (payload: CreateCheckoutSessionPayload) =>
      apiClient.post<CheckoutSessionResponse>('/subscriptions/checkout', payload),
    onSuccess: (data) => {
      window.location.href = data.url;
    },
  });

  return {
    createCheckoutSession: mutation.mutate,
    isPending: mutation.isPending,
    error: mutation.error,
    isError: mutation.isError,
  };
}
