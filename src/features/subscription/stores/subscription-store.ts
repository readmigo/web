import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SubscriptionTier, SubscriptionStatus, SubscriptionState } from '../types';

interface SubscriptionStoreState {
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  isActive: boolean;
  expiresAt?: string;
  willRenew: boolean;
  isLoading: boolean;

  setSubscription: (state: SubscriptionState) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

export const useSubscriptionStore = create<SubscriptionStoreState>()(
  persist(
    (set) => ({
      tier: 'FREE',
      status: 'EXPIRED',
      isActive: false,
      expiresAt: undefined,
      willRenew: false,
      isLoading: false,

      setSubscription: (state) =>
        set({
          tier: state.tier,
          status: state.status,
          isActive: state.isActive,
          expiresAt: state.expiresAt,
          willRenew: state.willRenew,
        }),

      setLoading: (loading) => set({ isLoading: loading }),

      reset: () =>
        set({
          tier: 'FREE',
          status: 'EXPIRED',
          isActive: false,
          expiresAt: undefined,
          willRenew: false,
        }),
    }),
    {
      name: 'readmigo_subscription',
      partialize: (state) => ({
        tier: state.tier,
        status: state.status,
        isActive: state.isActive,
        expiresAt: state.expiresAt,
        willRenew: state.willRenew,
      }),
    },
  ),
);
